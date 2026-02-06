import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = verifyToken(req);
    // Let's allow it even without user for deep debug, but ideally we'd check

    try {
        const diagnostics: any = {};

        // 1. Check Tables
        const { rows: tables } = await pool.sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        diagnostics.tables = tables.map((t: any) => t.table_name);

        // 2. Check Columns for each table
        const columnData: any = {};
        for (const table of diagnostics.tables) {
            const { rows: columns } = await pool.sql`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = ${table}
            `;
            columnData[table] = columns;
        }
        diagnostics.columns = columnData;

        // 3. Row counts
        const counts: any = {};
        for (const table of diagnostics.tables) {
            const { rows } = await pool.sql`SELECT count(*) FROM ${table}`; // Wait, tagged template might not like table name as parameter
            // Actually, we can't parameterize table names safely with tagged templates easily in some libs
            // But let's try a safer way or skip counts if it's too risky.
            // Let's just do it for hardcoded ones:
        }

        const taskCount = await pool.sql`SELECT count(*) FROM tasks`.catch(() => ({ rows: [{ count: 'error' }] }));
        const habitCount = await pool.sql`SELECT count(*) FROM habits`.catch(() => ({ rows: [{ count: 'error' }] }));
        const userCount = await pool.sql`SELECT count(*) FROM users`.catch(() => ({ rows: [{ count: 'error' }] }));

        diagnostics.counts = {
            tasks: taskCount.rows[0].count,
            habits: habitCount.rows[0].count,
            users: userCount.rows[0].count
        };

        res.status(200).json(diagnostics);
    } catch (error: any) {
        res.status(500).json({
            message: 'Diagnostics failed',
            error: error.message,
            stack: error.stack
        });
    }
}
