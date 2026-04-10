

# Visual Enhancement Plan — Public UI Polish

All changes are visual-only. No API calls, routing, or socket logic will be modified.

## Files to Modify

### 1. `src/index.css` — New utility classes
- Add `@keyframes pulse-glow` for the glowing status pill
- Add `.glow-gold` utility for winner border glow
- Add `.count-up` animation helper class

### 2. `src/components/ui/StatusBadge.tsx` — Glowing status pill
- Add a pulsing dot indicator: green pulse for `registration`, blue for `active`, static grey for `completed`
- Use CSS animation for the pulse effect

### 3. `src/pages/admin/AllTournaments.tsx` — Tournament card upgrades
- Add sport icon badge overlay on the banner image (bottom-left corner)
- Replace the existing StatusBadge with the new glowing version
- Add a `Progress` bar below the card content showing `teamCount / teamSlots`
- Add hover lift + shadow: `hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all`

### 4. `src/pages/viewer/PublicBracketPage.tsx` — Major visual overhaul
- **Cinematic banner header**: Full-width banner with `bg-gradient-to-t from-background via-background/60 to-transparent` overlay. Tournament name, sport badge, and status pill overlaid on the banner. Remove the separate banner + title sections.
- **Countdown timer**: New inline component using `useEffect` + `setInterval` that counts down to `tournament.startDate` when status is `upcoming` or `registration`. Shows days/hours/minutes/seconds.
- **Champion banner upgrade**: Gold gradient background, show winning team name (from bracket final match winner), trigger confetti on mount.
- **Teams tab upgrade**: Add team color as `borderTop` accent. On hover, expand card to show player list inline (jersey numbers + positions). Use Framer Motion `AnimatePresence` + `layout` for smooth expand.
- **Skeleton loaders**: Add proper skeletons in bracket, leaderboard, and teams tab content areas while their respective queries are loading.
- **Empty states**: Use sport-specific icons from `SPORTS` config instead of generic Trophy.

### 5. `src/components/bracket/BracketView.tsx` — Bracket visual upgrade
- **Match card styling**: Increase `MATCH_HEIGHT` to ~80px. Add rounded corners (`rx={10}`). Add team color circles (small badge) next to team names. Display score between the two teams (centered column).
- **Winner gold glow**: Winner side gets a gold left border rect inside the match card.
- **BYE nodes**: Lower opacity (`opacity={0.4}`), italic "BYE" label, dashed stroke.
- **Column entrance animation**: Each round column (`ri`) fades and slides in from the left with staggered delay using Framer Motion `initial={{ opacity: 0, x: -30 }}`.
- **Winner advance animation**: When `match.winnerId` changes, the match node gets a `layoutId` transition or a scale-pulse animation.

### 6. `src/components/leaderboard/LeaderboardTable.tsx` — Leaderboard polish
- Medal icons already exist for rank 1/2/3 — keep them, ensure gold/silver/bronze colors are distinct.
- Add a colored left border strip per row using `team.color` as inline `borderLeft` style.
- Add a `CountUp` effect: wrap stat numbers in a component that animates from 0 to the value on first render using `requestAnimationFrame` or a simple `useEffect` tween.

### 7. New component: `src/components/ui/CountUpNumber.tsx`
- Small component that takes a `value: number` and animates from 0 to that value over ~800ms on mount. Uses `useEffect` with `requestAnimationFrame`.

### 8. New component: `src/components/ui/CountdownTimer.tsx`
- Takes a `targetDate: string`. Computes remaining time. Returns formatted `Xd Xh Xm Xs` display. Updates every second via `setInterval`. Shows "Started" if past.

## Technical Details

- **No new dependencies** — all animations use existing Framer Motion + CSS
- **Progress bar** reuses existing `src/components/ui/progress.tsx`
- **CountUp** is a lightweight ~30-line component using `requestAnimationFrame`
- **Countdown** is a ~40-line component using `setInterval` + `useState`
- Team card hover expand uses Framer Motion `animate={{ height: "auto" }}` pattern
- All changes scoped to visual rendering — no query keys, service calls, or socket handlers are touched

