# Homepage Organic Modern Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage as a bright organic-modern, visitor-focused experience using only church-owned photography.

**Architecture:** Keep `index.tsx` responsible for language and weekly-data orchestration, while focused components under `components/home/` render each visual section. Keep the existing global theme system and add scoped `.home-*` styles; verify the static export with a small standard-library smoke test.

**Tech Stack:** Next.js 14 Pages Router, React 18, TypeScript 5, CSS, Node.js, Python 3 standard library.

## Global Constraints

- Use only `app/public/church-bg.png` and `app/public/pastor.jpg`; do not add stock photography.
- Preserve Korean/English switching, authentication, all configured themes, and static export.
- Add no runtime dependency or animation library.
- Motion must honor `prefers-reduced-motion`.
- Do not change unrelated pages except shared responsive/header fixes required to prevent breakage.

---

### Task 1: Homepage content model and weekly empty state

**Files:**
- Create: `app/src/components/home/homeContent.ts`
- Create: `app/src/components/home/WeeklyHighlights.tsx`
- Modify: `app/src/pages/index.tsx`

**Interfaces:**
- Produces: `WeeklyItem`, `getVisibleWeeklyItems(items, now)`, `HOME_PILLARS`, and `NEXT_STEPS`.
- `getVisibleWeeklyItems` returns `{ active: WeeklyItem[]; past: WeeklyItem[] }`, each capped at three.
- `WeeklyHighlights` consumes `items`, `lang`, and optional `now`.

- [ ] **Step 1: Add a failing static-export assertion**

Create `scripts/check-homepage.py` with assertions that `app/out/index.html` contains `home-weekly`, `weekly-empty`, and `/church-bg.png`, and does not contain `images.unsplash.com`, `20+`, `50+`, or `Entry photo placeholder`.

- [ ] **Step 2: Run the assertion to verify the current export fails**

Run:

```bash
cd app && npm run build && cd .. && python3 scripts/check-homepage.py
```

Expected: failure because the existing page still contains stock imagery, unverified statistics, or lacks the empty-state marker.

- [ ] **Step 3: Add typed homepage content and weekly filtering**

Implement:

```ts
export type Language = 'ko' | 'en';

export type WeeklyItem = {
  id: string;
  type: 'event' | 'sermon' | 'bulletin';
  titleEn: string;
  titleKo: string;
  summaryEn: string;
  summaryKo: string;
  date: string;
  url: string;
  expiresAt: string;
};

export const getVisibleWeeklyItems = (items: WeeklyItem[], now: Date) => ({
  active: items
    .filter((item) => new Date(`${item.expiresAt}T23:59:59`).getTime() >= now.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3),
  past: items
    .filter((item) => new Date(`${item.expiresAt}T23:59:59`).getTime() < now.getTime())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3),
});
```

Move the three verified church pillars and three next-step labels into bilingual constants in the same module. Build `WeeklyHighlights` with active cards and a `weekly-empty` fallback linking to `/events`, `/sermons`, and `/resources`.

- [ ] **Step 4: Type-check**

Run `cd app && npx tsc --noEmit`.

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/home app/src/pages/index.tsx scripts/check-homepage.py
git commit -m "Refactor homepage content and weekly updates"
```

### Task 2: Organic-modern hero and quick information

**Files:**
- Create: `app/src/components/home/HomeHero.tsx`
- Create: `app/src/components/home/QuickInfo.tsx`
- Modify: `app/src/pages/index.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- `HomeHero` consumes `{ lang: Language }`.
- `QuickInfo` consumes `{ lang: Language }`.
- Both components render only repository-owned imagery and verified service/location content.

- [ ] **Step 1: Build the split hero**

Render a `.home-hero` with concise bilingual copy, `/church-bg.png` in a framed `.home-hero__photo`, and links to `#visit` and the Google Maps directions URL. Remove the Unsplash image, decorative blob markup, and 20+/50+ statistics.

- [ ] **Step 2: Build the quick-information strip**

Render three linked cards for Sunday services, first-visit guidance, and Pennant Hills directions. Use inline SVG or CSS shapes only; do not use emoji as icons.

- [ ] **Step 3: Add scoped visual styling**

Add homepage variables for canvas, teal, mint, and gold. Implement the asymmetric desktop grid, organic pseudo-elements, responsive image crop, clear keyboard focus, and subtle entrance transitions.

Add:

```css
@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page *::before,
  .home-page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Verify build and static assertions**

Run `cd app && npm run build && cd .. && python3 scripts/check-homepage.py`.

Expected: `/church-bg.png` passes; remaining failures may only concern sections scheduled for Tasks 3–4.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/home app/src/pages/index.tsx app/src/styles/globals.css
git commit -m "Build organic modern homepage hero"
```

### Task 3: Streamlined information sections

**Files:**
- Create: `app/src/components/home/ChurchPillars.tsx`
- Create: `app/src/components/home/VisitOverview.tsx`
- Create: `app/src/components/home/PastorFeature.tsx`
- Modify: `app/src/pages/index.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Each component consumes `{ lang: Language }`.
- `VisitOverview` owns the `id="visit"` anchor and directions/map presentation.
- `PastorFeature` uses `/pastor.jpg`.

- [ ] **Step 1: Replace dense feature and service grids**

Render three concise pillars from `HOME_PILLARS`. Fold verified Sunday service times into the quick strip and visit section; remove the duplicate six-card gatherings grid.

- [ ] **Step 2: Consolidate first-visit information**

Build one two-column visit section with service expectations, children/language notes, address, and embedded map. Remove the separate visit form and entry-photo placeholder.

- [ ] **Step 3: Rebuild the pastor section**

Use an editorial split with a deliberate portrait crop, short bilingual introduction, address, phone, email, and one contact CTA.

- [ ] **Step 4: Add responsive section styling**

Use alternating off-white/mint section surfaces, varied card sizing, 860px and 560px breakpoints, and `overflow-wrap` for long Korean/English content. Confirm no fixed height clips translated text.

- [ ] **Step 5: Type-check and build**

Run `cd app && npx tsc --noEmit && npm run build`.

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/home app/src/pages/index.tsx app/src/styles/globals.css
git commit -m "Streamline homepage visit and church sections"
```

### Task 4: Next steps, shared polish, and full verification

**Files:**
- Create: `app/src/components/home/NextSteps.tsx`
- Modify: `app/src/pages/index.tsx`
- Modify: `app/src/styles/globals.css`
- Modify: `.gitignore`
- Modify: `scripts/check-homepage.py`

**Interfaces:**
- `NextSteps` consumes `{ lang: Language }`.
- It renders three compact CTA cards linking to `/contact` with no embedded homepage forms.

- [ ] **Step 1: Replace the four homepage forms**

Remove `FormEvent`, form state, `FORM_ENDPOINT`, and repeated form markup from `index.tsx`. Add three next-step cards for newcomer help, small-group connection, and prayer requests; link each to `/contact`.

- [ ] **Step 2: Finish navigation and theme polish**

Check the header at 1440px, 860px, 560px, and 375px. Add only the responsive rules needed to prevent wrapped controls, clipping, or horizontal scrolling. Ensure light and dark theme variables remain readable while the church theme receives the full organic-modern treatment.

- [ ] **Step 3: Ignore generated local artifacts**

Add:

```gitignore
# TypeScript incremental build cache
*.tsbuildinfo

# Superpowers visual brainstorming artifacts
.superpowers/
```

- [ ] **Step 4: Complete the smoke test**

Update `scripts/check-homepage.py` to assert the final export contains the hero, quick strip, weekly section, visit section, pastor section, and next-step section; assert the removed stock URL, fake stats, placeholders, and homepage `<form` elements are absent.

- [ ] **Step 5: Run automated verification**

Run:

```bash
cd app
npx tsc --noEmit
npm run build
cd ..
python3 scripts/check-homepage.py
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Perform visual verification**

Inspect `/` in Korean and English at 1440×900, 768×1024, and 375×812. Check the church, light, and dark themes; keyboard focus; reduced motion; all internal links; map; image crops; and horizontal overflow.

- [ ] **Step 7: Commit**

```bash
git add .gitignore app/src/components/home app/src/pages/index.tsx app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Polish responsive organic modern homepage"
```
