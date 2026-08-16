import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Determine SMTP configuration
    let transporter;
    let usingEthereal = false;
    let etherealUrl = null;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      // Use custom SMTP server
      transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: parseInt(port) === 465,
        auth: { user, pass }
      });
    } else {
      // Fallback: Create ethereal email test account on-the-fly
      usingEthereal = true;
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch (ethErr) {
        console.error('Failed to create Ethereal test account:', ethErr);
        // Direct local printing mock if mail servers are unreachable
        return res.status(200).json({
          success: true,
          mocked: true,
          otp,
          message: 'Mail server unreachable. OTP logged to console/response.'
        });
      }
    }

    const senderEmail = (user === 'resend') ? 'no-reply@cohortnow.online' : user;
    const mailOptions = {
      from: `"Cohort" <${senderEmail}>`,
      to: email.trim(),
      subject: `${otp} is your Cohort verification code`,
      text: `Your Cohort verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; color: #111111; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px; color: #18181b;">Verify your email address</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 24px;">
            Thanks for starting your Cohort signup! Enter the following verification code when prompted to confirm your university email address.
          </p>
          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px 24px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #18181b; margin-bottom: 24px; font-family: monospace;">
            ${otp}
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #6b7280; margin-bottom: 0;">
            This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
            Cohort · Connect with your campus
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    if (usingEthereal) {
      etherealUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[OTP Sent to Ethereal] View test email: ${etherealUrl}`);
    }

    return res.status(200).json({
      success: true,
      previewUrl: etherealUrl,
      otp: usingEthereal ? otp : undefined // Return OTP to frontend only for ethereal dev testing
    });

  } catch (error) {
    console.error('Send OTP Handler Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send OTP email' });
  }
}
