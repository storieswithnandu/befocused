import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import process from 'node:process';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // USERS TABLE (Ensure columns exist)
        await pool.sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Ensure reset columns exist if table was created earlier
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6);`;
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expiry TIMESTAMP;`;

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

        // Ensure all task columns exist (in case table was created earlier)
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject TEXT;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

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
        await pool.sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS description TEXT;`;
        await pool.sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

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
        await pool.sql`ALTER TABLE timetable ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        // GRADES TABLE (Academic Achievements)
        await pool.sql`
            CREATE TABLE IF NOT EXISTS grades (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                score DOUBLE PRECISION NOT NULL,
                max_score DOUBLE PRECISION NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                type TEXT NOT NULL,
                weight DOUBLE PRECISION,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        // INDEXES
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);`;
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);`;
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_timetable_user ON timetable(user_id);`;
        await pool.sql`CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_id);`;

        // SEEDING (Restore Nandu's Timetable if empty)
        const { rows: nanduUsers } = await pool.sql`
            SELECT id FROM users 
            WHERE lower(email) IN ('storieswithnandu@gmail.com', 'nandujm86@gmail.com')
        `;

        for (const user of nanduUsers) {
            const { rowCount: entryCount } = await pool.sql`
                SELECT id FROM timetable WHERE user_id = ${user.id} LIMIT 1
            `;

            if (entryCount === 0) {
                console.log(`Seeding timetable for user ${user.id}`);
                await pool.sql`
                    INSERT INTO timetable (user_id, day, start_time, end_time, subject, location, color)
                    VALUES 
                        (${user.id}, 'Monday', '08:00', '09:50', 'Statistical Mechanics', 'Classroom', null),
                        (${user.id}, 'Monday', '10:00', '10:50', 'Electronics & Instrumentation', 'Classroom', null),
                        (${user.id}, 'Monday', '11:00', '11:50', 'Atomic & Molecular Physics', 'Classroom', null),
                        (${user.id}, 'Monday', '12:05', '12:55', 'Humanities', 'Course', null),
                        (${user.id}, 'Monday', '14:00', '16:45', 'Lab', 'Laboratory', null),
                        (${user.id}, 'Tuesday', '08:00', '09:50', 'Quantum Mechanics II', 'Classroom', null),
                        (${user.id}, 'Wednesday', '08:00', '09:50', 'Quantum Mechanics II', 'Classroom', null),
                        (${user.id}, 'Wednesday', '10:00', '11:50', 'Statistical Mechanics', 'Classroom', null),
                        (${user.id}, 'Wednesday', '12:05', '12:55', 'Humanities', 'Course', null),
                        (${user.id}, 'Thursday', '09:00', '11:45', 'Electronics Lab', 'Laboratory', null),
                        (${user.id}, 'Friday', '09:00', '10:50', 'Atomic & Molecular Physics', 'Classroom', null),
                        (${user.id}, 'Friday', '11:00', '11:50', 'Electronics & Instrumentation', 'Classroom', null),
                        (${user.id}, 'Friday', '12:05', '12:55', 'Humanities', 'Course', null)
                `;
            }
        }

        return res.status(200).json({ message: 'Database tables synchronized and seeded!' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return res.status(500).json({ error: error.message });
    }
}
