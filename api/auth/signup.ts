import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing required fields' });

    try {
        await pool.sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                reset_code VARCHAR(6),
                reset_code_expiry TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const existingUser = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
        if (existingUser.rows.length > 0) return res.status(409).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.sql`
            INSERT INTO users (email, password, name) 
            VALUES (${email}, ${hashedPassword}, ${name}) 
            RETURNING id, email, name
        `;
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            user: { id: user.id, email: user.email, name: user.name },
            token,
        });
    } catch (err: any) {
        return res.status(500).json({ message: 'Signup error', error: err.message });
    }
}
