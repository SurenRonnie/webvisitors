import nodemailer from 'nodemailer';
import { env } from '../../../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = env.smtp.host
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true }); // no SMTP configured: log-only mock transport
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const info = await getTransporter().sendMail({ from: env.smtp.from, to, subject, html });
  if (!env.smtp.host) {
    console.log('[email:mock]', { to, subject });
  }
  return info;
}
