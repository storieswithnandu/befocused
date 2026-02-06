import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { rows } = await pool.sql`SELECT version();`;
        res.status(200).json({ message: 'Database connection successful!', version: rows[0].version });
    } catch (error: any) {
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
}
