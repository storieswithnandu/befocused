import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';
import process from 'node:process';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userToken = verifyToken(req);
        const diagnostics: any = {
            status: 'online',
            time: new Date().toISOString(),
            currentUser: userToken || 'No valid token',
            env: {
                has_url: !!process.env.POSTGRES_URL,
                has_hi_url: !!process.env.hi_POSTGRES_URL,
                has_jwt: !!process.env.JWT_SECRET
            }
        };

        const { rows: tables } = await pool.sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        diagnostics.tables = tables.map((t: any) => t.table_name);

        const counts: any = {};
        for (const table of diagnostics.tables) {
            try {
                const res = await pool.query(`SELECT count(*) FROM "${table}"`);
                counts[table] = res.rows[0].count;
            } catch (e) {
                counts[table] = 'error';
            }
        }
        diagnostics.counts = counts;

        // Safely list users to see why migration fails
        const { rows: users } = await pool.sql`SELECT id, email, name FROM users LIMIT 10`;
        diagnostics.users = users;

        return res.status(200).json(diagnostics);
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
            stack: error.stack,
            env_check: {
                node_version: process.version,
                platform: process.platform
            }
        });
    }
}
