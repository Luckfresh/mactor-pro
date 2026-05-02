# Mactor Pro — Full Ecosystem Design

**Date:** 2026-05-02  
**Author:** Claude (brainstorming session with Julio)  
**Status:** Approved by user

---

## Vision

Transform Mactor Pro from a read-only Google Sheets viewer into a world-class property maintenance ecosystem. Four surfaces, one database (Google Sheets), serving four user types: Julio (admin/owner), building managers (Eddie + future clients), technicians, and tenants.

Google Sheets remains the database until scale demands otherwise. The app becomes the sole interface — no one needs to open Sheets directly.

---

## The Three Sources of Work

Every work order in the system originates from one of three places:

```
SOURCE 1 — Inspection-Driven
  Julio inspects on-site → mobile form → Inspections_Import sheet
  → Eddie sees defects with urgency levels → approves/rejects
  → Approved = work order enters Julio's queue

SOURCE 2 — Manager-Initiated
  Eddie opens dashboard → "Add Work Order"
  → Auto-approved (Eddie is the client, he decides)
  → Enters Julio's queue immediately

SOURCE 3 — Tenant-Reported
  Tenant scans QR code on unit door → portal → submits defect + photos
  → Eddie reviews → approves (building expense) or rejects or quotes (tenant expense)
  → If approved: same queue as above
  → If private service: Mactor Pro quotes tenant directly (new revenue stream)
```

---

## User Roles

| Role | Who | Access |
|------|-----|--------|
| `admin` | Julio | Everything across all clients, inspection tool, billing |
| `manager` | Eddie (+ future clients) | Their buildings only, approvals, add work, tenant reports |
| `tenant` | Residents | Their unit only, submit reports, track status |

---

## Work Order Lifecycle

```
REPORTED → APPROVED → IN PROGRESS → COMPLETED → CLOSED

REPORTED:    Created by inspection, manager, or tenant
APPROVED:    Manager approves (or auto-approved if manager-initiated)
IN PROGRESS: Julio/technician claims the work order
COMPLETED:   Technician uploads evidence, hours, material cost
CLOSED:      Manager confirms satisfactory → hours deducted from cycle
```

---

## Hours & Plans Model

### Client Plan (not per-building)

Hours belong to the **client (manager)**, not to individual buildings. Eddie has one plan covering all his buildings — he distributes hours as he sees fit.

```
ClientPlan:
  clientId       — unique key (e.g. "eddie")
  clientName
  managerEmail
  buildings[]    — list of building names covered
  hoursPerCycle  — contractual hours (e.g. 40)
  active

Example:
  eddie | Eddie M. | eddie@email.com | [Phase I, Phase II, Phase III] | 40 | TRUE
```

### Rollover Rules

- Unused hours accumulate month-over-month for up to **3 months**
- After 3 months of accumulation without use, the rollover **resets to 0**
- Maximum rollover = 3 × hoursPerCycle (e.g., 120h if nothing is used for 3 cycles)
- Extra hours beyond plan + rollover = **$75/hour** (billed separately)

### Cycle Balance Calculation

```
Available this cycle = hoursPerCycle + rolledOverIn
Used this cycle      = SUM(duration) from All_Visits where cycleLabel = current
Extra hours          = MAX(0, used - available)
Rollover out         = MAX(0, available - used)
Rollover resets      = IF cycle_age > 3 months → rolledOverIn = 0
```

### Cycle Balance Sheet (`Cycle_Balances`)

```
clientId | cycleLabel | plannedHours | usedHours | rolledOverIn | rolledOverOut | extraHours | closedAt
eddie    | 2026-03    | 40           | 35.5      | 0            | 4.5           | 0          | 2026-03-24
eddie    | 2026-04    | 40           | 42.0      | 4.5          | 2.5           | 0          | 2026-04-24
```

---

## Google Sheets Data Model

### Existing sheets (unchanged structure)

| Sheet | Purpose |
|-------|---------|
| `All_Visits` | Completed and in-progress work records |
| `Building_Config` | Per-building settings (cycleDayStart, etc.) |
| `Units_Sumary` | Unit metadata and totals |
| `Review_Log` | Work entries pending manager approval |
| `Inspections_Import` | Raw inspection entries from mobile form |

### New sheets

**`Client_Plans`**
```
clientId | clientName | managerEmail | buildings | hoursPerCycle | active
```

**`Cycle_Balances`**
```
clientId | cycleLabel | plannedHours | usedHours | rolledOverIn | rolledOverOut | extraHours | closedAt
```

**`Tenant_Reports`**
```
reportId | date | building | unitId | tenantName | phone | email |
description | urgency (low|medium|high|emergency) | photos |
status (pending|approved|rejected|quoted) | eddieAction | 
serviceType (building|private) | quotedAmount | resolvedDate
```

### Building_Config changes

Add `clientId` column to link each building to its client plan.

---

## The Four App Surfaces

### Surface 1 — Admin Dashboard (Julio)

**URL group:** `/(admin)/` → all URLs prefixed with `/admin`

**Pages:**

| Route | Purpose |
|-------|---------|
| `/admin` | Global overview: all clients, all pending work, hours summary |
| `/admin/clients` | List of client plans, create/edit |
| `/admin/clients/[clientId]` | Client detail: cycle history, per-building hours breakdown, drill to unit |
| `/admin/buildings/[building]` | Building detail: units list |
| `/admin/buildings/[building]/units/[unitId]` | Unit detail: full work history |
| `/admin/approvals` | All pending approvals across all clients (admin override view) |
| `/admin/work-orders` | All work orders: filter by status, building, date |
| `/admin/reports` | Monthly summary PDF, cost reports, hours trend |
| `/admin/inspect` | Mobile inspection form (admin only — Julio's field tool) |
| `/admin/inspect/[building]/[unitId]` | Inspection form for specific unit |

**Key capabilities:**
- See every client's plan, hours, rollover, extra charges
- Approve/override any work order (admin override)
- Generate billing summary per client per cycle
- Manage users (add/remove managers, reset passwords)

---

### Surface 2 — Manager Dashboard (Eddie + future)

**URL group:** `/(manager)/` → all URLs prefixed with `/manager`

**Pages:**

| Route | Purpose |
|-------|---------|
| `/manager` | Building overview: hours gauge, pending approvals count, recent activity |
| `/manager/approvals` | Pending work orders (from inspections + tenant reports) — approve/reject |
| `/manager/work-orders` | All work orders for their buildings, add new |
| `/manager/work-orders/new` | Create work order (auto-approved, goes to Julio's queue) |
| `/manager/buildings/[building]` | Building detail, unit list |
| `/manager/buildings/[building]/units/[unitId]` | Unit history |
| `/manager/tenants` | Tenant reports: review, approve, reject, quote |
| `/manager/history` | Closed cycles, cost history |

**Hours display (always visible):**
```
[============================----] 38h / 44.5h available
Plan: 40h + 4.5h rollover | Extra: 0h | Resets: Jun 24
```

---

### Surface 3 — Inspection App (Julio, mobile-first)

Integrated into the admin URL group at `/admin/inspect`. Requires admin session. Optimized for field use on a phone.

**Pages:**

| Route | Purpose |
|-------|---------|
| `/admin/inspect` | Select building → unit/area → begin inspection |
| `/admin/inspect/[building]/[unitId]` | Inspection form for specific unit |

**Form fields:**
- Building (pre-selected if coming from unit QR)
- Unit / Area (Unit | Common Area | Exterior | Parking)
- Area name
- Defect type (dropdown: Plumbing, Electrical, HVAC, Structural, Cosmetic, Safety, Other)
- Urgency (Low | Medium | High | Emergency)
- Description (free text)
- Photos (camera capture → uploads to Google Drive folder)
- Estimated repair time
- Notes

**Offline support:** Form data saved to `localStorage` if no connection. Syncs to Sheets when back online. Banner shows "X entries pending sync."

**On submit:** Writes row to `Inspections_Import` sheet + creates entry in `Review_Log` with `status = REPORTED`, `approved = FALSE`.

---

### Surface 4 — Tenant Portal (Residents)

**URL group:** `/(tenant)/`

No login required. Access via QR code or direct link. Minimal friction.

**Pages:**

| Route | Purpose |
|-------|---------|
| `/report` | Landing page: enter building + unit or scan QR |
| `/report/[building]/[unitId]` | Report form |
| `/report/[building]/[unitId]/status` | Check status of submitted reports |

**QR Code flow:** Each unit's QR encodes `/report/[building]/[unitId]` — tenant scans, unit is pre-filled.

**Form fields:**
- Name + phone (or email) — for notifications
- Urgency (Low | Medium | High | Emergency)
- Description
- Photos (camera capture)
- Optional: "I'd also like a quote for private services"

**On submit:** Writes row to `Tenant_Reports` sheet. Eddie gets email notification.

**Status page:** Tenant enters their phone/email → sees all their submitted reports and current status.

**Private service upsell:** If tenant checks "quote for private services," Julio gets flagged. He can respond with a quote directly to the tenant. This is billed to the tenant, not Eddie.

---

## Notifications (Email)

| Trigger | Who gets notified |
|---------|-------------------|
| New inspection results submitted | Eddie (manager of that building) |
| New tenant report submitted | Eddie |
| Work order approved | Julio (admin) |
| Work order rejected | Julio + technician who logged it |
| Work order completed | Eddie (to confirm/close) |
| Cycle nearing hours limit (80%) | Eddie |
| Cycle closed with extra hours | Eddie (includes cost) |

Implementation: Next.js API route → `nodemailer` or Resend. Simple, no external service required.

---

## QR Codes

Generated from admin dashboard (`/clients/[clientId]/qr-codes`). One QR per unit per building. Downloadable as PDF sheet for printing.

Encodes: `https://mactor-pro.vercel.app/report/[encodedBuilding]/[encodedUnitId]`

---

## Phase 1 — Fixes & Foundation (implement first)

Before building new features, fix what's broken:

1. **English UI** — all hardcoded Spanish strings → English throughout
2. **40h per cycle** — update `Building_Config` sheet + `calculateHoursBalance()` to read from `Client_Plans`
3. **Fix pending approvals bug** — `getPendingApprovalCount()` counts rows where `approved` is empty string, not just explicit `FALSE`. Fix filter to only count `approved === false || approved === 'FALSE'` AND `status !== 'Completed'`
4. **Rollover implementation** — `calculateHoursBalance()` reads `Cycle_Balances` for prior 3 cycles and sums valid rollover
5. **Clickable approvals** — pending count on dashboard links to `/approvals` page showing actual pending items
6. **NavBar links** — fix broken routes (approvals, history, settings pages must exist)

---

## Phase 2 — Approvals Engine

7. **`/approvals` page** — list all `Review_Log` entries where `approved = false`, grouped by building, with approve/reject buttons
8. **Approve/Reject writes to Sheet** — POST API updates `Review_Log` row: sets `approved`, `approvedBy`, `approvalDate`, `pmComments`
9. **Auto-close cycle** — on the 24th, compute `Cycle_Balances` row for closing cycle
10. **Email notifications** on approval/rejection

---

## Phase 3 — Work Orders (Eddie adds, Julio executes)

11. **`/work-orders/new`** — form for managers to create work orders
12. **POST to `Review_Log`** — manager-created orders flagged as auto-approved
13. **Work order status flow** — Julio claims → marks in-progress → marks completed with hours + cost
14. **Write to `All_Visits`** — on completion, writes final row to `All_Visits`

---

## Phase 4 — Inspection App

15. **Mobile inspection form** — Julio's field tool
16. **Photo upload** — capture from camera → upload to Google Drive → store URL
17. **Offline queue** — localStorage buffer with sync
18. **Writes to `Inspections_Import`** and creates `Review_Log` entry

---

## Phase 5 — Tenant Portal

19. **QR code generator** — admin generates codes per unit
20. **Tenant report form** — no login, pre-filled from QR
21. **Eddie's tenant review UI** — approve/reject/quote
22. **Tenant status page** — check report status by phone/email
23. **Private service upsell flow**

---

## Tech Stack (unchanged)

- **Framework:** Next.js 16 App Router, TypeScript, Tailwind CSS v4
- **Database:** Google Sheets via Sheets API v4 (OAuth2 refresh token)
- **Auth:** NextAuth v5 beta (Credentials provider)
- **PDF:** @react-pdf/renderer
- **Email:** Resend (recommended) or nodemailer
- **Hosting:** Vercel

---

## Security Notes

- Tenant portal is unauthenticated by design (QR access) — no sensitive data exposed
- Manager and admin routes require session with correct role
- Write API routes validate session + role before touching Sheets
- Rate limiting on tenant report submission (prevent spam)
- Google Sheets OAuth token stored server-side only (never exposed to client)

---

## Open Questions (resolved during brainstorming)

| Question | Decision |
|----------|---------|
| Hours per building or per client? | Per client plan — Eddie has 40h shared across all 3 buildings |
| Who approves work? | Eddie (manager) approves; Julio (admin) can override |
| Separate plans or shared pool? | Single pool per client, distributed freely across buildings |
| Rollover reset timing | After 3 months of accumulation, resets to 0 |
| Extra hours rate | $75/hour beyond plan + rollover |
| Tenant auth | No login — QR code or direct link, phone/email for status lookup |
| Sheets vs DB | Keep Sheets until scale demands migration |
