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
                    SELECT * FROM habits 
                    WHERE user_id = ${user.userId} 
                    ORDER BY id ASC
                `;
                return res.status(200).json(rows);
            }

            case 'POST': {
                const { title, frequency, completed_dates, streak } = req.body;
                if (!title) {
                    return res.status(400).json({ message: 'Title is required' });
                }

                // Convert array to Postgres array string format if needed, 
                // but node-postgres usually handles native arrays fine.
                // However, @vercel/postgres string template tagging helps.

                const { rows } = await pool.sql`
                    INSERT INTO habits (user_id, title, frequency, completed_dates, streak)
                    VALUES (${user.userId}, ${title}, ${frequency || 'daily'}, ${completed_dates || []}, ${streak || 0})
                    RETURNING *
                `;
                return res.status(201).json(rows[0]);
            }

            case 'PUT': {
                const { id, title, frequency, completed_dates, streak } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Habit ID is required' });
                }

                const { rowCount, rows } = await pool.sql`
                    UPDATE habits 
                    SET title = COALESCE(${title}, title),
                        frequency = COALESCE(${frequency}, frequency),
                        completed_dates = COALESCE(${completed_dates}, completed_dates),
                        streak = COALESCE(${streak}, streak)
                    WHERE id = ${id} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Habit not found' });
                }

                return res.status(200).json(rows[0]);
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Habit ID is required' });
                }

                const { rowCount } = await pool.sql`
                    DELETE FROM habits 
                    WHERE id = ${id} AND user_id = ${user.userId}
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Habit not found' });
                }

                return res.status(200).json({ message: 'Habit deleted' });
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
