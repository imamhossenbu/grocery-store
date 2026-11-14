import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { SITE_NAME } from '@/lib/constants';

/**
 * Transactional email over SMTP (e.g. Gmail with an App Password).
 *
 *   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_USER=you@gmail.com
 *   SMTP_PASS=<16-letter app password>  MAIL_FROM="FreshBasket <you@gmail.com>"
 *
 * Optional: without SMTP_HOST/USER/PASS, emails are skipped (logged once),
 * and shopping works exactly as before.
 */

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.info('[email] SMTP_HOST / SMTP_USER / SMTP_PASS not set — order emails are off.');
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces are not part of it.
  if (/gmail\.com$/i.test(host)) pass = pass.replace(/\s+/g, '');
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Fail fast instead of holding a request open on a dead SMTP server.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Sends one email. Never throws: returns whether the SMTP server accepted it. */
export async function sendMail(input: MailInput): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  const from = process.env.MAIL_FROM || `${SITE_NAME} <${process.env.SMTP_USER}>`;
  try {
    await t.sendMail({ from, ...input });
    return true;
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
