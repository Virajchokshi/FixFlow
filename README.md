# FixFlow — Maintenance Management System

FixFlow is a full-stack maintenance ticket management platform built for organizations to submit, track, and resolve facility maintenance requests. It features role-based access control, SLA tracking, financial workflows (estimates, invoices, payments), email notifications, and a real-time dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Authentication Flow](#authentication-flow)
7. [Ticket Lifecycle & Workflow](#ticket-lifecycle--workflow)
8. [SLA System](#sla-system)
9. [Financial Workflow](#financial-workflow)
10. [Email Notification System](#email-notification-system)
11. [Data Models & Relationships](#data-models--relationships)
12. [API Reference](#api-reference)
13. [Dashboard & Reporting](#dashboard--reporting)
14. [Audit Logging](#audit-logging)
15. [Real-Time Events (Socket.io)](#real-time-events-socketio)
16. [Environment Variables](#environment-variables)
17. [Local Development Setup](#local-development-setup)
18. [Deployment](#deployment)
19. [Security](#security)

---

## Project Overview

FixFlow manages the full lifecycle of maintenance requests in a facility or organization — from submission by an end user, through review, approval, assignment to a technician, work-in-progress, and final closure. It also tracks cost estimates and invoices per ticket, enforces SLA deadlines, and delivers email status updates to users.

**Key capabilities:**
- Ticket submission with categories, priorities, image attachments, and location
- Multi-stage approval and assignment workflow with role-based transitions
- SLA policy enforcement with automated cron-based sweep every 15 minutes
- Cost estimation and invoicing per ticket with line-item breakdown
- Payment recording and outstanding balance tracking
- HTML email notifications on ticket creation and every status change
- Admin dashboard with KPIs, trend analysis, and SLA distribution
- Technician dashboard with workload overview
- Full immutable audit trail for every ticket action

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| TypeScript | 5.4 | Type safety |
| Express | 4.18 | HTTP framework |
| Mongoose | 8.2 | MongoDB ODM |
| MongoDB | Cloud (Atlas) | Primary database |
| jsonwebtoken | 9.0 | JWT authentication |
| bcryptjs | 3.0 | Password hashing |
| nodemailer | 8.0 | SMTP email delivery |
| multer | 1.4 | File upload handling |
| joi | 17.12 | Request validation |
| node-cron | 3.0 | Scheduled SLA sweep job |
| helmet | 7.1 | HTTP security headers |
| cors | 2.8 | Cross-origin requests |
| cookie-parser | 1.4 | Cookie handling |
| morgan | 1.10 | HTTP request logging |
| express-rate-limit | 7.2 | Rate limiting |
| dotenv | 16.4 | Environment configuration |
| socket.io | 4.x | Real-time bidirectional events |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 18.2 | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.22 | Client-side routing |
| Axios | 1.6 | HTTP client |
| TanStack Query | 5.28 | Server state & caching |
| React Hook Form | 7.51 | Form state management |
| Zod | 3.22 | Schema validation |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | latest | Accessible component primitives |
| Recharts | 2.12 | Data visualization charts |
| Lucide React | 0.368 | Icon library |
| Sonner | 1.4 | Toast notifications |
| date-fns | 3.6 | Date formatting utilities |
| cmdk | 1.0 | Command palette |
| socket.io-client | 4.x | Real-time client for Socket.io |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vite + React)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  Router  │  │ React Query  │  │  React Hook Form + Zod    │ │
│  │ (pages)  │  │  (caching)   │  │  (form validation)        │ │
│  └──────────┘  └──────────────┘  └───────────────────────────┘ │
│         │              │                                        │
│         └──────────────┼─────────────────────────────────┐     │
│                        ▼                                  │     │
│              ┌──────────────────┐                         │     │
│              │   Axios Client   │ ← httpOnly cookie JWT   │     │
│              └──────────────────┘                         │     │
└────────────────────────────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Express + Node.js)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CORS → Helmet → JSON → Cookie Parser → Morgan            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Lazy DB Middleware (connectDB)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐    │
│  │  /api/auth  /api/tickets  /api/estimates  /api/invoices  │   │
│  │  /api/payments  /api/users  /api/sla-policies            │   │
│  │  /api/dashboard  /api/analytics  /api/notifications      │   │
│  │  /api/ai  (conditional on AI_ANALYSIS_ENABLED)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │  authenticate middleware → authorize(roles) middleware    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │    Controllers → Services → Mongoose Models               │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                        │                    │         │
│  ┌──────────────┐   ┌──────────────────┐  ┌─────────────────┐  │
│  │ MongoDB Atlas│   │ Socket.io Server │  │ Nodemailer SMTP │  │
│  │(12 collections)  │ (real-time push) │  │(HTML templates) │  │
│  └──────────────┘   └──────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  node-cron SLA Sweep (every 15 min)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Fix-Flow/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── api/                    # Axios API functions
│   │   │   ├── axios.ts            # Axios instance (base URL, credentials)
│   │   │   ├── auth.api.ts
│   │   │   ├── tickets.api.ts
│   │   │   ├── estimates.api.ts
│   │   │   ├── invoices.api.ts
│   │   │   ├── payments.api.ts
│   │   │   ├── sla.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   ├── analytics.api.ts
│   │   │   ├── notifications.api.ts
│   │   │   ├── ai.api.ts
│   │   │   ├── feedback.api.ts
│   │   │   └── users.api.ts
│   │   ├── components/
│   │   │   ├── layout/             # AppShell, Sidebar, Topbar, PageHeader
│   │   │   ├── tickets/            # NewTicketModal, etc.
│   │   │   ├── ui/                 # Radix UI wrappers (Button, Card, etc.)
│   │   │   └── sla/
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global auth state
│   │   ├── hooks/                  # useTickets, useEstimates, useAuth, etc.
│   │   ├── pages/
│   │   │   ├── auth/               # Login, Register (User/Technician)
│   │   │   ├── tickets/            # List, Detail, New
│   │   │   ├── finance/            # Estimates, Invoices, Payments
│   │   │   ├── admin/              # Users, SLA Policies
│   │   │   └── dashboard/          # UserDashboard, TechnicianDashboard
│   │   ├── router/
│   │   │   └── AppRouter.tsx       # Route definitions & guards
│   │   ├── types/
│   │   │   └── index.ts            # All TypeScript interfaces
│   │   └── lib/
│   │       ├── validations.ts      # Zod schemas for forms
│   │       └── utils.ts            # formatCurrency, cn, etc.
│   ├── vercel.json                 # SPA rewrite for Vercel
│   └── vite.config.ts
│
└── server/                         # Express + Node.js backend
    ├── api/
    │   └── index.ts                # Vercel serverless entry
    ├── src/
    │   ├── index.ts                # Local dev entry (listen + cron)
    │   ├── app.ts                  # Express app factory
    │   ├── config/
    │   │   ├── db.ts               # MongoDB connection (cached for serverless)
    │   │   └── env.ts              # Validated environment config
    │   ├── models/                 # 12 Mongoose schemas
    │   │   ├── User.model.ts
    │   │   ├── Technician.model.ts
    │   │   ├── Ticket.model.ts
    │   │   ├── TicketComment.model.ts
    │   │   ├── TicketAttachment.model.ts
    │   │   ├── AuditLog.model.ts
    │   │   ├── SLAPolicy.model.ts
    │   │   ├── Estimate.model.ts
    │   │   ├── EstimateItem.model.ts
    │   │   ├── Invoice.model.ts
    │   │   ├── Payment.model.ts
    │   │   └── Counter.model.ts
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── user.controller.ts
    │   │   ├── ticket.controller.ts
    │   │   ├── estimate.controller.ts
    │   │   ├── invoice.controller.ts
    │   │   ├── payment.controller.ts
    │   │   ├── sla.controller.ts
    │   │   ├── dashboard.controller.ts
    │   │   ├── analytics.controller.ts
    │   │   ├── notification.controller.ts
    │   │   ├── feedback.controller.ts
    │   │   └── ai.controller.ts
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── user.routes.ts
    │   │   ├── ticket.routes.ts
    │   │   ├── estimate.routes.ts
    │   │   ├── invoice.routes.ts
    │   │   ├── payment.routes.ts
    │   │   ├── sla.routes.ts
    │   │   ├── dashboard.routes.ts
    │   │   ├── analytics.routes.ts
    │   │   ├── notification.routes.ts
    │   │   └── ai.routes.ts
    │   ├── services/
    │   │   └── socket.service.ts       # Socket.io real-time notification service
    │   ├── middleware/
    │   │   ├── authenticate.ts     # JWT cookie validation
    │   │   ├── authorize.ts        # Role-based access
    │   │   ├── validateBody.ts     # Joi request validation
    │   │   ├── upload.ts           # Multer file upload
    │   │   └── errorHandler.ts     # Global error handler
    │   ├── utils/
    │   │   ├── email.ts            # HTML email builder + sender
    │   │   ├── sla.ts              # SLA calculation logic
    │   │   ├── transitions.ts      # Valid ticket status transitions
    │   │   ├── statusLabels.ts     # Human-readable status names
    │   │   ├── autoNumber.ts       # TKT/EST/INV numbering
    │   │   ├── auditLogger.ts      # Audit log creation helper
    │   │   └── ApiError.ts         # Custom error class
    │   ├── validations/            # Joi schemas per domain
    │   ├── jobs/
    │   │   └── slaCron.ts          # node-cron SLA sweep
    │   └── scripts/
    │       └── seed.ts             # Database seed script
    ├── vercel.json                 # Vercel serverless config
    └── tsconfig.json
```

---

## User Roles & Permissions

FixFlow has three user roles:

### Admin
- Create, update, and delete any ticket
- Review and approve/reject submitted tickets
- Assign tickets to technicians
- Manage all users (change roles, activate/deactivate)
- Create and manage SLA policies
- Create estimates, invoices, and record payments
- View admin dashboard with full KPIs and financial data
- Trigger manual SLA sweep
- View full audit log per ticket

### Technician
- View tickets assigned to them
- Update ticket status (IN_PROGRESS → COMPLETED, etc.)
- Add comments to assigned tickets
- View technician dashboard with workload overview
- Cannot access financial data

### User
- Submit new maintenance tickets
- Upload attachments (images, PDF)
- View only their own tickets
- Add comments to their tickets
- Receive email notifications on every status change

### Permission Matrix

| Action | Admin | Technician | User |
|---|:---:|:---:|:---:|
| Create ticket | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets | ✅ | ❌ | ❌ |
| Approve/reject ticket | ✅ | ❌ | ❌ |
| Assign technician | ✅ | ❌ | ❌ |
| Update ticket status | ✅ | ✅ (limited) | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Manage SLA policies | ✅ | ❌ | ❌ |
| Create estimates | ✅ | ✅ (own tickets) | ❌ |
| Create invoices | ✅ | ❌ | ❌ |
| Record payments | ✅ | ❌ | ❌ |
| View admin dashboard | ✅ | ❌ | ❌ |
| View technician dashboard | ✅ | ✅ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

---

## Authentication Flow

```
User Submits Login Form
        │
        ▼
POST /api/auth/login
        │
        ▼
Validate email + password (Joi)
        │
        ▼
Find user in MongoDB by email
        │
        ▼
bcryptjs.compare(password, passwordHash)
        │
     [pass]──────────────────────────────[fail]
        │                                    │
        ▼                                    ▼
Sign JWT {userId, role, name}         401 Unauthorized
  (expires 8h)
        │
        ▼
Set httpOnly cookie
  { httpOnly: true
    secure: true (prod)
    sameSite: 'none' (prod) / 'strict' (dev)
    maxAge: 8h }
        │
        ▼
Return { success, data: user }
        │
        ▼
Client stores auth state via AuthContext
All subsequent requests send cookie automatically
```

**Token Refresh:** No refresh tokens — users re-login after 8-hour expiry.

**Logout:** `POST /api/auth/logout` clears the cookie server-side.

---

## Ticket Lifecycle & Workflow

### Status Flow

```
                              ┌──────────┐
                    ┌────────▶│ REJECTED │
                    │         └──────────┘
                    │
┌───────────┐  admin  ┌─────────────┐  admin  ┌──────────┐  admin  ┌──────────┐
│ SUBMITTED │────────▶│ UNDER_REVIEW│────────▶│ APPROVED │────────▶│ ASSIGNED │
└───────────┘         └─────────────┘         └──────────┘         └──────────┘
                              │                                          │
                              │ admin                                technician
                              ▼                                          │
                         ┌──────────┐                                   ▼
                         │ REJECTED │                           ┌─────────────┐
                         └──────────┘                           │ IN_PROGRESS │◀──┐
                                                                └─────────────┘   │
                                                                  │         │      │
                                                          tech/admin  tech/admin   │ admin
                                                                  │         │      │ (rework)
                                                                  ▼         ▼      │
                                                           ┌─────────┐  ┌──────────┤
                                                           │ ON_HOLD │  │COMPLETED │
                                                           └─────────┘  └──────────┘
                                                                │               │
                                                        tech/admin            admin
                                                                │               │
                                                                ▼               ▼
                                                         ┌─────────────┐  ┌──────────┐
                                                         │ IN_PROGRESS │  │  CLOSED  │
                                                         └─────────────┘  └──────────┘
```

### Valid Transitions

| From | To | Allowed Roles |
|---|---|---|
| SUBMITTED | UNDER_REVIEW | admin |
| SUBMITTED | REJECTED | admin |
| UNDER_REVIEW | APPROVED | admin |
| UNDER_REVIEW | REJECTED | admin |
| APPROVED | ASSIGNED | admin (via `/tickets/:id/assign`) |
| APPROVED | ASSIGNED | admin |
| ASSIGNED | IN_PROGRESS | technician |
| IN_PROGRESS | ON_HOLD | technician, admin |
| IN_PROGRESS | COMPLETED | technician, admin |
| ON_HOLD | IN_PROGRESS | technician, admin |
| COMPLETED | CLOSED | admin |
| COMPLETED | IN_PROGRESS | admin (rework) |

### Create Ticket Flow

```
1. User submits form (title, description, category, priority, location, image)
2. Joi validation
3. Auto-generate ticket number → TKT-{YEAR}-{NNNN}
4. Look up SLA policy by priority → compute slaDeadline
5. Save Ticket to MongoDB (status: SUBMITTED)
6. Create AuditLog entry (TICKET_CREATED)
7. Send confirmation email to submitter (async, non-blocking)
8. Return 201 with populated ticket
```

### Status Change Flow

```
1. PATCH /api/tickets/:id/status { toStatus, reason }
2. Load current ticket from DB
3. validateTransition(fromStatus, toStatus, userRole) → 400 if invalid
4. Update ticket.status + optional reason field
5. Create AuditLog entry (STATUS_CHANGED)
6. Fetch technician info + latest estimate in parallel (Promise.allSettled)
7. Send HTML email to submitter with:
   - Previous status vs new status
   - Assigned technician details
   - Latest cost estimate breakdown
8. Return updated ticket
```

---

## SLA System

### SLA Policy

Each priority level has exactly one SLA policy:

```
SLAPolicy {
  priority:              'critical' | 'high' | 'medium' | 'low'
  responseTimeHours:     number   // target time to first response
  resolutionTimeHours:   number   // target time to full resolution
  createdBy:             ObjectId (admin)
}
```

### SLA Status Calculation

```
slaStatus = 'on_track'  if elapsed < 80% of resolutionTime
           = 'at_risk'   if elapsed >= 80% of resolutionTime
           = 'breached'  if elapsed >= 100% of resolutionTime
```

### Automated Sweep (Every 15 Minutes)

```
node-cron triggers every 15 minutes:
  │
  ▼
Fetch all open tickets (status != CLOSED | REJECTED)
  with their linked SLA policy
  │
  ▼
For each ticket:
  ├── Compute new slaStatus
  ├── If changed → update ticket.slaStatus in DB
  └── If newly 'breached' → create AuditLog (SLA_BREACHED, actor: system)
  │
  ▼
Log sweep summary to console
```

Admins can also trigger manually: `POST /api/sla-policies/trigger-sweep`

---

## Financial Workflow

```
Ticket reaches COMPLETED status
        │
        ▼
Admin creates Estimate (linked to ticket)
  ├── Line Items:
  │     type: labor | parts | overhead
  │     description, quantity, unitPrice → lineTotal
  ├── Tax rate (%)
  └── Computed: subtotal, tax, total

Estimate status: draft → submitted → approved | rejected
        │ (approved)
        ▼
Admin creates Invoice (from approved estimate)
  ├── invoiceNumber: INV-{YEAR}-{NNNN}
  ├── Links to ticket + estimate
  ├── dueDate, issuedAt
  └── status: draft → issued → partial | paid

Admin records Payments against Invoice
  ├── method: bank_transfer | cash | card | cheque
  ├── referenceNumber, paymentDate
  ├── amount
  └── outstandingBalance calculated automatically
       └── Invoice auto-set to 'paid' when balance = 0
```

### Auto-Number Formats

| Entity | Format | Example |
|---|---|---|
| Ticket | `TKT-{YEAR}-{NNNN}` | TKT-2026-0001 |
| Estimate | `EST-{YEAR}-{NNNN}` | EST-2026-0001 |
| Invoice | `INV-{YEAR}-{NNNN}` | INV-2026-0001 |

---

## Email Notification System

Emails are sent asynchronously and never block API responses. Failures are logged only.

### Triggers

| Event | Recipient |
|---|---|
| Ticket created | Ticket submitter |
| Ticket status changed | Ticket submitter |
| Ticket assigned to technician | Ticket submitter |

### Email Template Layout

```
┌────────────────────────────────────────┐
│  🔧  FixFlow — Maintenance Management  │  ← dark navy header
├────────────────────────────────────────┤
│  Ticket Details                        │
│  ┌──────────────────────────────────┐  │
│  │  TKT-2026-0001                   │  │
│  │  Title of the maintenance ticket │  │
│  │  📍 Location  🏷 Category        │  │
│  │  [PRIORITY BADGE]                │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  Status Update                         │
│  ┌─────────────────┬────────────────┐  │
│  │ PREVIOUS STATUS │ CURRENT STATUS │  │
│  │  [old badge]    │  [new badge]   │  │
│  └─────────────────┴────────────────┘  │
│  Note: {reason if provided}            │
├────────────────────────────────────────┤
│  Assigned Technician  (if assigned)    │
│  ○  Tech Name                          │
│     🔧 Specialization                  │
│     ✉️ email@example.com               │
│     📞 +1 234 567 8900                 │
│     [availability badge]               │
├────────────────────────────────────────┤
│  Cost Estimate  (if estimate exists)   │
│  ┌────────────────────────────────┐    │
│  │ EST-2026-0001    [APPROVED]    │    │
│  │ Description   Qty  Price  Total│    │
│  │ Labor work     1   $100   $100 │    │
│  │ Spare parts    2   $50    $100 │    │
│  │ ──────────────────────────── ─│    │
│  │ Subtotal:  $200                │    │
│  │ Tax:        $20                │    │
│  │ Total:     $220                │    │
│  └────────────────────────────────┘    │
├────────────────────────────────────────┤
│  Automated notification — FixFlow      │  ← footer
└────────────────────────────────────────┘
```

### SMTP Setup (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # Gmail App Password (not account password)
```

If `SMTP_USER` is not set, email sending is silently skipped — the app continues without notifications.

---

## Data Models & Relationships

### Entity Relationship Overview

```
User
  │── role: admin | technician | user
  │── isActive, phone, department
  │
  ├──(1:1)──▶ Technician
  │              specialization, availability, currentWorkload
  │
  ├──(1:N)──▶ Ticket (submittedBy)
  │              │── ticketNumber, title, description
  │              │── category: electrical|plumbing|hvac|structural|it|other
  │              │── priority: critical|high|medium|low
  │              │── status: SUBMITTED|UNDER_REVIEW|APPROVED|ASSIGNED|
  │              │           IN_PROGRESS|ON_HOLD|COMPLETED|CLOSED|REJECTED
  │              │── location, imageBase64
  │              │── assignedTo → User (technician)
  │              │── slaPolicy → SLAPolicy
  │              │── slaDeadline, slaStatus: on_track|at_risk|breached
  │              │── closedAt
  │              │
  │              ├──(1:N)──▶ TicketComment
  │              │              authorId, body (immutable)
  │              │
  │              ├──(1:N)──▶ TicketAttachment
  │              │              uploadedBy, filename, mimetype, size
  │              │
  │              ├──(1:N)──▶ AuditLog
  │              │              actorId, action, fromValue, toValue (immutable)
  │              │
  │              └──(1:1)──▶ Estimate
  │                             estimateNumber, status, subtotal, tax, total
  │                             │
  │                             ├──(1:N)──▶ EstimateItem
  │                             │              type, description, qty, unitPrice
  │                             │
  │                             └──(1:1)──▶ Invoice
  │                                            invoiceNumber, dueDate, status
  │                                            │
  │                                            └──(1:N)──▶ Payment
  │                                                           amount, method,
  │                                                           referenceNumber
  │
SLAPolicy
  priority (unique), responseTimeHours, resolutionTimeHours

Counter
  name: TKT|EST|INV, seq (auto-increment)
```

### Models Summary

| Model | Key Fields | Notes |
|---|---|---|
| User | name, email, passwordHash, role, isActive, phone, department | Indexed by email (unique) |
| Technician | userId, specialization, availability, currentWorkload | 1:1 with User |
| Ticket | ticketNumber, title, status, priority, category, location, submittedBy, assignedTo, slaDeadline, slaStatus | Core entity; 9 statuses |
| TicketComment | ticketId, authorId, body | Immutable |
| TicketAttachment | ticketId, uploadedBy, filename, mimetype, size | Memory storage in serverless |
| AuditLog | ticketId, actorId, action, fromValue, toValue | Immutable, system-generated |
| SLAPolicy | priority (unique), responseTimeHours, resolutionTimeHours | One per priority level |
| Estimate | estimateNumber, ticketId, status, subtotal, tax, total | Auto-numbered |
| EstimateItem | estimateId, type, description, quantity, unitPrice, lineTotal | Linked to Estimate |
| Invoice | invoiceNumber, ticketId, estimateId, status, dueDate, paidAt | Auto-numbered |
| Payment | invoiceId, amount, method, referenceNumber, outstandingBalance | Immutable |
| Counter | name, seq | Auto-numbering engine |

---

## API Reference

Base URL: `/api`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, sets httpOnly cookie |
| GET | `/auth/me` | Required | Get current authenticated user |
| POST | `/auth/logout` | Required | Logout, clears cookie |

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users (paginated) |
| GET | `/users/technicians` | List all technicians |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update user details |
| PATCH | `/users/:id/role` | Change user role |
| PATCH | `/users/:id/activate` | Activate user account |
| PATCH | `/users/:id/deactivate` | Deactivate user account |

### Tickets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tickets` | Required | List tickets (role-filtered) |
| POST | `/tickets` | Required | Create new ticket |
| GET | `/tickets/:id` | Required | Get ticket details |
| PATCH | `/tickets/:id` | Admin | Update ticket fields |
| DELETE | `/tickets/:id` | Admin | Delete ticket |
| PATCH | `/tickets/:id/status` | Required | Change ticket status |
| POST | `/tickets/:id/assign` | Admin | Assign technician |
| GET | `/tickets/:id/comments` | Required | Get comments |
| POST | `/tickets/:id/comments` | Required | Add comment |
| DELETE | `/tickets/:id/comments/:commentId` | Required | Delete comment |
| GET | `/tickets/:id/attachments` | Required | List attachments |
| POST | `/tickets/:id/attachments` | Required | Upload file |
| DELETE | `/tickets/:id/attachments/:attachmentId` | Required | Delete attachment |
| GET | `/tickets/:id/audit` | Admin | Get audit history |

### Estimates (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/estimates` | List all estimates |
| POST | `/estimates` | Create estimate |
| GET | `/estimates/:id` | Get estimate with items |
| PATCH | `/estimates/:id` | Update estimate |
| POST | `/estimates/:id/items` | Add line item |
| DELETE | `/estimates/:id/items/:itemId` | Delete line item |
| PATCH | `/estimates/:id/approve` | Approve estimate |
| PATCH | `/estimates/:id/reject` | Reject estimate |

### Invoices (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/invoices` | List invoices |
| POST | `/invoices` | Create invoice from estimate |
| GET | `/invoices/:id` | Get invoice details |
| PATCH | `/invoices/:id` | Update invoice |
| PATCH | `/invoices/:id/issue` | Issue invoice |

### Payments (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/payments` | List all payments |
| POST | `/payments` | Record a payment |
| GET | `/payments/:id` | Get payment details |

### SLA Policies (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/sla-policies` | List all SLA policies |
| POST | `/sla-policies` | Create SLA policy |
| PATCH | `/sla-policies/:id` | Update SLA policy |
| POST | `/sla-policies/trigger-sweep` | Manually run SLA sweep |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | Admin | KPIs, distributions, revenue |
| GET | `/dashboard/technician` | Admin / Technician | Workload overview |

### Analytics (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics` | Aggregated ticket, SLA, technician, and category metrics |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Required | List own unread notifications |
| PATCH | `/notifications/read-all` | Required | Mark all notifications as read |

### AI Analysis

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai/analyze-image` | Required | Analyze maintenance image via Claude (`AI_ANALYSIS_ENABLED=true` required) |

### Ticket Feedback

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tickets/:id/feedback` | Required | Get feedback for a ticket |
| POST | `/tickets/:id/feedback` | Required | Submit rating and comment for a resolved ticket |

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server liveness check |

### Standard Response Format

```json
// Success
{ "success": true, "data": { } }

// Paginated
{ "success": true, "data": [], "total": 45, "page": 1, "totalPages": 5 }

// Error
{ "success": false, "message": "Error description", "errors": [] }
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation failure |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, existing SLA policy) |
| 500 | Internal server error |

---

## Dashboard & Reporting

### Admin Dashboard (`GET /api/dashboard/summary`)

| Metric | Description |
|---|---|
| Total tickets | All-time ticket count |
| Open tickets | Active (not CLOSED or REJECTED) |
| Closed tickets | Resolved ticket count |
| Breached tickets | SLA breached and still open |
| Active users | Count of isActive users |
| Recent tickets | Last 7 days with trend % vs prior 7 days |
| Total revenue | Sum of all recorded payments |
| Status distribution | Count per status for charts |
| Priority distribution | Count per priority |
| SLA distribution | on_track / at_risk / breached counts |

### Technician Dashboard (`GET /api/dashboard/technician`)

| Data | Description |
|---|---|
| Assigned tickets | Paginated, sorted by priority |
| In-progress count | Active working tickets |
| Completed this month | Monthly completion count |
| Technician workload | All technicians: workload, availability, specialization |

---

## Audit Logging

Every significant action creates an immutable `AuditLog` record:

| Action | Triggered By |
|---|---|
| TICKET_CREATED | Ticket creation |
| STATUS_CHANGED | Status transition |
| TICKET_ASSIGNED | Technician assigned |
| SLA_BREACHED | Automated cron sweep |
| ESTIMATE_APPROVED | Estimate approval |
| COMMENT_ADDED | New comment added |

```typescript
AuditLog {
  ticketId:   ObjectId
  actorId:    ObjectId   // user ID or system (000000000000000000000000)
  action:     string
  fromValue:  string
  toValue:    string
  metadata:   object
  createdAt:  Date       // immutable, set once
}
```

---

## Real-Time Events (Socket.io)

The server runs a Socket.io instance alongside Express. Clients connect to `http://localhost:5000` (or the deployed server URL) and join a personal room keyed by their user ID upon authentication.

### Events emitted by the server

| Event | Trigger | Audience |
|---|---|---|
| `ticket_mutation` | Any ticket created, status changed, or assigned | All connected clients (broadcast) |
| `ticket_status` | Ticket status changes | Submitter only |
| `ticket_assigned` | Ticket assigned to a technician | Assigned technician only |
| `ticket_comment` | Comment added to a ticket | The other party (submitter or technician) |

### Payload shape (user-targeted events)

```json
{
  "type": "ticket_assigned",
  "title": "New ticket assigned to you",
  "body": "TKT-2026-0001: Leaking pipe in Room 204",
  "ticketId": "664b2a..."
}
```

Notifications are persisted in MongoDB (`Notification` collection) and can be fetched via `GET /api/notifications`.

---

## Environment Variables

### Server (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWT tokens |
| `PORT` | ❌ | 5000 | HTTP server port |
| `NODE_ENV` | ❌ | development | `development` or `production` |
| `CLIENT_URL` | ❌ | http://localhost:5173 | Frontend URL for CORS |
| `JWT_EXPIRES_IN` | ❌ | 8h | JWT expiry duration |
| `UPLOAD_DIR` | ❌ | ./uploads | File upload directory (local dev only) |
| `SMTP_HOST` | ❌ | — | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | ❌ | 587 | 587 = STARTTLS, 465 = SSL |
| `SMTP_USER` | ❌ | — | Sender email address |
| `SMTP_PASS` | ❌ | — | Gmail App Password |
| `ANTHROPIC_API_KEY` | ❌ | — | API key for AI image analysis (Anthropic Claude) |
| `AI_ANALYSIS_ENABLED` | ❌ | `false` | Set to `true` to enable `/api/ai` endpoint |

### Client (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL (e.g. `http://localhost:5000/api`) |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas cluster (or local MongoDB)
- Gmail account with App Password (optional, for email)

### Install

```bash
git clone https://github.com/SHRIKEN117/Fix-Flow.git
cd Fix-Flow

cd server && npm install
cd ../client && npm install
```

### Server `.env`

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_EXPIRES_IN=8h

# Optional email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

# Optional AI analysis
ANTHROPIC_API_KEY=sk-ant-...
AI_ANALYSIS_ENABLED=false
```

### Client `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Seed Database

```bash
cd server && npm run seed
```

Demo accounts created:

| Email | Password | Role |
|---|---|---|
| admin@fixflow.com | FixFlow@2025 | admin |
| tech@fixflow.com | FixFlow@2025 | technician |
| user@fixflow.com | FixFlow@2025 | user |

### Run

```bash
# Backend (auto-reloads on file change)
cd server && npm run dev

# Frontend
cd client && npm run dev
```

Open `http://localhost:5173`

---

## Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel Static | `https://client-wine-xi.vercel.app` |
| Backend | Vercel Serverless | `https://server-fix-flow.vercel.app` |

### Server `vercel.json`

```json
{
  "version": 2,
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/api/index.ts" }]
}
```

### Client `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Vercel Environment Variables (Server)

Set in Vercel dashboard → Project → Settings → Environment Variables:

```
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN=8h
NODE_ENV=production
CLIENT_URL=https://client-wine-xi.vercel.app
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

### Serverless Considerations

| Challenge | Solution |
|---|---|
| DB cold start | `connectionPromise` cached across warm invocations |
| Read-only filesystem | Multer uses `memoryStorage()` |
| `process.exit()` crashes function | Replaced with thrown errors |
| CORS on DB errors | CORS middleware registered before DB middleware |
| Deployment Protection | Disabled via Vercel dashboard (Settings → Deployment Protection → None) |

---

## Security

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs, 12 rounds |
| JWT storage | httpOnly cookie (XSS protection) |
| Cookie flags | `secure: true`, `sameSite: none` in production |
| HTTP security headers | Helmet (HSTS, X-Frame-Options, CSP, etc.) |
| CORS | Restricted to configured `CLIENT_URL` with credentials |
| Input validation | Joi schemas on all POST/PATCH endpoints |
| Role authorization | `authorize()` middleware on every protected route |
| MongoDB injection | Mongoose ODM (parameterized queries, no raw strings) |
| File validation | Mimetype allowlist + 10 MB size limit |
| Rate limiting | `express-rate-limit` available per route |

