import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // FORCE 200 so we don't see the Vercel 500 page
    try {
        const results: any = {
            status: 'diagnostic_mode_v2',
            time: new Date().toISOString(),
            env: {
                has_url: !!process.env.POSTGRES_URL,
                has_hi_url: !!process.env.hi_POSTGRES_URL,
                node_version: process.version
            }
        };

        // Attempt dynamic import for postgres to isolate failures
        try {
            const { createPool } = await import('@vercel/postgres');
            const pool = createPool({
                connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
            });

            const { rows: tables } = await pool.sql`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `;
            results.tables = tables.map((t: any) => t.table_name);

            const counts: any = {};
            for (const table of results.tables) {
                try {
                    const countRes = await pool.query(`SELECT count(*) as count FROM "${table}"`);
                    counts[table] = countRes.rows[0].count;
                } catch (ce: any) {
                    counts[table] = ce.message;
                }
            }
            results.counts = counts;

            const { rows: users } = await pool.sql`SELECT id, email FROM users LIMIT 10`;
            results.users = users;

        } catch (dbErr: any) {
            results.db_error = dbErr.message;
            results.db_stack = dbErr.stack;
        }

        return res.status(200).json(results);

    } catch (critical: any) {
        return res.status(200).json({
            status: 'unrecoverable_error',
            error: critical.message,
            stack: critical.stack
        });
    }
}
