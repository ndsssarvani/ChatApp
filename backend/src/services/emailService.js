import nodemailer from 'nodemailer';

let activeTransporter = null;
let testAccount = null;

/**
 * Initialize / Retrieve active transporter
 */
const getTransporter = async () => {
  if (activeTransporter) {
    return activeTransporter;
  }

  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (user && pass && user !== 'your_email@gmail.com') {
    activeTransporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return activeTransporter;
  }

  // If credentials are not configured, create a real Ethereal test account in development
  try {
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    activeTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return activeTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not initialize test transporter:', err.message);
    return null;
  }
};

/**
 * Verify transporter connection on server start
 */
export const verifyEmailTransport = async () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || '587';

  if (user && pass && user !== 'your_email@gmail.com') {
    try {
      const transporter = await getTransporter();
      if (transporter) {
        await transporter.verify();
        console.log(`[EmailService] ✓ SMTP connection verified successfully to ${host}:${port} (${user})`);
        return true;
      }
    } catch (err) {
      console.error(`[EmailService SMTP ERROR] Failed to connect to SMTP server ${host}:${port}:`, err.message);
      console.warn('[EmailService] Please verify your EMAIL_USER and EMAIL_PASSWORD (use an App Password for Gmail) in backend/.env');
      return false;
    }
  } else {
    console.log('[EmailService] ℹ️ SMTP credentials not configured in backend/.env. Using Ethereal test transport for local email delivery.');
    const transporter = await getTransporter();
    if (transporter && testAccount) {
      console.log(`[EmailService] ✓ Ethereal test mailer ready (${testAccount.user})`);
    }
    return true;
  }
};

const getFromAddress = () => {
  return process.env.EMAIL_FROM || `"Chatify Support" <${process.env.EMAIL_USER || 'no-reply@chatify.io'}>`;
};

/**
 * Send Password Reset Email with Link
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = await getTransporter();
  const userName = name || 'there';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Chatify password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">💬</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Chatify</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Password Reset Request</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                We received a request to reset your Chatify account password. Click the secure button below to choose a new password:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin: 24px 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
                ⏰ <strong>Security Notice:</strong> This reset link is valid for <strong>30 minutes</strong> and can only be used once.
              </div>

              <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #64748b;">
                If the button above does not work, copy and paste this link into your web browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; color: #0284c7; word-break: break-all; line-height: 1.4;">
                <a href="${resetUrl}" style="color: #0284c7; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account remains secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Chatify. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!transporter) {
    console.error('[EmailService Error] No active email transporter available.');
    throw new Error('Email service is unavailable. Please verify SMTP configuration.');
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: 'Reset your Chatify password',
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] ✉️ Reset Email Sent! Preview URL: ${previewUrl}`);
    } else {
      console.log(`[EmailService] ✉️ Reset Email Sent successfully to ${to} (MessageId: ${info.messageId})`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send password reset email to ${to}:`, err.message);
    throw new Error(`Email sending failed: ${err.message}`);
  }
};

/**
 * Send 6-Digit Verification Code (OTP) Email
 */
export const sendOTPEmail = async ({ to, name, otpCode, purpose = 'login' }) => {
  const transporter = await getTransporter();
  const userName = name || 'there';

  const purposeText =
    purpose === 'login'
      ? 'sign in to your Chatify account'
      : purpose === 'verify_email'
      ? 'verify your Chatify email address'
      : 'complete your authentication request';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Chatify verification code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">💬</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Chatify</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Your Verification Code</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #475569;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                Use the following 6-digit verification code to ${purposeText}:
              </p>
              
              <!-- OTP Code Display -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 16px 36px; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 14px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: monospace;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin: 24px 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
                ⏰ <strong>Notice:</strong> This verification code expires in <strong>5 minutes</strong>. Never share this code with anyone. Chatify staff will never ask for your code.
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you did not request this verification code, someone may have entered your email by mistake. You can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Chatify. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!transporter) {
    console.error('[EmailService Error] No active email transporter available.');
    throw new Error('Email service is unavailable. Please verify SMTP configuration.');
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: 'Your Chatify verification code',
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] ✉️ Verification Code Email Sent! Preview URL: ${previewUrl}`);
    } else {
      console.log(`[EmailService] ✉️ Verification Code Email Sent successfully to ${to} (MessageId: ${info.messageId})`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send OTP email to ${to}:`, err.message);
    throw new Error(`Email sending failed: ${err.message}`);
  }
};
