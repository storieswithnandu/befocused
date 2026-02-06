import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

const transformEntry = (row: any) => ({
    id: row.id,
    day: row.day,
    startTime: row.start_time,
    endTime: row.end_time,
    subject: row.subject,
    location: row.location,
    color: row.color,
    createdAt: row.created_at
});

import process from 'node:process';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const user = verifyToken(req);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

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
                return res.status(200).json(rows.map(transformEntry));
            }

            case 'POST': {
                const { day, startTime, endTime, subject, location, color } = req.body;
                if (!day || !startTime || !endTime || !subject) {
                    return res.status(400).json({ message: 'All fields are required' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO timetable (user_id, day, start_time, end_time, subject, location, color)
                    VALUES (${user.userId}, ${day}, ${startTime}, ${endTime}, ${subject}, ${location || null}, ${color || null})
                    RETURNING *
                `;
                return res.status(201).json(transformEntry(rows[0]));
            }

            case 'PUT': {
                const { id, day, startTime, endTime, subject, location, color } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Entry ID is required' });
                }

                const entryId = parseInt(id.toString());
                if (isNaN(entryId)) {
                    return res.status(400).json({ message: 'Invalid Entry ID format' });
                }

                const { rowCount, rows } = await pool.sql`
                    UPDATE timetable 
                    SET day = COALESCE(${day === undefined ? null : day}, day),
                        start_time = COALESCE(${startTime === undefined ? null : startTime}, start_time),
                        end_time = COALESCE(${endTime === undefined ? null : endTime}, end_time),
                        subject = COALESCE(${subject === undefined ? null : subject}, subject),
                        location = CASE WHEN ${location === undefined} THEN location ELSE ${location === undefined ? null : location} END,
                        color = CASE WHEN ${color === undefined} THEN color ELSE ${color === undefined ? null : color} END
                    WHERE id = ${entryId} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Entry not found' });
                }

                return res.status(200).json(transformEntry(rows[0]));
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Entry ID is required' });
                }

                const entryId = parseInt(id.toString());
                if (isNaN(entryId)) {
                    return res.status(400).json({ message: 'Invalid Entry ID format' });
                }

                const { rowCount } = await pool.sql`
                    DELETE FROM timetable 
                    WHERE id = ${entryId} AND user_id = ${user.userId}
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
        console.error('[Timetable API Error]:', err);
        return res.status(500).json({
            message: 'Internal server error in Timetable API handler',
            error: err.message,
            stack: err.stack,
            code: err.code
        });
    }
}
