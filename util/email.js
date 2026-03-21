const nodemailer = require("nodemailer");

/**
 * Configure your SMTP settings here.
 * For production, use environment variables.
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

/**
 * Send Password Reset Email
 */
exports.passwordResetEmail = async (firstName, token, email) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Hello ${firstName},</h2>
        <p style="font-size: 16px; color: #555;">You requested a password reset. Please click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Reset Password</a>
        <p style="font-size: 14px; color: #888; margin-top: 30px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaa;">Regards,<br>The Investment Platform Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // In dev mode, we log the link so you can still use it even if SMTP is not configured
    console.log("\n[DEV MODE] Password Reset Link:", resetUrl);
    return null;
  }
};

/**
 * Send Welcome Email
 */
exports.welcomeEmail = async (firstName, email) => {
  const mailOptions = {
    from: `"Welcome Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to our Investment Platform!",
    html: `<h1>Welcome, ${firstName}!</h1><p>Thanks for joining us. We are excited to have you on board!</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};
