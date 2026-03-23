const nodemailer = require("nodemailer");

/**
 * Configure SMTP for Namecheap Private Email
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.privateemail.com",
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Shared HTML header/footer for consistent branding
const emailHeader = (title) => `
  <div style="font-family: 'Arial', sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #1a1a2e; padding: 25px 40px; text-align: center;">
      <img src="${process.env.FRONTEND_URL || 'https://altrademarkets.vercel.app'}/logo.png" 
           alt="CapitalTradeMarkets" 
           style="max-height: 50px; width: auto; display: block; margin: 0 auto;" />
    </div>
    <div style="padding: 36px 40px;">
      <h2 style="color: #1a1a2e; margin: 0 0 16px 0; font-size: 20px;">${title}</h2>
`;

const emailFooter = () => `
    </div>
    <div style="background: #f7fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="color: #718096; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} CapitalTradeMarkets. All rights reserved.</p>
      <p style="color: #a0aec0; font-size: 11px; margin: 6px 0 0 0;">
        Questions? Contact us at 
        <a href="mailto:support@capitaltrademarkets.net" style="color: #f4b942;">support@capitaltrademarkets.net</a>
      </p>
    </div>
  </div>
`;

/**
 * Send Welcome Email on Registration
 */
exports.welcomeEmail = async (firstName, email) => {
  const mailOptions = {
    from: `"CapitalTradeMarkets" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to CapitalTradeMarkets — Your Account is Ready!",
    html: `
      ${emailHeader(`Welcome aboard, ${firstName}! 🎉`)}
      <p style="color: #4a5568; font-size: 15px; line-height: 1.7;">
        Your account has been successfully created. You are now part of a growing community of smart investors.
      </p>
      <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
        <p style="color: #276749; font-size: 14px; margin: 0; font-weight: 600;">Here's how to start earning:</p>
        <ul style="color: #4a5568; font-size: 14px; line-height: 2; margin: 8px 0 0 0; padding-left: 20px;">
          <li>Log in to your dashboard</li>
          <li>Select your preferred <strong>Investment Plan</strong></li>
          <li>Make a secure payment for your chosen plan</li>
          <li>Your investment <strong>starts earning ROI automatically</strong> once our team confirms your payment!</li>
        </ul>
      </div>
      <p style="color: #718096; font-size: 13px; line-height: 1.6;">
        If you have any questions, our support team is available 24/7 at 
        <a href="mailto:support@capitaltrademarkets.net" style="color: #f4b942;">support@capitaltrademarkets.net</a>.
      </p>
      ${emailFooter()}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Welcome email sent to ${email}`);
  } catch (error) {
    console.error("[Email] Error sending welcome email:", error.message);
  }
};

/**
 * Send Password Reset Email
 */
exports.passwordResetEmail = async (firstName, token, email) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${token}`;

  const mailOptions = {
    from: `"CapitalTradeMarkets Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request — CapitalTradeMarkets",
    html: `
      ${emailHeader("Password Reset Request")}
      <p style="color: #4a5568; font-size: 15px; line-height: 1.7;">
        Hello <strong>${firstName}</strong>, we received a request to reset the password for your account.
        Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #f4b942, #e67e22); 
                  color: #1a1a2e; text-decoration: none; border-radius: 8px; 
                  font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">
          Reset My Password
        </a>
      </div>
      <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <p style="color: #c53030; font-size: 13px; margin: 0;">
          ⚠️ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, 
          please ignore this email — your account remains secure.
        </p>
      </div>
      <p style="color: #a0aec0; font-size: 12px;">
        Or copy and paste this link into your browser:<br/>
        <span style="color: #4299e1;">${resetUrl}</span>
      </p>
      ${emailFooter()}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("[Email] Error sending password reset email:", error.message);
    console.log("\n[DEV MODE] Password Reset Link:", resetUrl);
    return null;
  }
};
