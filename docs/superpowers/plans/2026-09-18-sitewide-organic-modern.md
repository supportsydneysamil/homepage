# Sitewide Organic Modern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the approved organic-modern homepage language to every page and shared shell while preserving functionality, themes, authentication, and static export.

**Architecture:** Add a small shared presentation layer for page heroes, empty states, media/date utilities, and scroll activity. Keep data fetching and authentication in their current pages, then migrate public and authenticated page groups onto the shared visual structure.

**Tech Stack:** Next.js 14 Pages Router, React 18, TypeScript 5, CSS, Node test runner through `tsx`, Python 3 smoke checks.

## Global Constraints

- Preserve all existing APIs, authentication guards, bilingual behavior, theme selection, and static export.
- Add no runtime dependency or animation library.
- Keep normal vertical scrolling and prevent unintended horizontal scrolling.
- Use a thin scrollbar visible only during active scrolling, with native fallback.
- Honor `prefers-reduced-motion`.
- Do not invent church facts or publish placeholder media as real content.

---

### Task 1: Shared presentation utilities and primitives

**Files:**
- Create: `app/src/lib/presentation.ts`
- Create: `app/src/lib/presentation.test.ts`
- Create: `app/src/components/PageHero.tsx`
- Create: `app/src/components/EmptyState.tsx`
- Modify: `app/package.json`
- Modify: `app/package-lock.json`

**Interfaces:**
- `formatDisplayDate(value: string, lang: 'ko' | 'en'): string`
- `toYouTubeEmbedUrl(value?: string): string | null`
- `isPlaceholderUrl(value?: string): boolean`
- `PageHero` consumes bilingual eyebrow/title/description and optional actions.
- `EmptyState` consumes title, description, and optional link.

- [ ] Install `tsx` as a development-only test runner with `npm install --save-dev tsx`.
- [ ] Add failing tests covering Korean and Australian date output, standard YouTube URLs, `youtu.be` URLs, invalid URLs, `VIDEO_ID` placeholders, and `example.com` placeholders.
- [ ] Run `npm exec -- tsx --test src/lib/presentation.test.ts`; confirm failures are caused by missing utility exports.
- [ ] Implement the smallest utility functions that satisfy the tests.
- [ ] Add semantic `PageHero` and `EmptyState` components using `.site-page-hero` and `.site-empty-state`.
- [ ] Run utility tests and `npm exec -- tsc --noEmit`; expect exit code 0.
- [ ] Commit:

```bash
git add app/package.json app/package-lock.json app/src/lib/presentation.ts app/src/lib/presentation.test.ts app/src/components/PageHero.tsx app/src/components/EmptyState.tsx
git commit -m "Add shared site presentation utilities"
```

### Task 2: Shared header, footer, metadata, and active-scroll indicator

**Files:**
- Create: `app/src/components/ScrollActivity.tsx`
- Modify: `app/src/components/Header.tsx`
- Modify: `app/src/components/Footer.tsx`
- Modify: `app/src/components/Layout.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- `ScrollActivity` mounts no visible DOM and toggles `document.documentElement.classList` entry `is-scrolling`.
- Header exposes an accessible mobile menu button with `aria-expanded` and closes after navigation.

- [ ] Add a failing source assertion to `scripts/check-homepage.py` requiring `Sydney Samil Church` metadata and `is-scrolling` behavior.
- [ ] Implement `ScrollActivity` using one passive scroll listener and an 800ms timeout; clear listener and timeout on unmount.
- [ ] Correct layout title/description branding from `Community Church` to `Sydney Samil Church`.
- [ ] Rebuild header markup with organic brand treatment, active-route state, accessible mobile menu, language control, and authentication control.
- [ ] Rebuild footer with identity, address/contact, navigation, and visit CTA.
- [ ] Add shared shell CSS, thin transparent idle scrollbar, visible `.is-scrolling` thumb, `scrollbar-gutter: stable`, mobile menu, focus states, and reduced-motion fallback.
- [ ] Run type check, build, and smoke checks.
- [ ] Commit:

```bash
git add app/src/components app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Redesign shared site shell and scrolling"
```

### Task 3: About, worship, and contact pages

**Files:**
- Modify: `app/src/pages/about.tsx`
- Modify: `app/src/pages/worship.tsx`
- Modify: `app/src/pages/contact.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] Add failing smoke assertions for `.about-page`, `.worship-page`, and `.contact-page` in their exported HTML.
- [ ] Recompose About with `PageHero`, numbered story/vision/mission sections, and verified church language.
- [ ] Recompose Worship with `PageHero`, prominent Sunday times, midweek details, and organic location/visit panel.
- [ ] Recompose Contact as a responsive two-column introduction/form layout while preserving `/api/contact`.
- [ ] Add `aria-live="polite"` and `role="alert"` status treatment to contact submission feedback.
- [ ] Add scoped public-page styles using shared theme variables, container-aware grids, and mobile-safe text wrapping.
- [ ] Run type check, build, smoke checks, and inspect all three pages at 1440px and 375px.
- [ ] Commit:

```bash
git add app/src/pages/about.tsx app/src/pages/worship.tsx app/src/pages/contact.tsx app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Redesign church information pages"
```

### Task 4: Events, sermons, resources, and media fallbacks

**Files:**
- Modify: `app/src/pages/events/index.tsx`
- Modify: `app/src/pages/events/[slug].tsx`
- Modify: `app/src/pages/sermons.tsx`
- Modify: `app/src/pages/resources.tsx`
- Modify: `app/src/styles/globals.css`
- Modify: `scripts/check-homepage.py`

- [ ] Add failing export assertions for each page class and rejection of `example.com` image rendering and `VIDEO_ID` iframe rendering.
- [ ] Apply `PageHero` and locale-aware `formatDisplayDate` to event and sermon lists.
- [ ] Render event images and YouTube embeds only when utility validation accepts their URLs; otherwise render a deliberate `EmptyState`.
- [ ] Make event detail metadata use the actual event title and description.
- [ ] Recompose sermons as editorial media cards with responsive aspect ratios and safe unavailable-media states.
- [ ] Recompose resources as numbered download rows; render a useful empty or unavailable state for placeholder URLs.
- [ ] Add scoped media/list styles and verify long titles, empty collections, and embeds do not overflow.
- [ ] Run utility tests, type check, build, smoke checks, and desktop/mobile screenshots.
- [ ] Commit:

```bash
git add app/src/pages/events app/src/pages/sermons.tsx app/src/pages/resources.tsx app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Redesign content and media pages"
```

### Task 5: Login, profile, and settings pages

**Files:**
- Modify: `app/src/pages/login.tsx`
- Modify: `app/src/pages/profile.tsx`
- Modify: `app/src/pages/settings.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] Add failing source/export assertions requiring `.login-page`, `.profile-page`, and `.settings-page` visual shells.
- [ ] Make Login bilingual and render explicit loading, development bypass, signed-in, and sign-in states without changing redirects.
- [ ] Recompose Profile into organic account-summary and identity cards while preserving Graph requests and photo upload.
- [ ] Recompose Settings with `PageHero`, accessible theme radio cards, permission states, and existing save behavior.
- [ ] Add scoped authenticated-page styles, status panels, mobile-safe long values, and consistent controls.
- [ ] Run type check and build; inspect available development-bypass states without weakening authentication.
- [ ] Commit:

```bash
git add app/src/pages/login.tsx app/src/pages/profile.tsx app/src/pages/settings.tsx app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Redesign account and settings pages"
```

### Task 6: Sitewide regression and visual verification

**Files:**
- Modify: `scripts/check-homepage.py`
- Modify: `app/src/styles/globals.css` only if verification exposes a reproducible defect.

- [ ] Expand the Python smoke check to enumerate all generated HTML routes, reject stale `Community Church` branding, and verify page-shell markers.
- [ ] Run:

```bash
cd app
npm exec -- tsx --test src/lib/presentation.test.ts
npm exec -- tsc --noEmit
npm run build
cd ..
python3 scripts/check-homepage.py
git diff --check
```

- [ ] Serve `app/out` and capture English and Korean screenshots at 1440×900, 768×1024, and 375×812.
- [ ] Check church, light, dark, modern-sky, and modern-sand palettes for readable fallback colors.
- [ ] Verify mobile menu keyboard behavior, active links, language switching, scrollbar activation/idle state, reduced motion, forms, iframe fallback, and absence of horizontal overflow.
- [ ] Fix only defects reproduced during verification, then repeat the complete verification command.
- [ ] Commit:

```bash
git add app/src/styles/globals.css scripts/check-homepage.py
git commit -m "Verify and polish sitewide responsive design"
```
