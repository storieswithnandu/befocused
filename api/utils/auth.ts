import { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export interface DecodedUser {
    userId: number;
    email: string;
}

export function verifyToken(req: VercelRequest): DecodedUser | null {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;

        const token = authHeader.split(' ')[1];
        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
        return decoded;
    } catch (error) {
        return null; // Invalid token
    }
}
