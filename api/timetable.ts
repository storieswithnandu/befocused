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
                    SELECT * FROM timetable 
                    WHERE user_id = ${user.userId} 
                    ORDER BY 
                        CASE day
                            WHEN 'Monday' THEN 1
                            WHEN 'Tuesday' THEN 2
                            WHEN 'Wednesday' THEN 3
                            WHEN 'Thursday' THEN 4
                            WHEN 'Friday' THEN 5
                            WHEN 'Saturday' THEN 6
                            WHEN 'Sunday' THEN 7
                        END,
                        start_time ASC
                `;
                return res.status(200).json(rows);
            }

            case 'POST': {
                const { day, start_time, end_time, subject } = req.body;
                if (!day || !start_time || !end_time || !subject) {
                    return res.status(400).json({ message: 'All fields are required' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO timetable (user_id, day, start_time, end_time, subject)
                    VALUES (${user.userId}, ${day}, ${start_time}, ${end_time}, ${subject})
                    RETURNING *
                `;
                return res.status(201).json(rows[0]);
            }

            case 'PUT': {
                const { id, day, start_time, end_time, subject } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Entry ID is required' });
                }

                const { rowCount, rows } = await pool.sql`
                    UPDATE timetable 
                    SET day = COALESCE(${day}, day),
                        start_time = COALESCE(${start_time}, start_time),
                        end_time = COALESCE(${end_time}, end_time),
                        subject = COALESCE(${subject}, subject)
                    WHERE id = ${id} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Entry not found' });
                }

                return res.status(200).json(rows[0]);
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Entry ID is required' });
                }

                const { rowCount } = await pool.sql`
                    DELETE FROM timetable 
                    WHERE id = ${id} AND user_id = ${user.userId}
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Entry not found' });
                }

                return res.status(200).json({ message: 'Entry deleted' });
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
