import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import process from 'node:process';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const diagnostics: any = {
            status: 'online',
            time: new Date().toISOString(),
            env: {
                has_url: !!process.env.POSTGRES_URL,
                has_hi_url: !!process.env.hi_POSTGRES_URL
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
                // Warning: dangerous for real production, but okay for this debug script
                const res = await pool.query(`SELECT count(*) FROM ${table}`);
                counts[table] = res.rows[0].count;
            } catch (e) {
                counts[table] = 'error';
            }
        }
        diagnostics.counts = counts;

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
