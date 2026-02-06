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

const transformGrade = (row: any) => ({
    id: row.id,
    subject: row.subject,
    score: row.score,
    maxScore: row.max_score,
    date: row.date,
    type: row.type,
    weight: row.weight,
    createdAt: row.created_at
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const user = verifyToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { method } = req;
        switch (method) {
            case 'GET': {
                const { rows } = await pool.sql`SELECT * FROM grades WHERE user_id = ${user.userId} ORDER BY date DESC`;
                return res.status(200).json(rows.map(transformGrade));
            }
            case 'POST': {
                const { subject, score, maxScore, date, type, weight } = req.body;
                if (!subject || score === undefined || maxScore === undefined || !type) return res.status(400).json({ message: 'Missing fields' });
                const { rows } = await pool.sql`
                    INSERT INTO grades (user_id, subject, score, max_score, date, type, weight)
                    VALUES (${user.userId}, ${subject}, ${score}, ${maxScore}, ${date || new Date().toISOString()}, ${type}, ${weight || null})
                    RETURNING *
                `;
                return res.status(201).json(transformGrade(rows[0]));
            }
            case 'PUT': {
                const { id, subject, score, maxScore, date, type, weight } = req.body;
                if (!id) return res.status(400).json({ message: 'ID required' });
                const gradeId = parseInt(id.toString());
                const { rowCount, rows } = await pool.sql`
                    UPDATE grades 
                    SET subject = COALESCE(${subject === undefined ? null : subject}, subject),
                        score = COALESCE(${score === undefined ? null : score}, score),
                        max_score = COALESCE(${maxScore === undefined ? null : maxScore}, max_score),
                        date = COALESCE(${date === undefined ? null : date}, date),
                        type = COALESCE(${type === undefined ? null : type}, type),
                        weight = CASE WHEN ${weight === undefined} THEN weight ELSE ${weight === undefined ? null : weight} END
                    WHERE id = ${gradeId} AND user_id = ${user.userId}
                    RETURNING *
                `;
                if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
                return res.status(200).json(transformGrade(rows[0]));
            }
            case 'DELETE': {
                const { id } = req.query;
                if (!id) return res.status(400).json({ message: 'ID required' });
                const gradeId = parseInt(id.toString());
                const { rowCount } = await pool.sql`DELETE FROM grades WHERE id = ${gradeId} AND user_id = ${user.userId}`;
                if (rowCount === 0) return res.status(404).json({ message: 'Not found' });
                return res.status(200).json({ message: 'Deleted' });
            }
            default:
                return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    } catch (err: any) {
        return res.status(500).json({ message: 'Grades API error', error: err.message });
    }
}
