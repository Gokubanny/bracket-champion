

# Student Sports Competition App — Full Build Plan

## Overview
Build a complete tournament management SPA with admin controls, public bracket viewing, and team rep dashboards. Dark-mode-first design, custom SVG bracket with Framer Motion animations, real-time Socket.io updates, and full auth flow.

---

## Phase 1: Foundation & Layout

### Design System Setup
- Dark mode palette: deep navy background (`#0F172A`), sport-based accent colors
- Admin interface uses a slightly cooler tone; viewer interface slightly warmer
- Skeleton loader components for all async content
- Empty state components with illustrations

### Layout Components
- **Navbar**: Logo left, avatar/logout right (logged in) or Login button (guest), hamburger on mobile
- **Admin Sidebar**: Collapsible icon-only on tablet, full on desktop. Links: Dashboard, Tournaments, Create Tournament
- **PageWrapper**: Consistent padding, max-width, breadcrumbs

---

## Phase 2: Auth Pages

### Login (`/login`)
- Centered card with app branding
- Email + password fields, Zod validation
- On success: decode JWT role → redirect to `/admin/dashboard` or `/viewer/dashboard`
- Error toast for invalid credentials

### Register (`/register`)
- Admin-only registration
- Fields: full name, email, password, confirm password (Zod validated)
- On success → redirect to `/login`

### Auth Context
- React context reading JWT from httpOnly cookie
- Protected route wrapper checking role before render
- Axios interceptor for auth headers

---

## Phase 3: Admin Pages

### Admin Dashboard (`/admin/dashboard`)
- **Overview cards**: Total tournaments, active tournaments, pending approvals, upcoming matches today
- **Recent activity feed**: Scrollable list of events (tournament created, team approved, result confirmed)
- **Quick actions**: "Create Tournament" and "View All Tournaments" buttons

### Create Tournament (`/admin/tournaments/create`)
- **3-step form** with animated step indicator:
  - Step 1 — Basic Info: name, sport type dropdown (from SportConfig), description, banner upload with instant preview
  - Step 2 — Structure: team slots (4/8/16/32), start date picker, registration deadline, estimated match duration
  - Step 3 — Visibility & Review: public/private toggle, full summary, "Confirm & Create" button
- On creation: show generated invite link/code with copy button

### All Tournaments (`/admin/tournaments`)
- Grid of tournament cards (banner, name, sport icon, status badge, team count, start date)
- Filter by status and sport, search by name
- Click → navigate to manage page

### Manage Tournament (`/admin/tournaments/:id`)
- **4-tab layout**:
  - **Overview**: Details, status badge, invite link (copy), edit button, generate bracket button (conditional), cancel tournament (danger zone)
  - **Teams**: List with status badges (Pending/Approved/Rejected), approve/reject buttons, team detail side panel, status filter
  - **Bracket**: Custom SVG bracket tree with match nodes, score display, winner highlighting, BYE labels. Click match → score entry modal (when active). Read-only until tournament is active.
  - **Leaderboard**: Sport-specific columns (Football: P/W/L/GF/GA/GD/Pts, Basketball: P/W/L/PS/PC, Tennis: P/W/L/SW), top 3 highlighted, live updates

### Score Entry Modal
- Slide-in panel showing match details, round, date
- Two score inputs, live winner preview
- Confirm button (disabled until both filled)
- On confirm: bracket auto-advances, leaderboard refreshes, success animation
- Edit result available on completed matches (before next round)

---

## Phase 4: Viewer Pages

### Public Bracket Page (`/tournament/:inviteCode`)
- No login required for public tournaments
- Tournament banner, name, sport badge, status
- **3 tabs**: Bracket (read-only, animated, real-time via Socket.io), Leaderboard (read-only, live), Teams (grid with squad detail on click)
- Champion banner with confetti animation on tournament completion

### Team Rep Dashboard (`/viewer/dashboard`)
- Login required (viewer role)
- Team's bracket position highlighted
- Squad management (add/edit/remove players) — locked after tournament starts
- Team logo & color editor
- Upcoming match info
- Tournament status banner

---

## Phase 5: Custom SVG Bracket Component
- Rounds rendered as columns left-to-right
- Match nodes connected by bezier/line paths
- Winner path highlighted with glow/accent color
- BYE nodes styled distinctly
- Framer Motion: line-draw animation on result confirmation, smooth winner advancement
- Horizontally scrollable on mobile

---

## Phase 6: Real-Time & Polish

### Socket.io Integration
- `match:resultConfirmed` → bracket + leaderboard update
- `team:approved` → team rep dashboard update
- `tournament:started` → lock squad editing
- `tournament:completed` → champion banner + confetti

### API Services Layer
- Axios instance with base URL config and auth interceptor
- Service files: `authService`, `tournamentService`, `teamService`, `matchService`
- All wired through React Query for caching and refetching

### Animations & Polish
- Bracket line-draw animation
- Tab transitions (Framer Motion)
- Step form progress animation
- Score modal slide-in
- Champion confetti celebration
- Skeleton loaders everywhere (no spinners)
- Designed empty states for all lists/tables

### Responsive Design
- Mobile: stacked forms, horizontally scrollable bracket, hamburger nav
- Tablet: collapsed sidebar (icon-only)
- Desktop: full sidebar, spacious bracket view

---

## Sport Configuration
- Centralized `SportConfig` constant defining per-sport: icon, accent color, leaderboard columns, score labels
- Supports: Football, Basketball, Tennis, Volleyball (extensible)

