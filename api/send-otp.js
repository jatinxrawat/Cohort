import nodemailer from 'nodemailer';

export default async function handler(req, res) {
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

    const mailOptions = {
      from: `"Cohort Campus" <${user || 'no-reply@cohortnow.online'}>`,
      to: email.trim(),
      subject: 'Verify Your Email for Cohort',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #08080C; color: #F5F5F7; padding: 40px 20px; text-align: center;">
          <div style="max-w: 500px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 28px; font-weight: 900; letter-spacing: -0.05em; color: #FFFFFF;">Cohort<span style="color: #EC4899;">.</span></span>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 12px; color: #FFFFFF;">Email Verification</h2>
            <p style="font-size: 14px; color: #A1A1AA; line-height: 1.6; margin-bottom: 32px;">
              Welcome to Cohort! Use the verification code below to verify your email address and continue setting up your student profile.
            </p>
            <div style="background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%); padding: 16px 32px; border-radius: 16px; display: inline-block; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #FFFFFF; box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3); margin-bottom: 32px;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #71717A; line-height: 1.4;">
              This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.
            </p>
          </div>
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
