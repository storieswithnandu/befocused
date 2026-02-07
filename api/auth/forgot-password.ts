import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { Resend } from 'resend';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const userResult = await pool.sql`SELECT id FROM users WHERE email = ${email}`;
    if (userResult.rows.length === 0) return res.status(200).json({ message: 'If an account exists, a code has been sent.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.sql`UPDATE users SET reset_code = ${code}, reset_code_expiry = ${expiry.toISOString()} WHERE email = ${email}`;

    const { error } = await resend.emails.send({
      from: 'FocusCore <onboarding@resend.dev>',
      to: [email],
      subject: 'Your FocusCore Security Code',
      html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Code: ${code}</h2></div>`,
    });

    if (error) return res.status(500).json({ message: 'Email failed', error: error.message });
    return res.status(200).json({ message: 'Code sent' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Error', error: err.message });
  }
}
