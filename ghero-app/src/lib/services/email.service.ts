import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

/**
 * Transactional email service.
 * Every send is logged to EmailEvent. Order emails are idempotent per (eventType, orderId)
 * via the unique constraint, so retries/webhook replays never double-send.
 */

const BRAND = "Ghero by Kajal Soni";

function isSmtpConfigured() {
  const { SMTP_USER, SMTP_PASSWORD } = process.env;
  return Boolean(SMTP_USER && SMTP_PASSWORD && !SMTP_PASSWORD.startsWith("your-"));
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FBE1E9;font-family:Arial,Helvetica,sans-serif;color:#2C2C2C">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #F7D6E0">
        <div style="font-family:Georgia,serif;font-size:28px;color:#C5A55A">Ghero</div>
        <div style="font-size:10px;letter-spacing:3px;color:#C5A55A;text-transform:uppercase">by Kajal Soni</div>
      </td></tr>
      <tr><td style="padding:32px">
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;margin:0 0 16px">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:16px 32px;background:#FAF8F5;font-size:12px;color:#888">${BRAND}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function deliver(to: string, subject: string, html: string, devPreview: string, replyTo?: string) {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    console.log(`\n[email:dev] SMTP not configured, not sending.\n  To: ${to}\n  Subject: ${subject}\n  ${devPreview}\n`);
    return;
  }
  await sendEmail({ to, subject, html, replyTo });
}

export async function sendOtpEmail(email: string, otp: string, expiresInMinutes: number) {
  const html = layout(
    "Your verification code",
    `<p style="font-size:14px;line-height:1.6">Use this code to sign in. It expires in ${expiresInMinutes} minutes.</p>
     <div style="font-size:32px;letter-spacing:10px;font-weight:bold;color:#722F37;margin:24px 0">${otp}</div>
     <p style="font-size:12px;color:#888">If you didn't request this, you can safely ignore this email.</p>`
  );
  try {
    await deliver(email, `${otp} is your ${BRAND} verification code`, html, `OTP: ${otp}`);
    await prisma.emailEvent.create({ data: { eventType: "OTP", recipient: email } });
  } catch (error) {
    await prisma.emailEvent.create({
      data: { eventType: "OTP", recipient: email, status: "FAILED", metadata: { message: String(error) } },
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Order lifecycle emails (idempotent per order + event)
// ---------------------------------------------------------------------------

export type OrderEmailEvent = "ORDER_CONFIRMATION" | "SHIPPED" | "DELIVERED";

type OrderForEmail = {
  id: string;
  orderNumber: string;
  shippingName: string;
  shippingEmail: string;
  total: { toString(): string };
  trackingUrl: string | null;
  items: { productName: string; size: string | null; color: string | null; quantity: number; unitPrice: { toString(): string } }[];
};

const inr = (v: { toString(): string }) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v.toString()));

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function orderEmailContent(event: OrderEmailEvent, order: OrderForEmail) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const orderLink = `${appUrl}/account/orders/${order.id}`;
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-size:14px">${escapeHtml(i.productName)}${
          i.size || i.color ? ` <span style="color:#888">(${escapeHtml([i.size, i.color].filter(Boolean).join(", "))})</span>` : ""
        } × ${i.quantity}</td><td align="right" style="font-size:14px">${inr(Number(i.unitPrice.toString()) * i.quantity)}</td></tr>`
    )
    .join("");
  const button = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:#722F37;color:#fff;text-decoration:none;padding:12px 24px;font-size:14px;margin-top:16px">${label}</a>`;
  const name = escapeHtml(order.shippingName.split(" ")[0] || "there");

  switch (event) {
    case "ORDER_CONFIRMATION":
      return {
        subject: `Order confirmed: ${order.orderNumber}`,
        title: "Thank you for your order",
        body: `<p style="font-size:14px;line-height:1.6">Hi ${name}, we've received your payment and your order <b>${order.orderNumber}</b> is confirmed.</p>
          <table width="100%" style="margin:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee">${itemsHtml}
          <tr><td style="padding:8px 0;font-weight:bold">Total paid</td><td align="right" style="font-weight:bold">${inr(order.total)}</td></tr></table>
          ${button(orderLink, "View your order")}`,
      };
    case "SHIPPED":
      return {
        subject: `Your order ${order.orderNumber} has shipped`,
        title: "Your order is on its way",
        body: `<p style="font-size:14px;line-height:1.6">Hi ${name}, good news! Order <b>${order.orderNumber}</b> has been shipped.</p>
          ${order.trackingUrl ? button(order.trackingUrl, "Track your package") : ""}`,
      };
    case "DELIVERED":
      return {
        subject: `Delivered: ${order.orderNumber}`,
        title: "Your order has been delivered",
        body: `<p style="font-size:14px;line-height:1.6">Hi ${name}, order <b>${order.orderNumber}</b> has been delivered. We hope you love it!</p>
          ${button(orderLink, "View your order")}`,
      };
  }
}

/**
 * Send an order lifecycle email at most once. The EmailEvent row is claimed first
 * (unique on eventType + orderId), so concurrent/replayed triggers can't double-send.
 * Failures are recorded and swallowed: notifications must never break order processing.
 */
export async function sendOrderEmail(event: OrderEmailEvent, order: OrderForEmail) {
  try {
    await prisma.emailEvent.create({
      data: { eventType: event, recipient: order.shippingEmail, orderId: order.id, status: "PENDING" },
    });
  } catch {
    return; // already sent (or in flight) for this order + event
  }
  try {
    const { subject, title, body } = orderEmailContent(event, order);
    await deliver(order.shippingEmail, subject, layout(title, body), `${event} for ${order.orderNumber}`);
    await prisma.emailEvent.update({
      where: { eventType_orderId: { eventType: event, orderId: order.id } },
      data: { status: "SENT" },
    });
  } catch (error) {
    console.error(`[email] ${event} for ${order.orderNumber} failed:`, error);
    await prisma.emailEvent
      .update({
        where: { eventType_orderId: { eventType: event, orderId: order.id } },
        data: { status: "FAILED", metadata: { message: String(error) } },
      })
      .catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// Contact form -> store inbox
// ---------------------------------------------------------------------------

export async function sendContactMessage(msg: { name: string; email: string; phone?: string; message: string }) {
  const to = process.env.STORE_CONTACT_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) throw new Error("STORE_CONTACT_EMAIL is not configured");
  const html = layout(
    "New message from the website",
    `<p style="font-size:14px"><b>${escapeHtml(msg.name)}</b> &lt;${escapeHtml(msg.email)}&gt;${msg.phone ? ` · ${escapeHtml(msg.phone)}` : ""}</p>
     <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #C5A55A;padding-left:12px">${escapeHtml(msg.message)}</div>
     <p style="font-size:12px;color:#888;margin-top:16px">Reply to this email to answer the customer directly.</p>`
  );
  // Reply-To is the customer, so the store can answer from its inbox.
  await deliver(to, `Website enquiry from ${msg.name}`, html, `From ${msg.email}: ${msg.message.slice(0, 80)}`, msg.email);
  await prisma.emailEvent.create({ data: { eventType: "CONTACT", recipient: to, metadata: { from: msg.email } } });
}
