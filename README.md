# PranVeda — Full-Stack Ayurvedic E-Commerce Platform

A luxury D2C full-stack e-commerce web application for **PranVeda** built with **Next.js (App Router), TypeScript, Tailwind CSS, Prisma + SQLite, Nodemailer, and Razorpay/COD Checkout**.

## Quick Start

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Demo Accounts

- **Admin Panel (`/admin`):** `admin@pranveda.in` / `Admin@123`
- **Demo Customer (`/account`):** `customer@pranveda.in` / `Customer@123`

## Switching from Demo to Live Credentials (`.env`)

1. **Razorpay / UPI Payments:** Fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env`. While blank, checkout runs in interactive **Demo Online Payment Mode**.
2. **Email Notifications (SMTP):** Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env` (supports Gmail App Passwords, Brevo, Zoho, Resend SMTP, etc.). While blank, all Welcome, Order Confirmation, and Order Status Update HTML emails are saved and previewable inside **Admin Panel → Email Logs (`/admin/emails`)**.
3. **Products & Photos:** Go to **Admin Panel → Products & Photos (`/admin/products`)** to upload your own product images directly from your PC and replace/add your own products.
4. **Store Info & WhatsApp:** Go to **Admin Panel → Store Settings (`/admin/settings`)** to update your WhatsApp number, email, address, Instagram URL, free shipping threshold, and shipping fee.
