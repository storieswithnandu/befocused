import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

const transformTask = (row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    subject: row.subject,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

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
                    SELECT * FROM tasks 
                    WHERE user_id = ${user.userId} 
                    ORDER BY 
                        CASE 
                            WHEN deadline IS NULL THEN 1 
                            ELSE 0 
                        END, 
                        deadline ASC, 
                        created_at DESC
                `;
                return res.status(200).json(rows.map(transformTask));
            }

            case 'POST': {
                const { title, description, deadline, subject, priority, status } = req.body;
                if (!title) {
                    return res.status(400).json({ message: 'Title is required' });
                }

                const { rows } = await pool.sql`
                    INSERT INTO tasks (user_id, title, description, deadline, subject, priority, status)
                    VALUES (${user.userId}, ${title}, ${description || null}, ${deadline || null}, ${subject || null}, ${priority || 'medium'}, ${status || 'pending'})
                    RETURNING *
                `;
                return res.status(201).json(transformTask(rows[0]));
            }

            case 'PUT': {
                const { id, title, description, deadline, subject, priority, status } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Task ID is required' });
                }

                console.log(`[Tasks API] Updating task ${id} for user ${user.userId}`);

                const { rowCount, rows } = await pool.sql`
                    UPDATE tasks 
                    SET title = COALESCE(${title === undefined ? null : title}, title),
                        description = CASE WHEN ${description === undefined} THEN description ELSE ${description === undefined ? null : description} END,
                        deadline = CASE WHEN ${deadline === undefined} THEN deadline ELSE ${deadline === undefined ? null : (deadline || null)} END,
                        subject = CASE WHEN ${subject === undefined} THEN subject ELSE ${subject === undefined ? null : subject} END,
                        priority = COALESCE(${priority === undefined ? null : priority}, priority),
                        status = COALESCE(${status === undefined ? null : status}, status),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${parseInt(id.toString())} AND user_id = ${user.userId}
                    RETURNING *
                `;

                if (rowCount === 0) {
                    return res.status(404).json({ message: 'Task not found' });
                }

                return res.status(200).json(transformTask(rows[0]));
            }

            case 'DELETE': {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ message: 'Task ID is required' });
                }

                console.log(`[Tasks API] Deleting task ${id} for user ${user.userId}`);

                const { rowCount } = await pool.sql`
                    DELETE FROM tasks 
                    WHERE id = ${parseInt(id.toString())} AND user_id = ${user.userId}
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
        console.error('[Tasks API Error]:', err);
        return res.status(500).json({
            message: 'Internal server error in Tasks API handler',
            error: err.message,
            stack: err.stack,
            code: err.code
        });
    }
}
