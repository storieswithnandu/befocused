import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        return res.status(200).json({
            status: 'online',
            message: 'Shield active',
            time: new Date().toISOString(),
            env: {
                has_url: !!process.env.POSTGRES_URL,
                has_hi_url: !!process.env.hi_POSTGRES_URL
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
