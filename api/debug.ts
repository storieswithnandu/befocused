import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // We use a high-level try-catch to ensure we return SOMETHING useful
    try {
        const diagnostics: any = {
            status: 'diagnostic_mode',
            timestamp: new Date().toISOString(),
            headers: {
                auth: !!req.headers.authorization,
                host: req.headers.host
            },
            env: {
                POSTGRES_URL: !!process.env.POSTGRES_URL,
                hi_POSTGRES_URL: !!process.env.hi_POSTGRES_URL,
                JWT_SECRET: !!process.env.JWT_SECRET,
                NODE_ENV: process.env.NODE_ENV
            }
        };

        // Try to initialize pool inside to catch errors
        let pool;
        try {
            pool = createPool({
                connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
            });
            diagnostics.pool_init = 'success';
        } catch (poolErr: any) {
            diagnostics.pool_init = 'failed';
            diagnostics.pool_error = poolErr.message;
        }

        if (pool) {
            try {
                const { rows: tables } = await pool.sql`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                `;
                diagnostics.tables = tables.map((t: any) => t.table_name);

                const counts: any = {};
                for (const table of diagnostics.tables) {
                    try {
                        // Use raw query for identifier interpolation
                        const result = await pool.query(`SELECT count(*) as count FROM "${table}"`);
                        counts[table] = result.rows[0].count;
                    } catch (e: any) {
                        counts[table] = `err: ${e.message}`;
                    }
                }
                diagnostics.counts = counts;

                // Try to see users
                const { rows: users } = await pool.sql`SELECT id, email FROM users LIMIT 5`;
                diagnostics.sample_users = users;

            } catch (dbErr: any) {
                diagnostics.db_query_error = dbErr.message;
                diagnostics.db_query_stack = dbErr.stack;
            }
        }

        // Check JWT logic manually
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
                    const decoded = jwt.verify(token, secret);
                    diagnostics.token_verification = { status: 'valid', decoded };
                } else {
                    diagnostics.token_verification = 'no_token_in_header';
                }
            } else {
                diagnostics.token_verification = 'no_auth_header';
            }
        } catch (jwtErr: any) {
            diagnostics.token_verification = { status: 'error', message: jwtErr.message };
        }

        return res.status(200).json(diagnostics);

    } catch (criticalErr: any) {
        // This is the "last ditch" response if everything above fails
        return res.status(200).json({
            status: 'critical_failure',
            error: criticalErr.message,
            stack: criticalErr.stack,
            env_keys: Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('JWT'))
        });
    }
}
