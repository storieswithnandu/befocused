import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const result = await pool.sql`SELECT * FROM users WHERE email = ${email}`;
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.reset_code !== code) {
            return res.status(401).json({ message: 'Invalid security code' });
        }

        const expiry = new Date(user.reset_code_expiry);
        if (expiry < new Date()) {
            return res.status(401).json({ message: 'Security code expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset code
        await pool.sql`
            UPDATE users 
            SET password = ${hashedPassword}, reset_code = NULL, reset_code_expiry = NULL 
            WHERE email = ${email}
        `;

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err: any) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}
