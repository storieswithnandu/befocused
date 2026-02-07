import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log('Starting manual todos table fix...');

        // 1. Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created or already exists.');

        // 2. Ensure columns exist (for robustness)
        await pool.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log('Columns verified.');

        // 3. Check if table is accessible
        const check = await pool.query('SELECT count(*) FROM todos');

        return res.status(200).json({
            message: 'To-do table fix applied successfully',
            current_count: check.rows[0].count
        });
    } catch (error: any) {
        console.error('Fix failed:', error);
        return res.status(500).json({
            message: 'Fix failed',
            error: error.message,
            detail: error.detail,
            stack: error.stack
        });
    }
}
