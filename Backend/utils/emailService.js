const nodemailer = require('nodemailer');

/**
 * Sends a premium-styled OTP email to the user.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} otp - The 6-digit OTP code.
 */
async function sendOtpEmail(toEmail, otp) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log(`[EmailService] Attempting to send to ${toEmail} using ${emailUser}`);
  console.log(`[EmailService] Pass length: ${emailPass ? emailPass.length : 0}`);

  // If no credentials, log the OTP for local testing
  if (!emailUser || emailUser === 'your-gmail@gmail.com' || !emailPass || emailPass === 'your-password') {
    console.log('\n==========================================');
    console.log('      DEVELOPMENT MODE: OTP LOG');
    console.log(`      To: ${toEmail}`);
    console.log(`      OTP: ${otp}`);
    console.log('==========================================\n');
    return { success: true, devMode: true };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      // This bypasses the 'self-signed certificate' error caused by some 
      // antivirus/firewalls that intercept the connection.
      rejectUnauthorized: false,
    },
  });

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 24px; letter-spacing: -0.02em;">iLost Verification</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Security check for your account</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 32px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Use the code below to sign in:</p>
        <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 0.25em; margin: 0;">${otp}</div>
      </div>
      
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
        This code will expire in <strong>2 minutes</strong>. If you didn't request this code, you can safely ignore this email.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <div style="text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} iLost Management System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"iLost Support" <${emailUser}>`,
      to: toEmail,
      subject: `Your iLost Verification Code: ${otp}`,
      html: htmlContent,
      text: `Your iLost verification code is ${otp}. It expires in 2 minutes.`,
    });
    return { success: true, devMode: false };
  } catch (error) {
    console.error('[EmailService] FULL ERROR:', error);
    throw new Error(`Email failed: ${error.message}`);
  }
}

module.exports = { sendOtpEmail };
