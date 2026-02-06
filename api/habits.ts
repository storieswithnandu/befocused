import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

const transformHabit = (row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    frequency: row.frequency,
    category: row.category,
    goal: row.goal,
    streak: row.streak,
    completedDates: row.completed_dates || [],
    color: row.color,
    createdAt: row.created_at
});

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
                return res.status(200).json(rows.map(transformHabit));
            }

            case 'POST': {
                const { title, frequency, category, goal, streak, completedDates, color } = req.body;
                if (!title) {
                    return res.status(400).json({ message: 'Title is required' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO habits (user_id, title, frequency, category, goal, streak, completed_dates, color)
                    VALUES (${user.userId}, ${title}, ${frequency || 'daily'}, ${category || null}, ${goal || 1}, ${streak || 0}, ${completedDates || []}, ${color || null})
                    RETURNING *
                `;
                return res.status(201).json(transformHabit(rows[0]));
            }

            case 'PUT': {
                const { id, title, frequency, category, goal, streak, completedDates, color } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Habit ID is required' });
                }

                const { rowCount, rows } = await pool.sql`
                    UPDATE habits 
                    SET title = COALESCE(${title === undefined ? null : title}, title),
                        frequency = COALESCE(${frequency === undefined ? null : frequency}, frequency),
                        category = CASE WHEN ${category === undefined} THEN category ELSE ${category === undefined ? null : category} END,
                        goal = COALESCE(${goal === undefined ? null : goal}, goal),
                        streak = COALESCE(${streak === undefined ? null : streak}, streak),
                        completed_dates = COALESCE(${completedDates === undefined ? null : completedDates}, completed_dates),
                        color = CASE WHEN ${color === undefined} THEN color ELSE ${color === undefined ? null : color} END
                    WHERE id = ${parseInt(id.toString())} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Habit not found' });
                }

                return res.status(200).json(transformHabit(rows[0]));
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
