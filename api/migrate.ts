import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await pool.sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6);`;
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expiry TIMESTAMP;`;

        await pool.sql`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, deadline TIMESTAMP, subject TEXT, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject TEXT;`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`;
        await pool.sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        await pool.sql`CREATE TABLE IF NOT EXISTS habits (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, frequency TEXT DEFAULT 'daily', category TEXT, goal INTEGER DEFAULT 1, streak INTEGER DEFAULT 0, completed_dates TEXT[], color TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        await pool.sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS description TEXT;`;
        await pool.sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        await pool.sql`CREATE TABLE IF NOT EXISTS timetable (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, subject TEXT NOT NULL, location TEXT, color TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        await pool.sql`ALTER TABLE timetable ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        await pool.sql`CREATE TABLE IF NOT EXISTS grades (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, subject TEXT NOT NULL, score DOUBLE PRECISION NOT NULL, max_score DOUBLE PRECISION NOT NULL, date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, type TEXT NOT NULL, weight DOUBLE PRECISION, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        await pool.sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;

        const { rows: allUsers } = await pool.sql`SELECT id, email FROM users`;
        const seededUsers: string[] = [];

        for (const user of allUsers) {
            const email = (user.email || '').toLowerCase();
            const isNandu = email === 'storieswithnandu@gmail.com' || email === 'nandujm86@gmail.com' || email === 'nandumanoj.nmc@gmail.com' || email.includes('nandujm') || email.includes('nandu') || email.includes('storieswithnandu');
            if (isNandu) {
                const { rows: existing } = await pool.sql`SELECT id FROM timetable WHERE user_id = ${user.id} LIMIT 1`;
                if (existing.length === 0) {
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
                    seededUsers.push(email);
                }
            }
        }
        return res.status(200).json({ message: 'Migration complete', users_all: allUsers.map((u: any) => u.email), seeded_for: seededUsers });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
