import nodemailer from "nodemailer";

/**
 * Nodemailer transporter singleton for Google SMTP.
 * Used for all transactional emails: OTP, order confirmation, shipping, delivery.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send an email using the configured SMTP transporter.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Ghero by Kajal Soni" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export { transporter };
