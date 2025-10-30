// /lib/mail/index.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail", // or use your custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ✅ Send verification email
export async function sendVerificationEmail(to: string, verifyLink: string) {
  const mailOptions = {
    from: `"Farisly AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email address",
    html: `
      <h2>Welcome to Farisly AI!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyLink}" target="_blank">${verifyLink}</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <h2>Reset Your Password</h2>
      <p>You requested to reset your password. Click below link to reset:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>This link will expire in 15 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
