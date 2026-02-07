import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

interface DecodedUser {
    userId: number;
    email: string;
}

function verifyToken(req: VercelRequest): DecodedUser | null {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const token = authHeader.split(' ')[1];
        if (!token) return null;
        return jwt.verify(token, JWT_SECRET) as DecodedUser;
    } catch (e) {
        return null;
    }
}

const transformTodo = (row: any) => ({
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const user = verifyToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { method } = req;
        switch (method) {
            case 'GET': {
                const { rows } = await pool.sql`
                    SELECT * FROM todos 
                    WHERE user_id = ${user.userId} 
                    ORDER BY completed ASC, updated_at DESC
                `;
                return res.status(200).json(rows.map(transformTodo));
            }
            case 'POST': {
                const { title, completed } = req.body;
                if (!title) return res.status(400).json({ message: 'Title is required' });
                const { rows } = await pool.sql`
                    INSERT INTO todos (user_id, title, completed)
                    VALUES (${user.userId}, ${title}, ${completed || false})
                    RETURNING *
                `;
                return res.status(201).json(transformTodo(rows[0]));
            }
            case 'PUT': {
                const { id, title, completed } = req.body;
                if (!id) return res.status(400).json({ message: 'ID is required' });
                const todoId = parseInt(id.toString());

                const { rowCount, rows } = await pool.sql`
                    UPDATE todos 
                    SET title = COALESCE(${title === undefined ? null : title}, title),
                        completed = COALESCE(${completed === undefined ? null : completed}, completed),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${todoId} AND user_id = ${user.userId}
                    RETURNING *
                `;
                if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
                return res.status(200).json(transformTodo(rows[0]));
            }
            case 'DELETE': {
                const { id } = req.query;
                if (!id) return res.status(400).json({ message: 'ID is required' });
                const todoId = parseInt(id.toString());
                const { rowCount } = await pool.sql`DELETE FROM todos WHERE id = ${todoId} AND user_id = ${user.userId}`;
                if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
                return res.status(200).json({ message: 'Deleted' });
            }
            default:
                return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    } catch (err: any) {
        return res.status(500).json({ message: 'Todos API error', error: err.message });
    }
}
