import nodemailer from "nodemailer";
import { prisma } from "./db";
import { formatINR } from "./format";

export type EmailType =
  | "WELCOME"
  | "ORDER_CONFIRMATION"
  | "ORDER_STATUS"
  | "ADMIN_NEW_ORDER";

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

function wrapBrandedLayout(title: string, preheader: string, bodyHtml: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF6F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E2421;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF6F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8DFD1;box-shadow:0 8px 30px rgba(27,59,43,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1B3B2B;padding:28px 32px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:3px;color:#FAF6F0;font-weight:700;">PRANVEDA</div>
              <div style="font-size:11px;letter-spacing:2.5px;color:#C89B3C;text-transform:uppercase;margin-top:6px;">Ancient Wisdom • Pure Vitality</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F4EFE6;padding:24px 32px;text-align:center;border-top:1px solid #E8DFD1;">
              <p style="margin:0 0 8px;font-size:13px;color:#55625B;">Crafted with pure Himalayan &amp; Indian Ayurvedic herbs.</p>
              <p style="margin:0;font-size:12px;color:#7A847E;">
                <a href="${appUrl}" style="color:#1B3B2B;text-decoration:none;font-weight:600;">Visit PranVeda Store</a>
                &nbsp;•&nbsp;
                <a href="${appUrl}/track-order" style="color:#1B3B2B;text-decoration:none;font-weight:600;">Track Order</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBrandedEmail(params: {
  to: string;
  subject: string;
  type: EmailType;
  html: string;
}) {
  const from = process.env.SMTP_FROM || "PranVeda Ayurveda <care@pranveda.in>";

  if (!isSmtpConfigured()) {
    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        type: params.type,
        html: params.html,
        status: "DEMO_LOGGED",
      },
    });
    return { ok: true, mode: "demo" as const };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        type: params.type,
        html: params.html,
        status: "SENT",
      },
    });
    return { ok: true, mode: "smtp" as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    await prisma.emailLog.create({
      data: {
        to: params.to,
        subject: params.subject,
        type: params.type,
        html: params.html,
        status: "FAILED",
        error: message,
      },
    });
    return { ok: false, mode: "smtp" as const, error: message };
  }
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const body = `
    <p style="margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#C89B3C;font-weight:700;">Namaste &amp; Welcome</p>
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;color:#1B3B2B;">Welcome to the PranVeda Family, ${user.name}!</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#3E4842;">
      Thank you for joining PranVeda. We craft authentic, lab-tested Ayurvedic formulations inspired by timeless Vedic wellness rituals.
    </p>
    <div style="background:#FAF6F0;border:1px dashed #C89B3C;border-radius:12px;padding:18px 20px;margin:24px 0;text-align:center;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#6B756F;">Your Welcome Gift</div>
      <div style="font-size:22px;font-weight:700;color:#1B3B2B;margin:6px 0;letter-spacing:2px;">PRAN10</div>
      <div style="font-size:13px;color:#55625B;">Enjoy 10% off your first Ayurvedic wellness order</div>
    </div>
    <div style="text-align:center;margin-top:28px;">
      <a href="${appUrl}/shop" style="display:inline-block;background-color:#1B3B2B;color:#FAF6F0;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:14px;font-weight:600;">Explore Our Formulations</a>
    </div>
  `;

  return sendBrandedEmail({
    to: user.email,
    subject: `Namaste ${user.name}, Welcome to PranVeda Ayurveda`,
    type: "WELCOME",
    html: wrapBrandedLayout("Welcome to PranVeda", "Welcome to PranVeda Ayurveda — enjoy 10% off with PRAN10", body),
  });
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: { productName: string; packSize?: string | null; price: number; quantity: number }[];
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #EFE8DC;font-size:14px;color:#1E2421;">
          <strong>${item.productName}</strong>
          ${item.packSize ? `<div style="font-size:12px;color:#6E7872;">${item.packSize}</div>` : ""}
        </td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid #EFE8DC;font-size:14px;color:#55625B;">×${item.quantity}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #EFE8DC;font-size:14px;font-weight:600;color:#1B3B2B;">${formatINR(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const body = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#C89B3C;font-weight:700;">Order Confirmed</p>
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;color:#1B3B2B;">Thank you for your order, ${order.customerName}!</h1>
    <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#4B5650;">
      We have received your PranVeda order <strong>#${order.orderNumber}</strong> and our apothecary team is preparing it with care.
    </p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:2px solid #1B3B2B;font-size:12px;text-transform:uppercase;color:#1B3B2B;">Item</th>
          <th align="center" style="padding-bottom:8px;border-bottom:2px solid #1B3B2B;font-size:12px;text-transform:uppercase;color:#1B3B2B;">Qty</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #1B3B2B;font-size:12px;text-transform:uppercase;color:#1B3B2B;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#FAF6F0;border-radius:12px;padding:16px 18px;margin-bottom:22px;">
      <tr><td style="padding:4px 0;font-size:14px;color:#55625B;">Subtotal</td><td align="right" style="font-size:14px;">${formatINR(order.subtotal)}</td></tr>
      ${order.discount > 0 ? `<tr><td style="padding:4px 0;font-size:14px;color:#1F6E43;">Discount</td><td align="right" style="font-size:14px;color:#1F6E43;">-${formatINR(order.discount)}</td></tr>` : ""}
      <tr><td style="padding:4px 0;font-size:14px;color:#55625B;">Shipping</td><td align="right" style="font-size:14px;">${order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}</td></tr>
      <tr><td style="padding:10px 0 0;border-top:1px solid #DFD4C3;font-size:16px;font-weight:700;color:#1B3B2B;">Total (${order.paymentMethod === "COD" ? "Cash on Delivery" : `Online • ${order.paymentStatus}`})</td><td align="right" style="padding:10px 0 0;border-top:1px solid #DFD4C3;font-size:18px;font-weight:700;color:#1B3B2B;">${formatINR(order.total)}</td></tr>
    </table>
    <div style="font-size:13px;color:#4B5650;line-height:1.6;margin-bottom:24px;">
      <strong style="color:#1B3B2B;">Shipping Address:</strong><br/>
      ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}
    </div>
    <div style="text-align:center;">
      <a href="${appUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background-color:#1B3B2B;color:#FAF6F0;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:14px;font-weight:600;">Track Your Order</a>
    </div>
  `;

  await sendBrandedEmail({
    to: order.customerEmail,
    subject: `Order Confirmed #${order.orderNumber} — PranVeda Ayurveda`,
    type: "ORDER_CONFIRMATION",
    html: wrapBrandedLayout(`Order Confirmed #${order.orderNumber}`, `Your PranVeda order #${order.orderNumber} is confirmed!`, body),
  });

  // Also alert Store Admin email
  const settings = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const adminEmail = settings?.supportEmail || "care@pranveda.in";
  if (adminEmail.toLowerCase() !== order.customerEmail.toLowerCase()) {
    const adminBody = `
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#C89B3C;font-weight:700;">New Store Order</p>
      <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#1B3B2B;">Order #${order.orderNumber} — ${formatINR(order.total)}</h2>
      <p style="margin:0 0 14px;font-size:14px;color:#3E4842;">
        Customer: <strong>${order.customerName}</strong> (${order.customerEmail})<br/>
        Payment: <strong>${order.paymentMethod}</strong> (${order.paymentStatus})<br/>
        Items: ${order.items.reduce((acc, i) => acc + i.quantity, 0)} unit(s)
      </p>
      <a href="${appUrl}/admin/orders" style="display:inline-block;background-color:#1B3B2B;color:#FAF6F0;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:13px;font-weight:600;">Manage in Admin Panel</a>
    `;
    await sendBrandedEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Order #${order.orderNumber} (${formatINR(order.total)})`,
      type: "ADMIN_NEW_ORDER",
      html: wrapBrandedLayout(`New Order #${order.orderNumber}`, `New PranVeda order received`, adminBody),
    });
  }
}

export async function sendOrderStatusUpdateEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  trackingNote?: string | null;
  total: number;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const statusMessages: Record<string, { headline: string; copy: string; badgeColor: string }> = {
    PLACED: {
      headline: "Your order has been placed",
      copy: "We have received your order and queued it for Ayurvedic quality checks.",
      badgeColor: "#1B3B2B",
    },
    PACKED: {
      headline: "Your PranVeda order is packed!",
      copy: "Your botanical formulations have been carefully sealed and are ready for dispatch.",
      badgeColor: "#8C6B23",
    },
    SHIPPED: {
      headline: "Your order is on its way!",
      copy: "Your parcel has been handed over to our delivery partner and is heading to your doorstep.",
      badgeColor: "#1F5B78",
    },
    DELIVERED: {
      headline: "Your order has been delivered!",
      copy: "We hope PranVeda brings purity and balance to your daily ritual. Share a review anytime!",
      badgeColor: "#1F6E43",
    },
    CANCELLED: {
      headline: "Your order has been cancelled",
      copy: "Your order has been cancelled. If you paid online, your refund will be processed within 5–7 business days.",
      badgeColor: "#A83A3A",
    },
  };

  const info = statusMessages[order.orderStatus] || statusMessages.PLACED;

  const body = `
    <div style="margin-bottom:16px;">
      <span style="display:inline-block;background:${info.badgeColor};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;padding:6px 14px;border-radius:999px;">
        Status: ${order.orderStatus}
      </span>
    </div>
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:25px;color:#1B3B2B;">${info.headline}</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3E4842;">
      Hi ${order.customerName},<br/><br/>
      ${info.copy}
    </p>
    <div style="background:#FAF6F0;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:14px;color:#3E4842;">
      <div><strong>Order Number:</strong> #${order.orderNumber}</div>
      <div style="margin-top:6px;"><strong>Order Total:</strong> ${formatINR(order.total)}</div>
      ${order.trackingNote ? `<div style="margin-top:6px;"><strong>Update Note:</strong> ${order.trackingNote}</div>` : ""}
    </div>
    <div style="text-align:center;margin-top:26px;">
      <a href="${appUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background-color:#1B3B2B;color:#FAF6F0;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:14px;font-weight:600;">View Live Order Status</a>
    </div>
  `;

  return sendBrandedEmail({
    to: order.customerEmail,
    subject: `Order #${order.orderNumber} Update: ${order.orderStatus} — PranVeda`,
    type: "ORDER_STATUS",
    html: wrapBrandedLayout(`Order #${order.orderNumber} — ${order.orderStatus}`, info.headline, body),
  });
}
