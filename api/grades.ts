import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

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
                    SELECT * FROM grades 
                    WHERE user_id = ${user.userId} 
                    ORDER BY date DESC
                `;
                // Map snake_case to camelCase for frontend consistency if needed, 
                // but usually we can handle this on frontend or keep snake_case.
                // For now returning as is (snake_case columns).
                return res.status(200).json(rows);
            }

            case 'POST': {
                const { subject, score, maxScore, date, type, weight } = req.body;
                if (!subject || score === undefined || maxScore === undefined || !type) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO grades (user_id, subject, score, max_score, date, type, weight)
                    VALUES (${user.userId}, ${subject}, ${score}, ${maxScore}, ${date || new Date()}, ${type}, ${weight || null})
                    RETURNING *
                `;
                return res.status(201).json(rows[0]);
            }

            case 'PUT': {
                const { id, subject, score, maxScore, date, type, weight } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Grade ID is required' });
                }

                const { rowCount, rows } = await pool.sql`
                    UPDATE grades 
                    SET subject = COALESCE(${subject}, subject),
                        score = COALESCE(${score}, score),
                        max_score = COALESCE(${maxScore}, max_score),
                        date = COALESCE(${date}, date),
                        type = COALESCE(${type}, type),
                        weight = COALESCE(${weight}, weight)
                    WHERE id = ${id} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Grade entry not found' });
                }

                return res.status(200).json(rows[0]);
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Grade ID is required' });
                }

                const { rowCount } = await pool.sql`
                    DELETE FROM grades 
                    WHERE id = ${id} AND user_id = ${user.userId}
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Grade entry not found' });
                }

                return res.status(200).json({ message: 'Grade entry deleted' });
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
