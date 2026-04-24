

# Breadcrumbs + Life + Real Sports Imagery

Three things: (1) breadcrumbs for wayfinding, (2) ambient motion/animation polish, (3) real-world sport photography woven throughout.

---

## Part 1 — Real Sports Photography

Source high-quality, royalty-free real photos from **Unsplash** (not AI-generated) covering all 6 sports: football, basketball, tennis, volleyball, cricket, badminton. Use direct Unsplash CDN URLs (`https://images.unsplash.com/...`) with width/quality params for fast loading.

**Where photos go:**
- **Home hero**: Full-bleed background collage — a stadium/crowd shot with dark gradient overlay so text stays readable
- **Supported Sports section**: Replace plain icon tiles with sport photo cards (action shot per sport) with sport icon + name overlaid
- **How It Works**: Each step gets a small thematic photo accent
- **Sport Info Page (`/sports/:sport`)**: Hero banner becomes a real action shot of that sport
- **Browse Tournaments empty state**: Atmospheric stadium photo behind the empty message
- **Tournament cards without uploaded banner**: Fallback to a sport-specific Unsplash photo instead of placeholder
- **Login/Register pages**: Split-screen with a sports photo side panel on desktop

**Implementation**: Add `src/constants/sportImages.ts` mapping each sport key → curated array of Unsplash URLs (hero, action, tile, banner variants). Components pull from this map.

---

## Part 2 — Breadcrumb Navigation

New `src/components/ui/PageBreadcrumbs.tsx` — built on existing shadcn `breadcrumb.tsx`, accepts `items: { label, href? }[]`, framer-motion fade-in, mobile-collapses with ellipsis.

Dropped into:
- `/admin/dashboard`, `/admin/tournaments`, `/admin/tournaments/create`, `/admin/tournaments/:id`
- `/tournament/:inviteCode`, `/sports/:sport`, `/viewer/dashboard`

Dynamic labels (tournament name, sport name) pulled from existing query data.

---

## Part 3 — Bringing the Site to Life

### Ambient layer
- New `src/components/ui/AmbientBackground.tsx` — fixed full-screen, 3 large blurred orbs (primary blue, sport-orange, sport-purple) drifting via `@keyframes drift` (20–30s loops), ~8% opacity. Subtle SVG noise overlay for film grain. Mounted once in `App.tsx`.

### New keyframes in `src/index.css`
- `drift` (orb movement), `shimmer` (button sweep), `gradient-shift` (text gradient cycle)
- Utilities: `.animated-gradient-text`, `.btn-shimmer`, `.card-glow-hover`

### Hero (`Index.tsx`)
- Real stadium photo background with dark gradient overlay
- Animated gradient on the word "Competitions"
- Floating sport icons (low opacity) with varied `animate-float` delays
- Subtle mouse-parallax tilt on the headline

### Cards everywhere
- Hover: gradient border glow tinted by the sport's accent color
- Shine sweep across banner on hover
- Bouncier spring entrance with stagger

### Stats bar
- Soft pulse glow when CountUp finishes
- Tiny sparkline accent line under each stat

### Navbar
- Logo hover: gentle rotate + scale
- Active route: animated underline (`.story-link` pattern)

### Buttons (`button.tsx`)
- Primary variant gets shimmer sweep on hover
- `active:scale-95` press-down on all variants

### Page transitions
- `PublicLayout`, `AdminLayout`, `ViewerLayout` wrap `<Outlet />` in Framer Motion `AnimatePresence` keyed by `location.pathname` — fade + slight slide up

---

## Files

**Created:**
- `src/components/ui/PageBreadcrumbs.tsx`
- `src/components/ui/AmbientBackground.tsx`
- `src/constants/sportImages.ts` — Unsplash URL map per sport

**Modified:**
- `src/index.css`, `src/App.tsx`, `src/components/ui/button.tsx`
- `src/components/layout/{PublicLayout,AdminLayout,ViewerLayout,Navbar}.tsx`
- `src/pages/Index.tsx` (hero photo, floating icons, gradient text, sport photo tiles)
- `src/pages/SportInfoPage.tsx` (real action-shot hero)
- `src/pages/BrowseTournaments.tsx` (photo fallback for cards, atmospheric empty state)
- `src/pages/auth/{LoginPage,RegisterPage}.tsx` (split-screen sports photo panel)
- `src/pages/admin/{AdminDashboard,AllTournaments,CreateTournament,ManageTournament}.tsx` (breadcrumbs + photo fallbacks)
- `src/pages/viewer/{PublicBracketPage,ViewerDashboard}.tsx` (breadcrumbs)

No API, routing, or socket logic touched.

