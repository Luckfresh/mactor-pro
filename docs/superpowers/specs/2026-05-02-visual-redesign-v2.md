# Mactor Pro — Visual Redesign v2 Spec

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task by task.

**Goal:** Replace the dark flat UI with a Light/Dark hybrid premium design: dark sidebar + light content area, indigo accent, world-class enterprise feel.

**Approved mockup:** `mactor-pro-design-preview.html` (on Desktop)

---

## Design Decisions (confirmed by user)

| Decision | Choice | Rationale |
|---|---|---|
| Layout | Sidebar (not topbar) | More premium, better hierarchy |
| Theme | Light/Dark hybrid | Sidebar dark, content light |
| Brand color | Amber #F59E0B | Logo/badge only — never interactive |
| Accent color | Indigo #4F46E5 | Active states, buttons, links |
| Warning color | Amber #D97706 | Status only (Minor, Pending) |
| Background page | #F8FAFC (gray-50) | |
| Background card | #FFFFFF | With shadow-sm + border |
| Text primary | #0F172A (slate-900) | |
| Text secondary | #475569 (slate-600) | |
| Text muted | #94A3B8 (slate-400) | |

---

## Color Token Mapping (Tailwind)

```
bg-slate-950  →  sidebar bg
bg-white      →  card bg
bg-gray-50    →  page bg (was bg-slate-950 in layout)
text-slate-900 →  primary text
text-slate-600 →  secondary text
text-slate-400 →  muted text
bg-indigo-600  →  primary button, active link bg
text-indigo-600 → links, active text
border-indigo-300 → focused inputs
bg-amber-500  →  MACTOR logo badge only
```

---

## Architecture Changes

### 1. Layout (`app/(admin)/layout.tsx`)
- Change from: `min-h-screen bg-slate-950` + topbar + `<main className="p-6">`
- Change to: `flex h-screen` with `<Sidebar>` (fixed left) + `<main className="flex-1 overflow-y-auto bg-gray-50">`
- Main content: `p-6 lg:p-8` max-width container

### 2. NavBar → Sidebar (`components/shared/NavBar.tsx`)
Complete rewrite as vertical sidebar:
- **Header**: MACTOR badge (amber) + "Pro" label + version
- **Nav sections**:
  - Section label "MAIN": Dashboard, Approvals (badge), Work Orders (badge), Inspections
  - Section label "TENANTS": Tenant Reports, QR Codes
- **Active state**: `bg-indigo-600/10 text-indigo-300 font-semibold` (sidebar dark)
- **Inactive state**: `text-slate-400 hover:text-slate-200 hover:bg-slate-800`
- **Bottom**: user avatar (initials circle, indigo gradient) + name + role + sign out
- Width: 220px fixed

### 3. All Page Components
Every page currently has:
- `bg-slate-800 rounded-xl` cards → `bg-white rounded-xl border border-gray-200 shadow-sm`
- `text-white` headings → `text-slate-900`
- `text-slate-400` secondary → `text-slate-500` (slightly darker for light bg)
- `bg-slate-700` inputs → `bg-white border border-gray-200` + focus:border-indigo-500
- `bg-slate-700 text-white` buttons → role-specific colors (see below)
- `← Dashboard` back links removed (sidebar handles navigation)
- `border-slate-700` dividers → `border-gray-100`
- `bg-slate-700/50` table rows hover → `hover:bg-gray-50`

### 4. Button System
```
Primary:    bg-indigo-600 text-white hover:bg-indigo-700
Secondary:  bg-white border border-gray-200 text-slate-700 hover:bg-gray-50
Success:    bg-green-50 border border-green-200 text-green-700 hover:bg-green-100
Danger:     bg-red-50 border border-red-200 text-red-700 hover:bg-red-100
Warning:    bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100
Brand CTA:  bg-amber-500 text-slate-900 (only for tenant portal / QR codes)
```

### 5. Status Badge System
```
Reported:   bg-purple-50 text-purple-700 border-purple-200
Pending:    bg-indigo-50 text-indigo-700 border-indigo-200
Claimed:    bg-green-50 text-green-700 border-green-200
In Progress: bg-orange-50 text-orange-700 border-orange-200
Completed:  bg-green-50 text-green-700 border-green-200
Rejected:   bg-red-50 text-red-700 border-red-200
```

### 6. KPI Cards
```
Base:   bg-white border border-gray-200 shadow-sm rounded-xl
Alert:  + border-l-4 border-l-indigo-500
Warn:   + border-l-4 border-l-amber-500
Label:  text-xs font-semibold text-slate-500 uppercase tracking-wide
Value:  text-3xl font-extrabold text-slate-900 tracking-tight
Sub:    text-xs text-slate-500 (ok: text-green-600, alert: text-indigo-600)
```

### 7. Table Rows
```
Header row: bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase
Data row:   border-b border-gray-100 hover:bg-gray-50 transition-colors
Cell text:  text-sm text-slate-700
Cell bold:  text-sm font-semibold text-slate-900
```

### 8. Section Labels (h2 upper)
```
Before: text-slate-300 text-sm font-semibold uppercase tracking-wide
After:  text-xs font-bold text-slate-500 uppercase tracking-widest
```

### 9. Pending Work Items / Alert Cards
```
Before: bg-slate-800 border border-slate-700
After:  bg-white border border-gray-200 shadow-sm
        + colored left-border per urgency:
          Urgent/Emergency: border-l-4 border-l-red-500
          High: border-l-4 border-l-orange-500
          Medium: border-l-4 border-l-amber-400
          Low: border-l-4 border-l-green-400
```

---

## Files to Change

| File | Change |
|---|---|
| `app/(admin)/layout.tsx` | Flex layout, sidebar + main, bg-gray-50 |
| `components/shared/NavBar.tsx` | Full rewrite as vertical Sidebar component |
| `app/(admin)/page.tsx` | KPI cards, hours bar, building cards, table → new styles |
| `components/admin/KPIRow.tsx` | New card styles |
| `components/admin/BuildingCard.tsx` | New card styles |
| `components/admin/RecentWorkTable.tsx` | New table styles |
| `components/shared/HoursBar.tsx` | Indigo gradient, light bg track |
| `app/(admin)/approvals/page.tsx` | New card/table styles |
| `components/admin/ApprovalActions.tsx` | New button styles |
| `app/(admin)/work-orders/page.tsx` | New styles, status badges |
| `components/admin/WorkOrderActions.tsx` | New button styles |
| `app/(admin)/work-orders/new/page.tsx` | New form styles |
| `app/(admin)/inspections/page.tsx` | New card styles |
| `components/admin/InspectionRequestCard.tsx` | New button styles |
| `components/admin/NewInspectionRequestForm.tsx` | New form styles |
| `components/admin/InspectionForm.tsx` | New wizard styles (dark card → light) |
| `app/(admin)/tenants/page.tsx` | New card styles |
| `components/admin/TenantReportActions.tsx` | New button styles |
| `app/(admin)/qr-codes/page.tsx` | New styles |
| `app/globals.css` | Update CSS variables to light theme |

---

## What Does NOT Change
- All logic, server actions, data fetching — untouched
- Auth flow, session handling — untouched
- Tenant portal `(tenant)` routes — separate design, not part of this spec
- Login page — separate, not part of this spec
- TypeScript types, lib/sheets/* — untouched
- Mobile inspection form core functionality — styles update only

---

## Success Criteria
1. App loads with sidebar on the left, content area white/gray-50 on the right
2. MACTOR amber badge in sidebar top-left
3. Active nav item shows indigo highlight
4. All cards white with subtle border + shadow
5. All status badges colored chips with matching bg/text/border
6. Buttons follow the new role-based color system
7. No dark flat backgrounds remain in the content area
8. TypeScript compiles clean after changes
