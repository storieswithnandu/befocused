import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { verifyToken } from './utils/auth';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const diagnostics: any = {
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

        res.status(200).json(diagnostics);
    } catch (error: any) {
        res.status(500).json({
            message: 'Diagnostics failed',
            error: error.message,
            stack: error.stack
        });
    }
}
