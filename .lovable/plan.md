
# Combat Market — Merchant & Admin Platform (Phase 1)

## Design & Branding
- **Dark theme** matching combatmarket.com: near-black backgrounds, white text, bold uppercase headings
- **Red accent color** (#E53935 / Combat Market red) for CTAs, active states, and highlights
- **Clean, modern UI** with card-based layouts, subtle borders, and professional typography
- Combat Market logo in the header/sidebar

## Authentication & Roles
- Login/signup pages with email authentication via Supabase Auth
- User profiles linked to merchants
- **Role-based access control (RBAC)**: OWNER, MARKETING, FINANCE, ANALYST, SUPPORT
- Roles stored in a dedicated `user_roles` table with security-definer functions
- Merchant users can only see their own merchant's data (tenant isolation)

## Module A — Merchant Portal

### Dashboard
- Overview cards: Float balance, active missions, pending submissions, total payouts
- Recent activity feed
- Quick action buttons (Top Up, Create Mission)

### Merchant Account Settings
- Edit brand details (name, website, currency)
- Manage team members and assign roles
- View merchant status (PENDING / ACTIVE / SUSPENDED)

## Module B — Float Account System

### Float Dashboard
- **Current balance**, **reserved balance**, and **available balance** displayed prominently
- Balance history chart over time

### Float Ledger
- Full ledger table with columns: date, type, amount, status, reference, description
- Filters by date range and entry type (TOPUP, RESERVE, RELEASE, PAYOUT, etc.)
- CSV export functionality

### Top-Up Flow
- Top-up form where merchant enters amount
- Creates a pending ledger entry (payment integration placeholder for Phase 2)
- Admin can approve/post top-ups

### Backend: Ledger Infrastructure
- Immutable append-only `float_ledger` table
- Computed balances via SQL functions (never stored directly)
- Idempotency keys on all financial operations
- Database functions for atomic mission publish (validate float → reserve → update status in one transaction)

## Module C — Mission Engine

### Mission List
- Table/card view of all missions with status badges (DRAFT, SCHEDULED, ACTIVE, PAUSED, CLOSED)
- Filters by status, date range
- Search by mission name

### Mission Create/Edit
- Multi-step form: Basic Info → Budget & Rewards → Targeting → Evidence Requirements → Review
- Fields: name, description, type, budget, reward per participant, max participants, dates, evidence type, validation mode
- Save as Draft or Publish (publish triggers atomic float reservation)

### Mission Detail View
- Mission overview with key metrics
- Participation list: fighters who joined, their status
- Submission review panel: view evidence, approve/reject
- Budget tracker: reserved vs. spent vs. remaining

### Mission Lifecycle
- Status transitions: DRAFT → SCHEDULED → ACTIVE → PAUSED → CLOSED
- Pause/resume controls
- Close mission releases unused budget back to float

## Module D — Admin Panel

### Admin Dashboard
- System-wide metrics: total merchants, total float, active missions, pending reviews
- Alerts for items needing attention

### Merchant Management
- List all merchants with status filters
- View/edit merchant details
- Activate, suspend, or review merchants

### Submission Review Queue
- Queue of pending submissions across all merchants
- View evidence, fighter info, mission details
- Approve or reject with reason
- Batch approve/reject capability

### Payout Processing
- Batch payout view: approved submissions ready for payout
- Process payout creates PAYOUT ledger entries
- Payout history with full audit trail

### Float Administration
- Post manual adjustments (with mandatory reason)
- View any merchant's ledger
- Reconciliation tools

## Module E — Reporting
- Mission performance metrics: eligible, started, submitted, approved, rejected, paid, approval rate
- Financial summary: reserved total, paid total, unused budget
- Ledger CSV export
- Date range filters on all reports

## Database Schema (Supabase)
- `merchants` — merchant accounts with status and details
- `user_roles` — RBAC with security-definer check functions
- `float_ledger` — immutable financial ledger with idempotency keys
- `missions` — mission data with lifecycle status
- `mission_participations` — fighter-to-mission join table
- `submissions` — evidence submissions with review status
- RLS policies ensuring complete tenant isolation
- Database functions for atomic operations (mission publish, payout processing)

## Navigation Structure
- **Merchant view**: Sidebar with Dashboard, Missions, Float, Reports, Settings
- **Admin view**: Sidebar with Dashboard, Merchants, Review Queue, Payouts, System Reports
- Role-based menu visibility
