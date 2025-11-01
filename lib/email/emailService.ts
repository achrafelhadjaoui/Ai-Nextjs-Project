// lib/email/emailService.ts
// Email service for sending notifications
// Uses Nodemailer with SMTP or other email service

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SupportTicketEmailData {
  ticketId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  createdAt: Date;
}

interface AdminResponseEmailData {
  ticketId: string;
  userName: string;
  ticketSubject: string;
  adminResponse: string;
  status: string;
  respondedBy: string;
}

/**
 * Send email using configured email service
 * This is a placeholder - configure with your email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Configure with your email service
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    });
    */

    // For development/testing - just log
    console.log("📧 Email would be sent:");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("---");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send notification to admin when a new support ticket is created
 */
export async function sendNewTicketNotificationToAdmin(
  data: SupportTicketEmailData
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Farisly AI";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@farisly.ai";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; border-radius: 4px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 8px; }
        .badge-urgent { background: #ef4444; color: white; }
        .badge-high { background: #f59e0b; color: white; }
        .badge-medium { background: #3b82f6; color: white; }
        .badge-low { background: #6b7280; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎫 New Support Ticket</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">A new support ticket has been submitted</p>
        </div>
        <div class="content">
          <div class="ticket-info">
            <h2 style="margin-top: 0; color: #667eea;">${data.subject}</h2>
            <p><strong>From:</strong> ${data.userName} (${data.userEmail})</p>
            <p><strong>Category:</strong> ${data.category.replace("-", " ")}</p>
            <p>
              <strong>Priority:</strong>
              <span class="badge badge-${data.priority}">${data.priority.toUpperCase()}</span>
            </p>
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Submitted:</strong> ${data.createdAt.toLocaleString()}</p>
          </div>

          <div style="background: white; padding: 15px; border-radius: 4px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/support" class="button">
            View in Admin Panel
          </a>
        </div>
        <div class="footer">
          <p>${appName} Support System | This is an automated notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Support Ticket - ${data.subject}

From: ${data.userName} (${data.userEmail})
Category: ${data.category}
Priority: ${data.priority}
Ticket ID: ${data.ticketId}
Submitted: ${data.createdAt.toLocaleString()}

Message:
${data.message}

View in admin panel: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/support
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[${appName}] New Support Ticket: ${data.subject}`,
    html,
    text,
  });
}

/**
 * Send notification to user when admin responds to their ticket
 */
export async function sendAdminResponseNotificationToUser(
  userEmail: string,
  data: AdminResponseEmailData
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Farisly AI";

  const statusColors: Record<string, string> = {
    open: "#3b82f6",
    "in-progress": "#f59e0b",
    resolved: "#10b981",
    closed: "#6b7280",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; border-radius: 4px; }
        .response-box { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${statusColors[data.status] || "#6b7280"}; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Support Ticket Update</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Your support ticket has been updated</p>
        </div>
        <div class="content">
          <p>Hi ${data.userName},</p>
          <p>Our support team has responded to your ticket.</p>

          <div class="ticket-info">
            <h2 style="margin-top: 0; color: #10b981;">${data.ticketSubject}</h2>
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Status:</strong> <span class="status-badge">${data.status.replace("-", " ").toUpperCase()}</span></p>
          </div>

          <div class="response-box">
            <h3 style="margin-top: 0; color: #059669;">Response from ${data.respondedBy}:</h3>
            <p style="white-space: pre-wrap;">${data.adminResponse}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/support" class="button">
            View Your Tickets
          </a>

          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            If you have any additional questions, feel free to reply to this ticket.
          </p>
        </div>
        <div class="footer">
          <p>${appName} Support System | This is an automated notification</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Support Ticket Update

Hi ${data.userName},

Your support ticket has been updated.

Ticket: ${data.ticketSubject}
Ticket ID: ${data.ticketId}
Status: ${data.status}

Response from ${data.respondedBy}:
${data.adminResponse}

View your tickets: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/support

---
${appName} Support System
  `;

  return sendEmail({
    to: userEmail,
    subject: `[${appName}] Support Ticket Update: ${data.ticketSubject}`,
    html,
    text,
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Farisly AI";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .feature-list { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
        .feature-item:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">Welcome to ${appName}! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for joining ${appName}! We're excited to have you on board.</p>

          <div class="feature-list">
            <h3 style="margin-top: 0;">Here's what you can do:</h3>
            <div class="feature-item">Access your personalized dashboard</div>
            <div class="feature-item">Manage your saved replies and templates</div>
            <div class="feature-item">Request new features</div>
            <div class="feature-item">Get support from our team</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button">
              Go to Dashboard
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/support" class="button" style="background: #10b981;">
              Contact Support
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            If you have any questions, don't hesitate to reach out to our support team.
          </p>
        </div>
        <div class="footer">
          <p>${appName} | Making your workflow easier</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${appName}!

Hi ${userName},

Thank you for joining ${appName}! We're excited to have you on board.

Here's what you can do:
- Access your personalized dashboard
- Manage your saved replies and templates
- Request new features
- Get support from our team

Get started: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard

If you have any questions, contact our support team.

---
${appName}
  `;

  return sendEmail({
    to: userEmail,
    subject: `Welcome to ${appName}!`,
    html,
    text,
  });
}
