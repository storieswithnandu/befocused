import { VercelRequest, VercelResponse } from '@vercel/node';
import { createPool } from '@vercel/postgres';
import { Resend } from 'resend';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.hi_POSTGRES_URL
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user exists
    const userResult = await pool.sql`SELECT * FROM users WHERE email = ${email}`;
    if (userResult.rowCount === 0) {
      // Don't reveal if user doesn't exist for security, but just stop here
      return res.status(200).json({ message: 'If an account exists, a code has been sent.' });
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Update user with reset code
    await pool.sql`
            UPDATE users 
            SET reset_code = ${code}, reset_code_expiry = ${expiry.toISOString()} 
            WHERE email = ${email}
        `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'FocusCore <onboarding@resend.dev>', // You should update this to your domain
      to: [email],
      subject: 'Your FocusCore Security Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #00f0ff;">FocusCore Security Code</h2>
          <p>Your security code for password reset is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00f0ff; margin: 20px 0;">
            ${code}
          </div>
          <p>This code is valid for 15 minutes.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Error]:', error);
      // If email fails, we still return the code in the response for DEVELOPMENT debugging
      // so the user isn't blocked by email delivery issues.
      return res.status(500).json({
        message: 'Database updated, but email failed to send.',
        error: error.message,
        debug_code: code // HELPFUL FOR STARTUP/DEV
      });
    }

    return res.status(200).json({
      message: 'Security code sent to your email',
      debug_code: code
    });
  } catch (err: any) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({
      message: 'Failed to process forgot password request',
      error: err.message,
      details: err.stack
    });
  }
}
