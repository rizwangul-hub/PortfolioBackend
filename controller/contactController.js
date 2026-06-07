import nodemailer from "nodemailer";
import { Contact } from "../models/Contact.js";

export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Save contact message to MongoDB database
    const contactMessage = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    // 2. Build Nodemailer SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587/25
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Create professional HTML email template
    const formattedDate = new Date().toLocaleString();
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // outgoing SMTP mailer address
      to: process.env.CONTACT_RECEIVER_EMAIL, // your personal email address
      replyTo: email, // reply directly to the sender
      subject: `Portfolio Inquiry: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #030712;
              color: #f3f4f6;
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #09090b;
              border: 1px solid #1f2937;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header {
              background: linear-gradient(to right, #3b82f6, #6366f1);
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              color: #ffffff;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 32px 24px;
            }
            .meta-item {
              margin-bottom: 16px;
              font-size: 14px;
            }
            .meta-label {
              color: #9ca3af;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
              display: block;
              margin-bottom: 4px;
            }
            .meta-value {
              color: #e5e7eb;
              font-size: 14px;
            }
            .message-box {
              background-color: #111827;
              border: 1px solid #1f2937;
              border-radius: 8px;
              padding: 20px;
              margin-top: 24px;
              font-size: 14px;
              line-height: 1.6;
              color: #f3f4f6;
              white-space: pre-wrap;
            }
            .footer {
              padding: 20px 24px;
              border-top: 1px solid #1f2937;
              text-align: center;
              font-size: 12px;
              color: #4b5563;
              background-color: #020617;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Message Received</h1>
            </div>
            
            <div class="content">
              <div class="meta-item">
                <span class="meta-label">From</span>
                <span class="meta-value"><strong>${name}</strong> (${email})</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Subject</span>
                <span class="meta-value">${subject}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Date Submitted</span>
                <span class="meta-value">${formattedDate}</span>
              </div>
              
              <div class="meta-label" style="margin-top: 24px;">Message Body</div>
              <div class="message-box">${message}</div>
            </div>
            
            <div class="footer">
              Sent from your Portfolio contact portal.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // 4. Send email notification (fail-safe and graceful)
    const isPassConfigured =
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== "your_gmail_app_password_here" &&
      process.env.EMAIL_PASS.trim() !== "";

    if (process.env.EMAIL_USER && isPassConfigured) {
      try {
        await transporter.sendMail(mailOptions);
        console.log(
          `✉️ Notification email sent to ${process.env.CONTACT_RECEIVER_EMAIL}`,
        );
      } catch (emailError) {
        console.error(
          "❌ Nodemailer failed to send email:",
          emailError.message,
        );
        // We do not throw or reject the request, as the message has been saved in MongoDB successfully.
      }
    } else {
      console.warn(
        "⚠️ Nodemailer skipped: EMAIL_PASS is still set to placeholder or empty.",
      );
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contactMessage,
    });
  } catch (error) {
    console.error("Error in submitContact:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while transmitting your message.",
      error: error.message,
    });
  }
};
