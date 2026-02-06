import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // MOCK RESPONSE TO TEST DEPLOYMENT
    res.status(200).json([
        {
            id: 999,
            title: 'Test Task (System is working)',
            description: 'If you see this, the API is running!',
            status: 'pending',
            priority: 'high',
            createdAt: new Date()
        }
    ]);
}
