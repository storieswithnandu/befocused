import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // TASKS TABLE
        await pool.sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                deadline TIMESTAMP,
                subject TEXT,
                priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
                status TEXT CHECK (status IN ('pending', 'in-progress', 'done')) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // HABITS TABLE
        await pool.sql`
            CREATE TABLE IF NOT EXISTS habits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                frequency TEXT CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily',
                category TEXT,
                goal INTEGER DEFAULT 1,
                streak INTEGER DEFAULT 0,
                completed_dates TEXT[],
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // TIMETABLE TABLE
        await pool.sql`
            CREATE TABLE IF NOT EXISTS timetable (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                day TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                subject TEXT NOT NULL,
                location TEXT,
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // INDEXES
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);`;
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);`;
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_timetable_user ON timetable(user_id);`;

        return res.status(200).json({ message: 'Database tables created successfully!' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return res.status(500).json({ error: error.message });
    }
}
