import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { TicketStatus } from '../models/Ticket.model';
import { Estimate } from '../models/Estimate.model';
import { EstimateItem } from '../models/EstimateItem.model';
import { Technician } from '../models/Technician.model';
import { User } from '../models/User.model';
import { STATUS_LABELS } from './statusLabels';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: TicketStatus): string {
  const map: Partial<Record<TicketStatus, string>> = {
    SUBMITTED:    '#64748b',
    UNDER_REVIEW: '#3b82f6',
    APPROVED:     '#10b981',
    REJECTED:     '#ef4444',
    ASSIGNED:     '#8b5cf6',
    IN_PROGRESS:  '#f59e0b',
    ON_HOLD:      '#f97316',
    COMPLETED:    '#14b8a6',
    CLOSED:       '#22c55e',
  };
  return map[status] ?? '#64748b';
}

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;background:${color}20;color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;letter-spacing:0.03em;">${label}</span>`;
}

function priorityColor(p: string): string {
  return p === 'critical' ? '#ef4444' : p === 'high' ? '#f97316' : p === 'medium' ? '#eab308' : '#64748b';
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function divider(): string {
  return `<tr><td style="padding:0;"><div style="height:1px;background:#f1f5f9;margin:20px 0;"></div></td></tr>`;
}

function sectionHeading(text: string): string {
  return `<p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${text}</p>`;
}

// ─── Base template ────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>FixFlow Notification</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#3b82f6;border-radius:8px;width:38px;height:38px;text-align:center;vertical-align:middle;font-size:18px;">🔧</td>
              <td style="padding-left:12px;">
                <span style="color:#fff;font-size:18px;font-weight:700;">FixFlow</span>
                <span style="color:#94a3b8;font-size:11px;display:block;margin-top:2px;">Maintenance Management</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${content}
            </table>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
              This is an automated notification from FixFlow. Do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Internal data fetcher ────────────────────────────────────────────────────

interface TechnicianInfo {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  availability?: string;
}

interface EstimateInfo {
  estimateNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: Array<{
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

async function fetchTechnicianInfo(userId: string): Promise<TechnicianInfo | null> {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const tech = await Technician.findOne({ userId }).lean();

  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    specialization: tech?.specialization,
    availability: tech?.availability,
  };
}

async function fetchLatestEstimate(ticketId: string): Promise<EstimateInfo | null> {
  const estimate = await Estimate.findOne({ ticketId })
    .sort({ createdAt: -1 })
    .lean();

  if (!estimate) return null;

  const items = await EstimateItem.find({ estimateId: estimate._id }).lean();

  return {
    estimateNumber: estimate.estimateNumber,
    status: estimate.status,
    subtotal: estimate.subtotal,
    tax: estimate.tax,
    total: estimate.total,
    notes: estimate.notes,
    items: items.map((i) => ({
      type: i.type,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
  };
}

// ─── Section builders ─────────────────────────────────────────────────────────

function ticketSection(opts: {
  ticketNumber: string;
  title: string;
  location: string;
  category: string;
  priority: string;
}): string {
  const pc = priorityColor(opts.priority);
  return `
    <tr><td>
      ${sectionHeading('Ticket Details')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#3b82f6;font-family:monospace;">${opts.ticketNumber}</p>
          <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#0f172a;">${opts.title}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;padding-bottom:4px;font-size:12px;color:#64748b;">📍 ${opts.location}</td>
              <td style="padding-right:16px;padding-bottom:4px;font-size:12px;color:#64748b;">🏷 ${opts.category}</td>
              <td style="padding-bottom:4px;">
                <span style="background:${pc}20;color:${pc};font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;">${opts.priority}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`;
}

function statusSection(fromStatus: TicketStatus, toStatus: TicketStatus, reason?: string): string {
  const fromLabel = STATUS_LABELS[fromStatus];
  const toLabel   = STATUS_LABELS[toStatus];
  const toColor   = statusColor(toStatus);

  const reasonBlock = reason
    ? `<tr><td style="padding-top:12px;">
        <div style="padding:12px 16px;background:#fefce8;border-left:3px solid #eab308;border-radius:0 6px 6px 0;font-size:13px;color:#854d0e;">
          <strong>Note:</strong> ${reason}
        </div>
       </td></tr>`
    : '';

  return `
    <tr><td>
      ${sectionHeading('Status Update')}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;">
        <tr>
          <td style="padding:16px 20px;border-right:1px solid #e2e8f0;width:50%;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:600;">PREVIOUS STATUS</p>
            ${badge(fromLabel, '#64748b')}
          </td>
          <td style="padding:16px 20px;width:50%;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:600;">CURRENT STATUS</p>
            ${badge(toLabel, toColor)}
          </td>
        </tr>
      </table>
    </td></tr>
    ${reasonBlock}`;
}

function technicianSection(tech: TechnicianInfo): string {
  const availColor = tech.availability === 'available' ? '#22c55e' : tech.availability === 'busy' ? '#f59e0b' : '#64748b';

  return `
    <tr><td>
      ${sectionHeading('Assigned Technician')}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;">
        <tr><td style="padding:16px 20px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:top;">
                <div style="width:40px;height:40px;border-radius:50%;background:#3b82f620;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#3b82f6;text-align:center;line-height:40px;">
                  ${tech.name.charAt(0).toUpperCase()}
                </div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0f172a;">${tech.name}</p>
                ${tech.specialization ? `<p style="margin:0 0 6px;font-size:12px;color:#64748b;">🔧 ${tech.specialization}</p>` : ''}
                <table cellpadding="0" cellspacing="0">
                  ${tech.email ? `<tr><td style="font-size:12px;color:#64748b;padding-bottom:2px;">✉️ ${tech.email}</td></tr>` : ''}
                  ${tech.phone ? `<tr><td style="font-size:12px;color:#64748b;padding-bottom:2px;">📞 ${tech.phone}</td></tr>` : ''}
                  ${tech.availability ? `<tr><td style="padding-top:4px;"><span style="background:${availColor}20;color:${availColor};font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;text-transform:capitalize;">${tech.availability}</span></td></tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`;
}

function estimateSection(est: EstimateInfo): string {
  const statusColors: Record<string, string> = {
    draft: '#64748b', submitted: '#3b82f6', approved: '#22c55e', rejected: '#ef4444',
  };
  const estColor = statusColors[est.status] ?? '#64748b';

  const itemRows = est.items.map((item) => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9;">
        ${item.description}
        <span style="display:block;font-size:11px;color:#94a3b8;text-transform:capitalize;margin-top:1px;">${item.type}</span>
      </td>
      <td style="padding:8px 12px;font-size:13px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
      <td style="padding:8px 12px;font-size:13px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(item.unitPrice)}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(item.lineTotal)}</td>
    </tr>`).join('');

  const notesBlock = est.notes
    ? `<p style="margin:12px 0 0;font-size:12px;color:#64748b;font-style:italic;">💬 ${est.notes}</p>`
    : '';

  return `
    <tr><td>
      ${sectionHeading('Cost Estimate')}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <!-- Estimate header -->
        <tr style="background:#f8fafc;">
          <td colspan="4" style="padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font-size:12px;font-weight:700;color:#0f172a;font-family:monospace;">${est.estimateNumber}</td>
              <td style="text-align:right;">${badge(est.status.toUpperCase(), estColor)}</td>
            </tr></table>
          </td>
        </tr>
        <!-- Column headings -->
        <tr style="background:#f1f5f9;">
          <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Description</td>
          <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:center;">Qty</td>
          <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:right;">Unit Price</td>
          <td style="padding:8px 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:right;">Total</td>
        </tr>
        <!-- Line items -->
        ${itemRows}
        <!-- Totals -->
        <tr>
          <td colspan="3" style="padding:8px 12px;font-size:13px;color:#64748b;text-align:right;border-top:1px solid #e2e8f0;">Subtotal</td>
          <td style="padding:8px 12px;font-size:13px;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${fmt(est.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding:4px 12px;font-size:13px;color:#64748b;text-align:right;">Tax</td>
          <td style="padding:4px 12px;font-size:13px;color:#0f172a;text-align:right;">${fmt(est.tax)}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td colspan="3" style="padding:10px 12px;font-size:14px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">Total</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#3b82f6;text-align:right;border-top:2px solid #e2e8f0;">${fmt(est.total)}</td>
        </tr>
      </table>
      ${notesBlock}
    </td></tr>`;
}

// ─── Low-level send ───────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!env.smtpUser) {
    console.warn('[Email] Skipping — SMTP_USER not configured');
    return;
  }

  console.log(`[Email] Sending "${subject}" → ${to}`);
  try {
    await transporter.sendMail({ from: `"FixFlow" <${env.smtpUser}>`, to, subject, html });
    console.log(`[Email] Sent OK → ${to}`);
  } catch (err) {
    console.error('[Email] Failed to send:', (err as Error).message);
  }
}

export async function verifySmtp(): Promise<void> {
  if (!env.smtpUser) {
    console.log('[Email] SMTP not configured — notifications disabled');
    return;
  }
  try {
    await transporter.verify();
    console.log(`[Email] SMTP ready (${env.smtpHost}:${env.smtpPort}) — using ${env.smtpUser}`);
  } catch (err) {
    console.error('[Email] SMTP connection failed:', (err as Error).message);
    console.error('[Email] Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendTicketCreatedEmail(opts: {
  to: string;
  userName: string;
  ticketNumber: string;
  title: string;
  location: string;
  category: string;
  priority: string;
}): Promise<void> {
  const { to, userName, ticketNumber, title, location, category, priority } = opts;

  const html = baseTemplate(`
    <tr><td style="padding-bottom:20px;">
      <h2 style="margin:0 0 6px;font-size:20px;color:#0f172a;">Ticket Submitted ✅</h2>
      <p style="margin:0;font-size:14px;color:#64748b;">Hi ${userName}, your maintenance request has been received and is now in the queue.</p>
    </td></tr>
    ${ticketSection({ ticketNumber, title, location, category, priority })}
    ${divider()}
    <tr><td>
      <p style="margin:0;font-size:13px;color:#64748b;">We'll email you at every step as your request moves through the workflow.</p>
    </td></tr>
  `);

  await send(to, `[FixFlow] Ticket ${ticketNumber} submitted`, html);
}

export async function sendTicketUpdateEmail(opts: {
  to: string;
  userName: string;
  ticketNumber: string;
  title: string;
  location: string;
  category: string;
  priority: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  reason?: string;
  assignedToUserId?: string;
  ticketId: string;
}): Promise<void> {
  try {
    const {
      to, userName, ticketNumber, title, location, category, priority,
      fromStatus, toStatus, reason, assignedToUserId, ticketId,
    } = opts;

    const toLabel = STATUS_LABELS[toStatus];

    // Fetch technician and estimate in parallel (best-effort — failures are non-fatal)
    const [techInfo, estimateInfo] = await Promise.allSettled([
      assignedToUserId ? fetchTechnicianInfo(assignedToUserId) : Promise.resolve(null),
      fetchLatestEstimate(ticketId),
    ]);

    const tech = techInfo.status === 'fulfilled' ? techInfo.value : null;
    const estimate = estimateInfo.status === 'fulfilled' ? estimateInfo.value : null;

    if (techInfo.status === 'rejected') {
      console.error('[Email] Failed to fetch technician info:', techInfo.reason);
    }
    if (estimateInfo.status === 'rejected') {
      console.error('[Email] Failed to fetch estimate info:', estimateInfo.reason);
    }

    const html = baseTemplate(`
      <tr><td style="padding-bottom:20px;">
        <h2 style="margin:0 0 6px;font-size:20px;color:#0f172a;">Ticket Update</h2>
        <p style="margin:0;font-size:14px;color:#64748b;">Hi ${userName}, here's the latest on your maintenance request.</p>
      </td></tr>

      ${ticketSection({ ticketNumber, title, location, category, priority })}
      ${divider()}
      ${statusSection(fromStatus, toStatus, reason)}
      ${tech ? `${divider()}${technicianSection(tech)}` : ''}
      ${estimate ? `${divider()}${estimateSection(estimate)}` : ''}
    `);

    await send(to, `[FixFlow] ${ticketNumber} — ${toLabel}`, html);
  } catch (err) {
    console.error('[Email] sendTicketUpdateEmail error:', (err as Error).message);
  }
}
