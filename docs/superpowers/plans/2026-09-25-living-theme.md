# Living Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable Living theme whose accessible light/dark palette changes continuously with local time and a stable daily random seed.

**Architecture:** Keep all color math and transition-frame math in a dependency-free `livingTheme.ts` module. A focused React hook owns timers, page visibility, reduced-motion observation, and body custom-property cleanup; `ThemeContext` only selects that hook and applies the theme class. CSS derives the legacy, organic-home, and site-shell palettes from four Living variables.

**Tech Stack:** Next.js 16 Pages Router, React 18, TypeScript 5.4, CSS custom properties/HSL, Node test runner through `tsx --test`, Azure Functions CommonJS tests.

## Global Constraints

- Living is a sixth theme; the existing five themes remain static.
- Use the visitor's local date and clock, not a church timezone.
- The daily seed is stable across reloads and changes with the local calendar date.
- Keep chaos intensity at the named constant `0.55`; do not add an admin control.
- Update active Living variables every 2 seconds.
- Cross light/dark in 1.2 seconds; background darkness may interpolate, but ink side must remain discrete.
- Body text contrast against the page background must remain at least `4.5:1`, including transition frames.
- Reduced motion removes daily hour shift and sine wander.
- Pause periodic work while the document is hidden and recompute on visibility return.
- Add no production dependency and preserve static export.

---

### Task 1: Pure Living palette and transition math

**Files:**
- Create: `app/src/lib/livingTheme.ts`
- Create: `app/src/lib/livingTheme.test.ts`

**Interfaces:**
- Produces:
  - `LIVING_CHAOS = 0.55`
  - `LIVING_UPDATE_MS = 2000`
  - `LIVING_TRANSITION_MS = 1200`
  - `type LivingTarget = { hue: number; sat: number; rawDark: number; side: 0 | 1 }`
  - `type LivingTone = { hue: number; sat: number; dark: number; flip: 0 | 1 }`
  - `computeLivingTarget(date: Date, reducedMotion: boolean): LivingTarget`
  - `resolveLivingTone(target: LivingTarget, progress?: number): LivingTone`
  - `contrastRatioForTone(tone: LivingTone): number`

- [ ] **Step 1: Write failing tests for deterministic daily color math**

Create `app/src/lib/livingTheme.test.ts` with tests that:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeLivingTarget,
  LIVING_CHAOS,
  resolveLivingTone,
  contrastRatioForTone,
} from './livingTheme';

test('uses the approved chaos intensity', () => {
  assert.equal(LIVING_CHAOS, 0.55);
});

test('returns bounded values throughout the day', () => {
  for (let minute = 0; minute < 24 * 60; minute += 5) {
    const date = new Date(2026, 8, 25, 0, minute);
    const tone = computeLivingTarget(date, false);
    assert.ok(tone.hue >= 0 && tone.hue < 360);
    assert.ok(tone.sat >= 14 && tone.sat <= 72);
    assert.ok(tone.rawDark >= 0 && tone.rawDark <= 1);
    assert.ok(tone.side === 0 || tone.side === 1);
  }
});

test('is stable for the same local date and time', () => {
  const date = new Date(2026, 8, 25, 15, 30, 10);
  assert.deepEqual(computeLivingTarget(date, false), computeLivingTarget(date, false));
});

test('changes the seeded path on another local date', () => {
  const first = computeLivingTarget(new Date(2026, 8, 25, 15, 30), false);
  const second = computeLivingTarget(new Date(2026, 8, 26, 15, 30), false);
  assert.notDeepEqual(first, second);
});

test('reduced motion removes seeded drift', () => {
  const first = computeLivingTarget(new Date(2026, 8, 25, 15, 30), true);
  const second = computeLivingTarget(new Date(2026, 8, 26, 15, 30), true);
  assert.deepEqual(first, second);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
cd app
npx tsx --test src/lib/livingTheme.test.ts
```

Expected: FAIL because `./livingTheme` does not exist.

- [ ] **Step 3: Implement the daily target calculation**

In `livingTheme.ts`, define the nine approved clock keypoints, shortest-arc hue interpolation, UTC-day seed from local Y/M/D, deterministic hash, and three-sine wander. Use invalid-date fallback `new Date()` with its clock forced to local 13:00.

Core signatures and constants:

```ts
export const LIVING_CHAOS = 0.55;
export const LIVING_UPDATE_MS = 2_000;
export const LIVING_TRANSITION_MS = 1_200;

export type LivingTarget = {
  hue: number;
  sat: number;
  rawDark: number;
  side: 0 | 1;
};

const CLOCK_POINTS = [
  { hour: 5.5, hue: 265, sat: 34, dark: 0.86 },
  { hour: 7, hue: 214, sat: 44, dark: 0.26 },
  { hour: 9, hue: 202, sat: 48, dark: 0.03 },
  { hour: 13, hue: 198, sat: 46, dark: 0 },
  { hour: 16.5, hue: 210, sat: 48, dark: 0.06 },
  { hour: 18.3, hue: 25, sat: 62, dark: 0.46 },
  { hour: 19.5, hue: 350, sat: 52, dark: 0.82 },
  { hour: 21.5, hue: 252, sat: 40, dark: 0.95 },
  { hour: 23.5, hue: 232, sat: 36, dark: 0.98 },
] as const;
```

Use seconds since local midnight for the sine phases. With reduced motion, use `chaos = 0`, which removes both the seeded hour shift and all wander while preserving the base clock curve.

- [ ] **Step 4: Add failing tests for continuity, rate, snap frames, and contrast**

Append tests that:

```ts
test('moves by less than one hue degree per two-second tick outside a side change', () => {
  for (let minute = 0; minute < 24 * 60; minute += 10) {
    const a = new Date(2026, 8, 25, 0, minute, 0);
    const b = new Date(a.getTime() + 2_000);
    const first = computeLivingTarget(a, false);
    const second = computeLivingTarget(b, false);
    if (first.side === second.side) {
      const distance = Math.abs(((second.hue - first.hue + 540) % 360) - 180);
      assert.ok(distance < 1);
    }
  }
});

test('keeps every sampled transition frame at WCAG AA contrast', () => {
  const day = { hue: 210, sat: 48, rawDark: 0.1, side: 0 as const };
  const night = { hue: 252, sat: 40, rawDark: 0.9, side: 1 as const };
  for (const target of [day, night]) {
    for (let step = 0; step <= 100; step += 1) {
      const tone = resolveLivingTone(target, step / 100);
      assert.ok(contrastRatioForTone(tone) >= 4.5);
      assert.ok(tone.flip === 0 || tone.flip === 1);
    }
  }
});

test('is continuous across local midnight', () => {
  const before = computeLivingTarget(new Date(2026, 8, 25, 23, 59, 59), true);
  const after = computeLivingTarget(new Date(2026, 8, 26, 0, 0, 1), true);
  const hueDistance = Math.abs(((after.hue - before.hue + 540) % 360) - 180);
  assert.ok(hueDistance < 1);
  assert.ok(Math.abs(after.rawDark - before.rawDark) < 0.01);
});
```

- [ ] **Step 5: Implement accessible transition-frame resolution**

Define `LivingTone`, smoothstep progress, day/night darkness poles, HSL-to-relative-luminance conversion, and contrast calculation. `resolveLivingTone(target, progress)` must:

1. Clamp progress to 0–1.
2. For a day target, interpolate from the night pole to the day pole; reverse for night.
3. At every frame calculate contrast for dark ink (`hsl(hue 22% 0%)`) and light ink (`hsl(hue 22% 100%)`).
4. Choose whichever discrete ink side has the higher contrast; never interpolate ink lightness.

```ts
export type LivingTone = {
  hue: number;
  sat: number;
  dark: number;
  flip: 0 | 1;
};

export const contrastRatioForTone = (tone: LivingTone): number => {
  // Background lightness: 96 - 90 * tone.dark.
  // Ink lightness: tone.flip === 0 ? 0 : 100.
  // Convert both HSL colors to sRGB relative luminance and return contrast.
};
```

Keep the exact black/white poles synchronized with CSS. Exhaustive sampling of the approved hue, saturation, and darkness ranges gives a minimum best-side contrast of approximately `4.58:1`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd app
npx tsx --test src/lib/livingTheme.test.ts
```

Expected: all Living math tests PASS.

- [ ] **Step 7: Commit the pure engine**

```bash
git add app/src/lib/livingTheme.ts app/src/lib/livingTheme.test.ts
git commit -m "Living 테마 색상 엔진을 추가한다."
```

---

### Task 2: Runtime controller and body-variable lifecycle

**Files:**
- Create: `app/src/lib/useLivingTheme.ts`
- Create: `app/src/lib/livingThemeDom.test.ts`
- Modify: `app/src/lib/ThemeContext.tsx:1-175`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces:
  - `useLivingTheme(active: boolean): void`
  - `applyLivingTone(style: Pick<CSSStyleDeclaration, 'setProperty'>, tone: LivingTone): void`
  - `clearLivingTone(style: Pick<CSSStyleDeclaration, 'removeProperty'>): void`

- [ ] **Step 1: Write failing DOM-adapter tests without adding jsdom**

Use a fake style object because the project has no DOM test dependency:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyLivingTone, clearLivingTone, LIVING_PROPERTIES } from './useLivingTheme';

const fakeStyle = () => {
  const values = new Map<string, string>();
  return {
    values,
    setProperty(name: string, value: string) { values.set(name, value); },
    removeProperty(name: string) { values.delete(name); return ''; },
  };
};

test('writes all four Living properties', () => {
  const style = fakeStyle();
  applyLivingTone(style, { hue: 210.25, sat: 48.5, dark: 0.12, flip: 0 });
  assert.deepEqual([...style.values.keys()], LIVING_PROPERTIES);
});

test('clears every Living property when the theme deactivates', () => {
  const style = fakeStyle();
  applyLivingTone(style, { hue: 210, sat: 48, dark: 0.12, flip: 0 });
  clearLivingTone(style);
  assert.equal(style.values.size, 0);
});
```

- [ ] **Step 2: Run the adapter test and verify it fails**

Run:

```bash
cd app
npx tsx --test src/lib/livingThemeDom.test.ts
```

Expected: FAIL because `./useLivingTheme` does not exist.

- [ ] **Step 3: Implement the hook and adapters**

`useLivingTheme.ts` must:

- Export the property names in this exact order:

```ts
export const LIVING_PROPERTIES = [
  '--living-hue',
  '--living-sat',
  '--living-dark',
  '--living-flip',
] as const;
```

- Observe `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- On activation, compute immediately, apply a resolved initial tone without transition, then start a 2-second interval.
- On a same-side tick, apply the new resolved pole immediately; changes are already sub-perceptual.
- On a side change, cancel any old animation and run a `requestAnimationFrame` loop for 1.2 seconds. Each frame calls `resolveLivingTone(target, elapsed / LIVING_TRANSITION_MS)`.
- On `visibilitychange`, clear interval and animation while hidden. On return, compute current local time, apply its pole immediately, and restart the interval.
- On deactivation/unmount, clear interval, cancel animation, remove the media-query listener and visibility listener, and call `clearLivingTone(document.body.style)`.
- Guard every browser global for SSR.

- [ ] **Step 4: Integrate the hook and register the front-end theme**

In `ThemeContext.tsx`:

```ts
import { useLivingTheme } from './useLivingTheme';

export const THEME_IDS = [
  'dark',
  'light',
  'church',
  'modern-sky',
  'modern-sand',
  'living',
] as const;
```

Add:

```ts
{
  id: 'living',
  labelEn: 'Living',
  labelKo: '리빙',
  descriptionEn: 'A living palette that drifts with time and changes each day.',
  descriptionKo: '시간과 날짜에 따라 천천히 흐르는 다이내믹 테마',
},
```

Call `useLivingTheme(settings.themeId === 'living')` unconditionally inside `ThemeProvider` so Hook ordering remains stable.

- [ ] **Step 5: Run focused and full front-end checks**

Run:

```bash
cd app
npx tsx --test src/lib/livingTheme.test.ts src/lib/livingThemeDom.test.ts
npm run typecheck
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit runtime integration**

```bash
git add app/src/lib/useLivingTheme.ts app/src/lib/livingThemeDom.test.ts app/src/lib/ThemeContext.tsx
git commit -m "Living 테마 런타임을 연결한다."
```

---

### Task 3: Living CSS across all palette layers

**Files:**
- Modify: `app/src/styles/globals.css:1-220`
- Modify: `app/src/styles/globals.css:1322-1344`
- Modify: `app/src/styles/globals.css:2475-2490`
- Modify: `app/src/styles/globals.css:3277-3369`
- Modify: `app/src/styles/globals.css:3425-3473`

**Interfaces:**
- Consumes: `--living-hue`, `--living-sat`, `--living-dark`, `--living-flip`.
- Produces: complete values for legacy variables, home `--organic-*` variables, and site-shell `--site-*` variables.

- [ ] **Step 1: Add the base Living palette**

After `body.theme-modern-sand`, add `body.theme-living`. Keep the ink pole constants synchronized with Task 1. Representative formulas:

```css
body.theme-living {
  --living-hue: 210;
  --living-sat: 48;
  --living-dark: 0.08;
  --living-flip: 0;
  --living-bg-l: calc(96% - 90% * var(--living-dark));
  --living-surface-l: calc(99% - 92% * var(--living-dark));
  --living-ink-l: calc(100% * var(--living-flip));

  --bg: hsl(var(--living-hue) calc(var(--living-sat) * 1%) var(--living-bg-l));
  --surface-solid: hsl(var(--living-hue) calc(var(--living-sat) * 0.85%) var(--living-surface-l));
  --primary: hsl(calc(var(--living-hue) + 6) 62% calc(46% + 18% * var(--living-dark)));
  --accent: hsl(calc(var(--living-hue) + 172) 74% calc(56% + 8% * var(--living-dark)));
  --text: hsl(var(--living-hue) 22% var(--living-ink-l));
  --heading: hsl(var(--living-hue) 30% calc(10% + 88% * var(--living-flip)));
  --muted: hsl(var(--living-hue) 16% var(--living-ink-l));
  --home-bg: linear-gradient(150deg,
    hsl(var(--living-hue) var(--living-sat) calc(var(--living-bg-l) - 3%)),
    hsl(calc(var(--living-hue) + 20) var(--living-sat) var(--living-bg-l)));
}
```

Fill every legacy variable used by the other theme blocks (`--surface`, header/footer/navigation, glows, cards, home overlays/panels/pills) from these tokens. Do not reference `church-bg.png`.

- [ ] **Step 2: Add the settings preview**

After `.theme-preview--modern-sand`:

```css
.theme-preview--living {
  background:
    radial-gradient(circle at 25% 20%, rgba(255, 177, 95, 0.7), transparent 32%),
    linear-gradient(135deg, #86d4ef, #5964c8 52%, #17172d);
}
```

- [ ] **Step 3: Map the organic homepage palette**

Add `body.theme-living .home-page` beside the existing dark/sky/sand overrides. Derive all eight `--organic-*` variables from Living tokens. Add Living equivalents for the dark-only component overrides (`.home-pillars`, cards, buttons, visit panel, service note) using Living surface/ink variables so the homepage switches cleanly at night.

- [ ] **Step 4: Map the sitewide organic shell**

Add `body.theme-living` after the other `--site-*` theme overrides:

```css
body.theme-living {
  --site-canvas: hsl(var(--living-hue) calc(var(--living-sat) * 1%) var(--living-bg-l));
  --site-surface: hsl(var(--living-hue) calc(var(--living-sat) * 0.85%) var(--living-surface-l));
  --site-ink: hsl(var(--living-hue) 22% var(--living-ink-l));
  --site-muted: hsl(var(--living-hue) 16% var(--living-ink-l));
  --site-accent: var(--primary);
  --site-gold: var(--accent);
  --site-danger: hsl(calc(var(--living-hue) + 145) 70% calc(40% + 35% * var(--living-flip)));
}
```

Also define `--site-surface-soft`, `--site-accent-soft`, `--site-line`, and `--site-shadow` so no root default leaks into Living.

- [ ] **Step 5: Verify static CSS and build**

Run:

```bash
cd app
npm run typecheck
npm run build
```

Expected: both commands exit 0; static export completes.

- [ ] **Step 6: Manually inspect representative pages**

Run `npm run dev`, select Living in `/manage/settings`, and inspect:

- `/` homepage during forced day and night values in DevTools.
- `/about`, `/worship`, and `/contact` for site-shell variables.
- Header, footer, controls, links, cards, muted copy, focus indicators, and error colors.
- Narrow viewport at 390px.
- Reduced-motion mode.

Expected: no Church photo background, no stale green root palette, no unreadable text, and no layout changes.

- [ ] **Step 7: Commit visual styling**

```bash
git add app/src/styles/globals.css
git commit -m "Living 테마 팔레트를 전체 화면에 적용한다."
```

---

### Task 4: API persistence and regression verification

**Files:**
- Modify: `api/site-settings/index.js:5`
- Modify: `api/site-settings/index.test.js:23-25`

**Interfaces:**
- Produces: API acceptance and persistence of `themeId: 'living'`.

- [ ] **Step 1: Change the API assertion first**

Update the supported-theme test:

```js
test('exports the supported theme list', () => {
  assert.deepStrictEqual(
    SUPPORTED_THEMES,
    ['dark', 'light', 'church', 'modern-sky', 'modern-sand', 'living']
  );
});
```

- [ ] **Step 2: Run the API test and verify it fails**

Run:

```bash
cd api
node --test site-settings/index.test.js
```

Expected: FAIL because `SUPPORTED_THEMES` lacks `living`.

- [ ] **Step 3: Add Living to the API allowlist**

Change:

```js
const SUPPORTED_THEMES = ['dark', 'light', 'church', 'modern-sky', 'modern-sand', 'living'];
```

Do not change the default theme or database schema; `ThemeId` is already `NVarChar(50)`.

- [ ] **Step 4: Run all project checks**

Run:

```bash
cd api
node --test site-settings/index.test.js
cd ../app
npm test
npm run typecheck
npm run build
```

Expected: all tests PASS, TypeScript exits 0, and static export completes.

- [ ] **Step 5: Confirm the final diff is scoped**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only Living theme engine, hook/tests, theme registration, CSS, and API allowlist/test changes; `git diff --check` prints nothing.

- [ ] **Step 6: Commit API support**

```bash
git add api/site-settings/index.js api/site-settings/index.test.js
git commit -m "Living 테마 설정 저장을 허용한다."
```

