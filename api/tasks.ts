import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

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

        const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
        return decoded;
    } catch (error) {
        return null;
    }
}

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { method } = req;

        switch (method) {
            case 'GET': {
                const { rows } = await pool.sql`
                    SELECT * FROM tasks 
                    WHERE user_id = ${user.userId} 
                    ORDER BY created_at DESC
                `;
                return res.status(200).json(rows);
            }

            case 'POST': {
                const { title, description, deadline, priority, status } = req.body;
                if (!title) {
                    return res.status(400).json({ message: 'Title is required' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO tasks (user_id, title, description, deadline, priority, status, created_at)
                    VALUES (${user.userId}, ${title}, ${description || ''}, ${deadline || null}, ${priority || 'medium'}, ${status || 'pending'}, NOW())
                    RETURNING *
                `;
                return res.status(201).json(rows[0]);
            }

            case 'PUT': {
                const { id, title, description, deadline, priority, status } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Task ID is required' });
                }

                // Verify ownership and update
                const { rowCount, rows } = await pool.sql`
                    UPDATE tasks 
                    SET title = COALESCE(${title}, title),
                        description = COALESCE(${description}, description),
                        deadline = COALESCE(${deadline}, deadline),
                        priority = COALESCE(${priority}, priority),
                        status = COALESCE(${status}, status)
                    WHERE id = ${id} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Task not found or not owned by user' });
                }

                return res.status(200).json(rows[0]);
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Task ID is required' });
                }

                const { rowCount } = await pool.sql`
                    DELETE FROM tasks 
                    WHERE id = ${id} AND user_id = ${user.userId}
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Task not found' });
                }

                return res.status(200).json({ message: 'Task deleted' });
            }

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    } catch (err: any) {
        console.error('API Error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}
