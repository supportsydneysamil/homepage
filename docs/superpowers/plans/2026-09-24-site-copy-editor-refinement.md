# Site Copy Editor Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose every localized `SiteCopy` value in a compact, accessible page-and-section accordion editor.

**Architecture:** Keep `SiteCopyFields` as the editor boundary, move the large Home editor into a focused child component, and introduce shared page/section presentation primitives. Every `BilingualField` receives a stable content path so a server-rendered coverage test can prove that the UI exposes every localized leaf in `DEFAULT_SITE_COPY`.

**Tech Stack:** Next.js 16 Pages Router, React, TypeScript, CSS, Node test runner, `tsx`

## Global Constraints

- Do not change the API, SQL schema, `SiteCopy` data model, parser, or global save behavior.
- Every localized leaf in `SiteCopy` must have an editor control.
- Link destinations remain read-only and may only be shown as contextual metadata.
- Page order is Home, About, Worship, Contact, Footer.
- Internal sections follow the order in which they appear on the public page.
- Narrow layouts must not overflow horizontally.
- Inputs must expose both their field label and language to assistive technology.

---

### Task 1: Accessible bilingual controls and coverage helpers

**Files:**
- Modify: `app/src/components/settings/BilingualField.tsx`
- Create: `app/src/lib/siteCopyEditor.test.ts`

**Interfaces:**
- Consumes: `LocalizedText` from `app/src/lib/churchInfo.ts`
- Produces: `BilingualField` props `fieldPath?: string`, `label`, `value`, `onChange`, `hint?`, `multiline?`, and `full?`
- Produces in test: `localizedPaths(value, prefix)` and `renderedPaths(copy)` coverage helpers

- [ ] **Step 1: Write the failing accessibility and path test**

Create `app/src/lib/siteCopyEditor.test.ts` with a static-render test:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BilingualField from '../components/settings/BilingualField';

test('bilingual fields identify their content path and language', () => {
  const html = renderToStaticMarkup(
    createElement(BilingualField, {
      fieldPath: 'home.hero.title',
      label: '큰 제목',
      value: { ko: '환영합니다', en: 'Welcome' },
      onChange: () => undefined,
    })
  );

  assert.match(html, /data-field-path="home\.hero\.title"/);
  assert.match(html, /aria-label="큰 제목 \(한국어\)"/);
  assert.match(html, /aria-label="큰 제목 \(English\)"/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/siteCopyEditor.test.ts
```

Expected: FAIL because `fieldPath` is not a recognized prop and the rendered inputs do not have the expected attributes.

- [ ] **Step 3: Add stable paths and accessible names**

Update `BilingualFieldProps` and `LanguageInput`:

```tsx
type BilingualFieldProps = {
  fieldPath?: string;
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  hint?: string;
  multiline?: boolean;
  full?: boolean;
};

const LanguageInput = ({
  accessibleLabel,
  chip,
  value,
  onChange,
  multiline,
}: {
  accessibleLabel: string;
  chip: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
}) => (
  <label className={multiline ? 'settings-lang settings-lang--multiline' : 'settings-lang'}>
    <span className="settings-lang__chip" aria-hidden="true">{chip}</span>
    {multiline ? (
      <textarea
        aria-label={accessibleLabel}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    ) : (
      <input
        aria-label={accessibleLabel}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )}
  </label>
);
```

Set `data-field-path={fieldPath}` on the `.settings-bilingual` wrapper and pass `${label} (한국어)` and `${label} (English)` to the two controls.

- [ ] **Step 4: Run the test and typecheck**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/siteCopyEditor.test.ts
npm run typecheck
```

Expected: the new test passes and typecheck succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/settings/BilingualField.tsx app/src/lib/siteCopyEditor.test.ts
git commit -m "test: cover accessible site copy fields"
```

---

### Task 2: Page and section disclosure primitives

**Files:**
- Create: `app/src/components/settings/SiteCopyEditorParts.tsx`
- Modify: `app/src/components/settings/SiteCopyFields.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Produces: `PageAccordion({ title, meta, count, open?, children })`
- Produces: `CopySection({ title, description?, count, open?, children })`
- Produces: `FieldGroup({ title, children })`
- Consumes: native `details` and `summary` behavior without custom toggle state

- [ ] **Step 1: Extract reusable disclosure components**

Create `SiteCopyEditorParts.tsx`:

```tsx
import type { ReactNode } from 'react';

export const PageAccordion = ({
  title,
  meta,
  count,
  open,
  children,
}: {
  title: string;
  meta: string;
  count: number;
  open?: boolean;
  children: ReactNode;
}) => (
  <details className="settings-accordion" open={open}>
    <summary>
      <span className="settings-accordion__title">{title}</span>
      <span className="settings-accordion__meta">{meta}</span>
      <span className="settings-count">{count}</span>
    </summary>
    <div className="settings-accordion__body">{children}</div>
  </details>
);

export const CopySection = ({
  title,
  description,
  count,
  open,
  children,
}: {
  title: string;
  description?: string;
  count: number;
  open?: boolean;
  children: ReactNode;
}) => (
  <details className="settings-copy-section" open={open}>
    <summary>
      <span>
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="settings-count">{count}</span>
    </summary>
    <div className="settings-copy-section__body">{children}</div>
  </details>
);

export const FieldGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="settings-field-group">
    <h4>{title}</h4>
    <div className="settings-field-group__grid">{children}</div>
  </section>
);
```

- [ ] **Step 2: Replace local page primitives**

Remove the local `Accordion` and `Group` definitions from `SiteCopyFields.tsx`. Import `PageAccordion`, `CopySection`, and `FieldGroup`. Convert the Home page shell first while preserving existing field update behavior.

- [ ] **Step 3: Add nested section styling**

In `globals.css`, add:

```css
.settings-count {
  display: inline-flex;
  min-width: 1.7rem;
  height: 1.7rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--site-accent-soft);
  color: var(--site-accent);
  font-size: 0.72rem;
  font-weight: 800;
}

.settings-copy-section {
  border: 1px solid var(--site-line);
  border-radius: 1rem;
  background: var(--site-surface-soft);
  overflow: hidden;
}

.settings-copy-section > summary {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  cursor: pointer;
  list-style: none;
}

.settings-copy-section > summary > span:first-child {
  display: grid;
  flex: 1;
  gap: 0.2rem;
}

.settings-copy-section summary small {
  color: var(--site-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.settings-copy-section__body {
  display: grid;
  gap: 1.2rem;
  padding: 1rem;
  border-top: 1px solid var(--site-line);
  background: var(--site-surface);
}

.settings-field-group {
  display: grid;
  gap: 0.65rem;
}

.settings-field-group h4 {
  margin: 0;
  color: var(--site-muted);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-field-group__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
  gap: 0.9rem 1.1rem;
}
```

Add `:focus-visible` outlines to both page and section summaries.

- [ ] **Step 4: Verify unchanged behavior**

Run:

```bash
cd app
npm run typecheck
./node_modules/.bin/tsx --test src/lib/*.test.ts
```

Expected: typecheck succeeds and all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/settings/SiteCopyEditorParts.tsx app/src/components/settings/SiteCopyFields.tsx app/src/styles/globals.css
git commit -m "refactor: structure site copy editor sections"
```

---

### Task 3: Complete Home page copy editor

**Files:**
- Create: `app/src/components/settings/HomeCopyFields.tsx`
- Modify: `app/src/components/settings/SiteCopyFields.tsx`
- Modify: `app/src/lib/siteCopyEditor.test.ts`

**Interfaces:**
- Produces: `HomeCopyFields({ value, onChange, isKo })`
- Every `BilingualField` supplies a normalized path such as `home.pillars.items[].title`
- Array indices are normalized to `[]` in coverage assertions

- [ ] **Step 1: Add a failing Home coverage test**

Extend `siteCopyEditor.test.ts` with helpers that recursively find localized leaves:

```ts
const localizedPaths = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [];
  const row = value as Record<string, unknown>;
  if (typeof row.ko === 'string' && typeof row.en === 'string') return [prefix];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => localizedPaths(item, `${prefix}[]`)))];
  }
  return Object.entries(row).flatMap(([key, child]) =>
    localizedPaths(child, prefix ? `${prefix}.${key}` : key)
  );
};

const pathsFromHtml = (html: string) =>
  [...html.matchAll(/data-field-path="([^"]+)"/g)].map((match) => match[1]);
```

Render `SiteCopyFields` with `DEFAULT_SITE_COPY`, filter both path sets to `home.`, and assert deep equality after sorting.

- [ ] **Step 2: Run the Home coverage test and verify RED**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/siteCopyEditor.test.ts
```

Expected: FAIL listing missing Home paths such as `home.hero.kicker`, `home.quick.worship`, and `home.weekly.empty`.

- [ ] **Step 3: Build all Home sections**

Create `HomeCopyFields.tsx` and render seven `CopySection` components in this order:

1. Hero
2. Quick information
3. Church pillars
4. Weekly highlights
5. First visit
6. Next steps
7. Pastor feature

Use `FieldGroup` headings equivalent to Primary copy, Supporting copy, and Accessibility copy in the current UI language. Add all Home paths from `SiteCopy`:

```text
home.hero.kicker
home.hero.title
home.hero.lead
home.hero.ctaVisit
home.hero.ctaDirections
home.hero.photoAlt
home.hero.thisSunday
home.quick.worship
home.quick.firstVisit
home.quick.firstVisitHint
home.quick.findUs
home.pillars.kicker
home.pillars.title
home.pillars.intro
home.pillars.items[].title
home.pillars.items[].body
home.weekly.kicker
home.weekly.title
home.weekly.intro
home.weekly.empty
home.weekly.viewDetails
home.visit.kicker
home.visit.title
home.visit.intro
home.visit.serviceTimes
home.visit.whatToExpectLabel
home.visit.whatToExpect
home.visit.childrenLabel
home.visit.children
home.visit.addressLabel
home.visit.mapsCta
home.nextSteps.kicker
home.nextSteps.title
home.nextSteps.intro
home.nextSteps.items[].title
home.nextSteps.items[].description
home.nextSteps.items[].label
home.pastor.kicker
home.pastor.quote
home.pastor.body
home.pastor.contactCta
home.pastor.photoAlt
```

Use immutable section-specific update helpers. Keep `href` out of inputs and display it in each Next steps item header.

- [ ] **Step 4: Replace the inline Home editor**

In `SiteCopyFields.tsx`, render:

```tsx
<PageAccordion
  title={isKo ? '홈' : 'Home'}
  meta={isKo ? '첫 화면부터 담임목사 소개까지' : 'From hero to pastor feature'}
  count={42}
  open
>
  <HomeCopyFields
    value={value.home}
    onChange={(home) => onChange({ ...value, home })}
    isKo={isKo}
  />
</PageAccordion>
```

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/siteCopyEditor.test.ts
npm run typecheck
```

Expected: Home coverage passes and typecheck succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/settings/HomeCopyFields.tsx app/src/components/settings/SiteCopyFields.tsx app/src/lib/siteCopyEditor.test.ts
git commit -m "feat: expose all homepage copy fields"
```

---

### Task 4: Complete About, Worship, Contact, and Footer editors

**Files:**
- Modify: `app/src/components/settings/SiteCopyFields.tsx`
- Modify: `app/src/lib/siteCopyEditor.test.ts`

**Interfaces:**
- Consumes: shared page/section/group primitives
- Produces: one control for every non-Home localized path

- [ ] **Step 1: Add a failing whole-editor coverage assertion**

Extend the coverage test:

```ts
test('site copy editor exposes every localized setting', () => {
  const html = renderToStaticMarkup(
    createElement(SiteCopyFields, {
      value: DEFAULT_SITE_COPY,
      onChange: () => undefined,
      isKo: true,
    })
  );

  assert.deepStrictEqual(
    [...new Set(pathsFromHtml(html))].sort(),
    [...new Set(localizedPaths(DEFAULT_SITE_COPY))].sort()
  );
});
```

- [ ] **Step 2: Run the whole-editor test and verify RED**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/siteCopyEditor.test.ts
```

Expected: FAIL with non-Home paths that are not yet rendered.

- [ ] **Step 3: Complete the remaining page sections**

Expose these paths:

```text
about.eyebrow
about.title
about.description
about.values[].title
about.values[].body
about.quoteKicker
about.quote
worship.eyebrow
worship.title
worship.description
worship.directions
worship.askVisit
worship.timesKicker
worship.timesTitle
worship.timesIntro
worship.locationTitle
contact.eyebrow
contact.title
contact.description
contact.detailsKicker
contact.note
footer.tagline
footer.findUs
footer.contact
footer.explore
footer.about
footer.worship
footer.sermons
footer.meetUs
```

Make Contact and Footer separate `PageAccordion` elements. Group each page into `CopySection` elements matching public-page order. Show About value cards with their index and keep all fields bilingual.

- [ ] **Step 4: Run coverage, all app tests, and typecheck**

Run:

```bash
cd app
./node_modules/.bin/tsx --test src/lib/*.test.ts
npm run typecheck
```

Expected: all tests pass, including complete path equality, and typecheck succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/settings/SiteCopyFields.tsx app/src/lib/siteCopyEditor.test.ts
git commit -m "feat: expose complete page copy settings"
```

---

### Task 5: Responsive polish and final verification

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/settings/SiteCopyEditorParts.tsx`

**Interfaces:**
- No new public interfaces
- Preserves all editor paths and save behavior from Tasks 1–4

- [ ] **Step 1: Make every narrow layout width-safe**

Replace fixed minimum grid widths in the copy editor with width-safe expressions and add:

```css
@media (max-width: 719px) {
  .settings-accordion__body,
  .settings-copy-section__body {
    padding: 0.9rem;
  }

  .settings-field-group__grid,
  .settings-bilingual__pair {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-accordion > summary,
  .settings-copy-section > summary {
    align-items: flex-start;
  }
}
```

Ensure flex and grid children use `min-width: 0` where long English content or route metadata could otherwise force overflow.

- [ ] **Step 2: Verify focus and hierarchy states**

Confirm CSS includes visible `:focus-visible` outlines for both summary levels, hover feedback that does not obscure focus, distinct page and section surfaces, and lower emphasis for supporting/accessibility group headings.

- [ ] **Step 3: Run full verification**

Run:

```bash
cd app
npm run typecheck
./node_modules/.bin/tsx --test src/lib/*.test.ts
npm run build
cd ../api
npm test
```

Expected:

- Typecheck succeeds.
- App tests pass, including full editor coverage.
- Static export succeeds.
- All 159 existing API tests pass.

- [ ] **Step 4: Inspect the scoped diff**

Run:

```bash
git diff --check
git status --short
git diff -- app/src/components/settings app/src/lib/siteCopyEditor.test.ts app/src/styles/globals.css
```

Expected: no whitespace errors; no API, schema, parser, or unrelated files are changed by this implementation.

- [ ] **Step 5: Commit**

```bash
git add app/src/styles/globals.css app/src/components/settings/SiteCopyEditorParts.tsx
git commit -m "style: polish responsive copy editor"
```
