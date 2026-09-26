# Newcomer Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show one admin-controlled newcomer band on the homepage, directly above “Your next step”, that opens the church Microsoft Form in a new tab.

**Architecture:** The band is site copy. `SiteCopy['home'].welcome` holds an on/off flag, the form link, and four bilingual strings. `parseSiteCopy` drops any link that is not an https Microsoft Forms address, and `welcomeFormUrl` decides whether the band renders. Admins edit it in the existing home copy editor. The settings validator and `PUT /api/site-settings` both reject a bad link. Online applications do not change.

**Tech Stack:** Next.js Pages Router (static export), React 18, TypeScript 5, `node:test` via `tsx --test src/lib/*.test.ts` in `app/`, `node --test` in `api/`, Azure Functions (CommonJS), existing `globals.css`.

Spec: `docs/superpowers/specs/2026-09-27-newcomer-registration-design.md` (Korean: `.ko.md`).

## Global Constraints

- The website never stores registration answers. It stores only the link and the band copy.
- A valid link is https on `forms.office.com`, `www.forms.office.com`, `forms.microsoft.com`, or `www.forms.microsoft.com`, and at most 500 characters after trimming.
- `welcome.enabled` counts as on only when it is exactly `true`.
- Defaults: `enabled: false`, `formUrl: ''`, kicker 새가족 / New here, title 처음 오셨나요? 반갑습니다 / First time here? Welcome, intro 이름과 연락처만 남겨 주시면 담당자가 편하게 연락드립니다. 나머지는 알려 주셔도 좋고, 넘어가셔도 괜찮습니다. / Leave your name and a way to reach you, and we will get in touch. Everything else is optional., button 새가족 등록하기 / Register.
- The band renders only when it is on and the link is valid. It sits directly above “Your next step” and opens the link with `target="_blank" rel="noopener noreferrer"`.
- Settings error message: “Microsoft Forms 주소를 입력해 주세요.” / “Enter a Microsoft Forms link.”
- Server error message: `Newcomer form link must be an https Microsoft Forms link.`
- Do not change online applications, the resources applications list, the home “open now” section, or the three next-step cards.
- No database schema change and no new runtime dependency.

## File Map

- `app/src/lib/siteCopy.ts` — `home.welcome` type, defaults, parser, `isWelcomeFormUrl`, `welcomeFormUrl`.
- `app/src/lib/siteCopy.test.ts` — parser and render-decision tests.
- `app/src/lib/settingsValidation.ts` — `formUrl` validation code and message.
- `app/src/lib/settingsValidation.test.ts` — link validation tests.
- `api/site-settings/index.js` — reject a bad newcomer link on save.
- `api/site-settings/index.test.js` — API tests.
- `app/src/components/settings/HomeCopyFields.tsx` — “Newcomer registration” editor section.
- `app/src/components/home/WelcomeBand.tsx` — new homepage band.
- `app/src/pages/index.tsx` — render the band above `NextSteps`.
- `app/src/styles/globals.css` — `.settings-toggle` and `.home-welcome` styles.

---

### Task 0: Commit the in-progress open-applications copy

The working tree already contains uncommitted work that moves the home “open now” copy into site settings (`home.applications`). Later tasks edit the same files, so commit this work first. Keeping it separate means the newcomer commits contain only newcomer changes.

**Files:**
- Commit as-is: `app/src/components/home/OpenApplications.tsx`, `app/src/components/settings/HomeCopyFields.tsx`, `app/src/lib/siteCopy.ts`, `app/src/lib/siteCopy.test.ts`

- [ ] **Step 1: Confirm only those four files are modified**

Run: `git status --short`
Expected: exactly the four files above marked ` M`. If anything else is modified, stop and ask the owner.

- [ ] **Step 2: Verify the work passes**

Run: `cd app && npm run test:lib && npm run typecheck`
Expected: all tests pass; `tsc --noEmit` prints no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/home/OpenApplications.tsx app/src/components/settings/HomeCopyFields.tsx app/src/lib/siteCopy.ts app/src/lib/siteCopy.test.ts
git commit -m "홈 열린 신청 문구를 사이트 설정에서 고칠 수 있게 한다."
```

---

### Task 1: `home.welcome` site copy and render decision

**Files:**
- Modify: `app/src/lib/siteCopy.ts`
- Test: `app/src/lib/siteCopy.test.ts`

**Interfaces:**
- Produces:
  - `SiteCopy['home']['welcome']`: `{ enabled: boolean; formUrl: string; kicker: LocalizedText; title: LocalizedText; intro: LocalizedText; buttonLabel: LocalizedText }`
  - `export type WelcomeCopy = SiteCopy['home']['welcome']`
  - `export const isWelcomeFormUrl = (value: string) => boolean`. Pass a trimmed string; returns true for a valid Forms link of at most 500 characters.
  - `export const welcomeFormUrl = (welcome: WelcomeCopy) => string | null`. Returns the trimmed link when the band should render, otherwise `null`.

- [ ] **Step 1: Write the failing tests**

In `app/src/lib/siteCopy.test.ts`, change the import line to:

```ts
import { DEFAULT_SITE_COPY, parseSiteCopy, welcomeFormUrl } from './siteCopy';
```

Append:

```ts
const NEWCOMER_FORM = 'https://forms.office.com/r/samil-newcomer';

test('newcomer band defaults to off with no link', () => {
  const copy = parseSiteCopy(undefined);
  assert.strictEqual(copy.home.welcome.enabled, false);
  assert.strictEqual(copy.home.welcome.formUrl, '');
  assert.strictEqual(copy.home.welcome.kicker.ko, '새가족');
  assert.strictEqual(copy.home.welcome.buttonLabel.ko, '새가족 등록하기');
  assert.strictEqual(copy.home.welcome.buttonLabel.en, 'Register');
  assert.strictEqual(welcomeFormUrl(copy.home.welcome), null);
});

test('newcomer band keeps a Microsoft Forms link and drops anything else', () => {
  const kept = parseSiteCopy({ home: { welcome: { enabled: true, formUrl: `  ${NEWCOMER_FORM}  ` } } });
  assert.strictEqual(kept.home.welcome.formUrl, NEWCOMER_FORM);

  const tooLong = `https://forms.office.com/r/${'a'.repeat(480)}`;
  for (const formUrl of ['http://forms.office.com/r/x', 'https://example.com/form', 'not a url', 42, tooLong]) {
    const dropped = parseSiteCopy({ home: { welcome: { enabled: true, formUrl } } });
    assert.strictEqual(dropped.home.welcome.formUrl, '', String(formUrl));
  }
});

test('newcomer band is on only for boolean true', () => {
  const asText = parseSiteCopy({ home: { welcome: { enabled: 'true', formUrl: NEWCOMER_FORM } } });
  const asBoolean = parseSiteCopy({ home: { welcome: { enabled: true, formUrl: NEWCOMER_FORM } } });
  assert.strictEqual(asText.home.welcome.enabled, false);
  assert.strictEqual(asBoolean.home.welcome.enabled, true);
});

test('newcomer band renders only when on with a valid link', () => {
  const base = DEFAULT_SITE_COPY.home.welcome;
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: NEWCOMER_FORM }), NEWCOMER_FORM);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: false, formUrl: NEWCOMER_FORM }), null);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: '' }), null);
  assert.strictEqual(welcomeFormUrl({ ...base, enabled: true, formUrl: 'https://example.com/form' }), null);
});

test('edited newcomer copy keeps the untouched defaults', () => {
  const copy = parseSiteCopy({ home: { welcome: { title: { ko: '환영합니다', en: 'Welcome' } } } });
  assert.strictEqual(copy.home.welcome.title.ko, '환영합니다');
  assert.strictEqual(copy.home.welcome.intro.en, DEFAULT_SITE_COPY.home.welcome.intro.en);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd app && npx tsx --test src/lib/siteCopy.test.ts`
Expected: FAIL. `welcomeFormUrl` is not exported and `copy.home.welcome` is undefined.

- [ ] **Step 3: Implement**

In `app/src/lib/siteCopy.ts`:

Add after the existing first import line:

```ts
import { isMicrosoftFormUrl } from './applications';
```

In `SiteCopy['home']`, add right after the `visit: { ... };` block and before `nextSteps`:

```ts
    welcome: {
      enabled: boolean;
      formUrl: string;
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      buttonLabel: LocalizedText;
    };
```

After the closing `};` of `export type SiteCopy`, add:

```ts
export type WelcomeCopy = SiteCopy['home']['welcome'];
```

In `DEFAULT_SITE_COPY.home`, add right after the `visit: { ... },` block and before `nextSteps`:

```ts
    welcome: {
      enabled: false,
      formUrl: '',
      kicker: { ko: '새가족', en: 'New here' },
      title: { ko: '처음 오셨나요? 반갑습니다', en: 'First time here? Welcome' },
      intro: {
        ko: '이름과 연락처만 남겨 주시면 담당자가 편하게 연락드립니다. 나머지는 알려 주셔도 좋고, 넘어가셔도 괜찮습니다.',
        en: 'Leave your name and a way to reach you, and we will get in touch. Everything else is optional.',
      },
      buttonLabel: { ko: '새가족 등록하기', en: 'Register' },
    },
```

Right after `parseHero` (before `export const parseSiteCopy`), add:

```ts
export const isWelcomeFormUrl = (value: string) => value.length <= 500 && isMicrosoftFormUrl(value);

const parseWelcome = (input: unknown, fallback: WelcomeCopy): WelcomeCopy => {
  const row = asRecord(input);
  const formUrl = typeof row?.formUrl === 'string' ? row.formUrl.trim() : '';
  return {
    enabled: row?.enabled === true,
    formUrl: isWelcomeFormUrl(formUrl) ? formUrl : '',
    kicker: textAt(row, 'kicker', fallback.kicker),
    title: textAt(row, 'title', fallback.title),
    intro: textAt(row, 'intro', fallback.intro),
    buttonLabel: textAt(row, 'buttonLabel', fallback.buttonLabel),
  };
};

export const welcomeFormUrl = (welcome: WelcomeCopy) => {
  const formUrl = welcome.formUrl.trim();
  return welcome.enabled && isWelcomeFormUrl(formUrl) ? formUrl : null;
};
```

In `parseSiteCopy`'s returned `home` object, add right after the `visit: { ... },` entry and before `nextSteps`:

```ts
      welcome: parseWelcome(home?.welcome, DEFAULT_SITE_COPY.home.welcome),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd app && npx tsx --test src/lib/siteCopy.test.ts`
Expected: PASS, including the three existing tests.

- [ ] **Step 5: Typecheck**

Run: `cd app && npm run typecheck`
Expected: no errors. `HomeCopyFields` and the settings validator compile unchanged because they do not yet read `welcome`.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/siteCopy.ts app/src/lib/siteCopy.test.ts
git commit -m "새가족 안내 문구와 폼 링크를 사이트 문구에 추가한다."
```

---

### Task 2: Settings validation for the newcomer link

**Files:**
- Modify: `app/src/lib/settingsValidation.ts`
- Test: `app/src/lib/settingsValidation.test.ts`

**Interfaces:**
- Consumes: `isWelcomeFormUrl(value: string): boolean` and `SiteCopy['home']['welcome']` from Task 1.
- Produces: `SettingsValidationCode` gains `'formUrl'`. `validateSiteCopyDraft` emits `{ tab: 'copy', path: 'home.welcome.formUrl', code: 'formUrl' }`. The editor field in Task 4 uses `fieldPath="home.welcome.formUrl"`.

- [ ] **Step 1: Write the failing tests**

In `app/src/lib/settingsValidation.test.ts`, change the import from `./settingsValidation` to:

```ts
import {
  settingsValidationMessage,
  validateChurchInfoDraft,
  validateSiteCopyDraft,
} from './settingsValidation';
```

Append:

```ts
const withWelcome = (welcome: Partial<typeof DEFAULT_SITE_COPY.home.welcome>) => ({
  ...DEFAULT_SITE_COPY,
  home: { ...DEFAULT_SITE_COPY.home, welcome: { ...DEFAULT_SITE_COPY.home.welcome, ...welcome } },
});

const welcomeIssues = (welcome: Partial<typeof DEFAULT_SITE_COPY.home.welcome>) =>
  validateSiteCopyDraft(withWelcome(welcome)).filter((issue) => issue.path === 'home.welcome.formUrl');

const LINK_ISSUE = { tab: 'copy', path: 'home.welcome.formUrl', code: 'formUrl' };

test('newcomer link is required only while the band is on', () => {
  assert.deepStrictEqual(welcomeIssues({ enabled: true, formUrl: '' }), [LINK_ISSUE]);
  assert.deepStrictEqual(welcomeIssues({ enabled: true, formUrl: '   ' }), [LINK_ISSUE]);
  assert.deepStrictEqual(welcomeIssues({ enabled: false, formUrl: '' }), []);
  assert.deepStrictEqual(
    welcomeIssues({ enabled: true, formUrl: 'https://forms.office.com/r/samil-newcomer' }),
    []
  );
});

test('a non-Forms newcomer link is rejected even while the band is off', () => {
  assert.deepStrictEqual(welcomeIssues({ enabled: false, formUrl: 'https://example.com/form' }), [LINK_ISSUE]);
});

test('newcomer link message names Microsoft Forms', () => {
  const issue = { tab: 'copy' as const, path: 'home.welcome.formUrl', code: 'formUrl' as const };
  assert.strictEqual(settingsValidationMessage(issue, true), 'Microsoft Forms 주소를 입력해 주세요.');
  assert.strictEqual(settingsValidationMessage(issue, false), 'Enter a Microsoft Forms link.');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd app && npx tsx --test src/lib/settingsValidation.test.ts`
Expected: FAIL. No `formUrl` issue is emitted, and `settingsValidationMessage` has no `formUrl` entry.

- [ ] **Step 3: Implement**

In `app/src/lib/settingsValidation.ts`:

Replace the second import line with:

```ts
import { isWelcomeFormUrl, type SiteCopy } from './siteCopy';
```

Add `'formUrl'` to the union so it reads:

```ts
export type SettingsValidationCode =
  | 'required'
  | 'email'
  | 'phone'
  | 'time'
  | 'period'
  | 'tooLong'
  | 'serviceRequired'
  | 'formUrl';
```

Replace `validateSiteCopyDraft` with:

```ts
export const validateSiteCopyDraft = (
  value: SiteCopy
): SettingsValidationIssue[] => {
  const issues: SettingsValidationIssue[] = [];
  collectLocalizedIssues(value, '', issues);
  const welcome = value.home.welcome;
  const formUrl = welcome.formUrl.trim();
  if ((welcome.enabled || formUrl) && !isWelcomeFormUrl(formUrl)) {
    issues.push({ tab: 'copy', path: 'home.welcome.formUrl', code: 'formUrl' });
  }
  return Array.from(
    new Map(issues.map((issue) => [`${issue.path}:${issue.code}`, issue])).values()
  );
};
```

In `settingsValidationMessage`, add to the `messages` object after `serviceRequired`:

```ts
    formUrl: { ko: 'Microsoft Forms 주소를 입력해 주세요.', en: 'Enter a Microsoft Forms link.' },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd app && npx tsx --test src/lib/settingsValidation.test.ts`
Expected: PASS. The existing test “valid default settings have no validation issues” still passes because the default band is off with an empty link.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/settingsValidation.ts app/src/lib/settingsValidation.test.ts
git commit -m "새가족 안내를 켤 때 Microsoft Forms 주소를 검사한다."
```

---

### Task 3: Server rejects a bad newcomer link

**Files:**
- Modify: `api/site-settings/index.js`
- Test: `api/site-settings/index.test.js`

**Interfaces:**
- Consumes: `isMicrosoftFormUrl(value)` from `api/shared/applications.js` (already exported).
- Produces: `PUT /api/site-settings` returns 400 with `{ error: 'Newcomer form link must be an https Microsoft Forms link.' }` when `siteCopy.home.welcome.formUrl` is non-blank and either not a Forms link or longer than 500 characters after trimming.

- [ ] **Step 1: Write the failing tests**

Append to `api/site-settings/index.test.js`:

```js
const putWithWelcome = (formUrl) =>
  adminReq('PUT', {
    themeId: 'church',
    heroImagePath: null,
    pastorImagePath: null,
    logoImagePath: null,
    siteCopy: { home: { welcome: { enabled: true, formUrl } } },
  });

const welcomeDeps = (saved) => ({
  getCurrentSettings: async () => ({ themeId: 'church' }),
  saveSettings: async (next) => {
    saved.push(next);
    return { ...next, siteCopy: JSON.parse(next.siteCopyJson) };
  },
  deleteBlob: async () => {},
  publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
});

test('rejects a newcomer link that is not Microsoft Forms', async () => {
  for (const formUrl of ['https://example.com/form', `https://forms.office.com/r/${'a'.repeat(480)}`]) {
    const context = contextOf();
    const saved = [];
    await handler(context, putWithWelcome(formUrl), welcomeDeps(saved));
    assert.strictEqual(context.res.status, 400);
    assert.strictEqual(context.res.body.error, 'Newcomer form link must be an https Microsoft Forms link.');
    assert.strictEqual(saved.length, 0);
  }
});

test('accepts a Microsoft Forms newcomer link or a blank one', async () => {
  for (const formUrl of ['https://forms.office.com/r/samil-newcomer', '', '   ']) {
    const context = contextOf();
    const saved = [];
    await handler(context, putWithWelcome(formUrl), welcomeDeps(saved));
    assert.strictEqual(context.res.status, 200, JSON.stringify(formUrl));
    assert.strictEqual(saved.length, 1);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd api && node --test site-settings/index.test.js`
Expected: FAIL. “rejects a newcomer link that is not Microsoft Forms” gets status 200.

- [ ] **Step 3: Implement**

In `api/site-settings/index.js`, add after the existing `require('../shared/blob')` line:

```js
const { isMicrosoftFormUrl } = require('../shared/applications');
```

Above `const withUrls = ...`, add:

```js
const welcomeFormUrlError = (siteCopy) => {
  const welcome = siteCopy && siteCopy.home && siteCopy.home.welcome;
  const raw = welcome ? welcome.formUrl : undefined;
  if (raw === undefined || raw === null) return null;
  const formUrl = String(raw).trim();
  if (!formUrl) return null;
  if (formUrl.length > 500 || !isMicrosoftFormUrl(formUrl)) {
    return 'Newcomer form link must be an https Microsoft Forms link.';
  }
  return null;
};
```

In the handler, immediately after the block that returns 400 for `churchInfo.error || siteCopy.error || imagePresentation.error`, add:

```js
    const welcomeError = siteCopy.omitted ? null : welcomeFormUrlError(siteCopy.value);
    if (welcomeError) {
      context.res = { status: 400, body: { error: welcomeError } };
      return;
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd api && node --test site-settings/index.test.js`
Expected: PASS, including every existing site-settings test.

- [ ] **Step 5: Run the full API suite**

Run: `cd api && npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add api/site-settings/index.js api/site-settings/index.test.js
git commit -m "사이트 설정 저장 때 새가족 폼 주소를 서버에서도 검사한다."
```

---

### Task 4: “Newcomer registration” section in the home copy editor

**Files:**
- Modify: `app/src/components/settings/HomeCopyFields.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Consumes: `value.welcome` (Task 1) and validation path `home.welcome.formUrl` (Task 2).
- Produces: none for later tasks.

- [ ] **Step 1: Import `TextField`**

In `app/src/components/settings/HomeCopyFields.tsx`, add after the `SitePhotoField` import:

```tsx
import TextField from './TextField';
```

- [ ] **Step 2: Add the section before “Next steps”**

In the returned JSX, directly before the `<CopySection` whose `title` is `isKo ? '다음 걸음' : 'Next steps'`, insert:

```tsx
      <CopySection
        title={isKo ? '새가족 등록' : 'Newcomer registration'}
        description={
          isKo ? '‘다음 걸음’ 바로 위에 보이는 안내 한 줄' : 'The band shown right above Next steps'
        }
        count={6}
      >
        <FieldGroup title={isKo ? '연결' : 'Connection'}>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={value.welcome.enabled}
              onChange={(event) => setSection('welcome', { enabled: event.currentTarget.checked })}
            />
            <span>{isKo ? '홈에 새가족 안내 표시' : 'Show the newcomer band on Home'}</span>
          </label>
          <TextField
            fieldPath="home.welcome.formUrl"
            label={isKo ? 'Microsoft Forms 주소' : 'Microsoft Forms link'}
            hint="forms.office.com · forms.microsoft.com"
            type="url"
            inputMode="url"
            maxLength={500}
            placeholder="https://forms.office.com/r/..."
            value={value.welcome.formUrl}
            onChange={(formUrl) => setSection('welcome', { formUrl })}
            full
          />
        </FieldGroup>
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.welcome.title"
            label={isKo ? '제목' : 'Title'}
            value={value.welcome.title}
            onChange={(title) => setSection('welcome', { title })}
          />
          <BilingualField
            fieldPath="home.welcome.intro"
            label={isKo ? '소개' : 'Intro'}
            value={value.welcome.intro}
            onChange={(intro) => setSection('welcome', { intro })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.welcome.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.welcome.kicker}
            onChange={(kicker) => setSection('welcome', { kicker })}
          />
          <BilingualField
            fieldPath="home.welcome.buttonLabel"
            label={isKo ? '버튼 문구' : 'Button label'}
            value={value.welcome.buttonLabel}
            onChange={(buttonLabel) => setSection('welcome', { buttonLabel })}
          />
        </FieldGroup>
      </CopySection>
```

- [ ] **Step 3: Style the toggle**

In `app/src/styles/globals.css`, directly after the rule that begins `.settings-field-group__grid {` (the one with `grid-template-columns: minmax(0, 1fr);`), add:

```css
.settings-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.settings-toggle input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--site-accent, currentColor);
}
```

- [ ] **Step 4: Typecheck and run lib tests**

Run: `cd app && npm run typecheck && npm run test:lib`
Expected: no type errors; all tests pass.

- [ ] **Step 5: Browser check of the editor**

Run: `cd app && npm run dev` and open `http://localhost:3000/manage/settings` (development auth bypass is on by default). Open the Copy tab, then “Newcomer registration”.
Expected:
- The section sits between “First visit” and “Next steps”.
- With the box ticked and the link empty, pressing save shows “Microsoft Forms 주소를 입력해 주세요.” under the link, and nothing is saved.
- `https://example.com/form` shows the same message, whether the box is ticked or not.
- A `https://forms.office.com/r/...` link clears the message.
- Editing any field marks the Copy tab as having unsaved changes.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/settings/HomeCopyFields.tsx app/src/styles/globals.css
git commit -m "사이트 설정 홈 문구에 새가족 등록 칸을 추가한다."
```

---

### Task 5: Homepage newcomer band

**Files:**
- Create: `app/src/components/home/WelcomeBand.tsx`
- Modify: `app/src/pages/index.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Consumes: `welcomeFormUrl(welcome: WelcomeCopy): string | null` and `localize` from `app/src/lib/siteCopy.ts`; `useSiteSettings()` from `app/src/lib/ThemeContext`; `Language` from `app/src/components/home/homeContent`.
- Produces: default export `WelcomeBand({ lang }: { lang: Language })`.

- [ ] **Step 1: Create the component**

Create `app/src/components/home/WelcomeBand.tsx`:

```tsx
import { localize, welcomeFormUrl } from '../../lib/siteCopy';
import { useSiteSettings } from '../../lib/ThemeContext';
import type { Language } from './homeContent';

const WelcomeBand = ({ lang }: { lang: Language }) => {
  const { siteCopy } = useSiteSettings();
  const welcome = siteCopy.home.welcome;
  const formUrl = welcomeFormUrl(welcome);
  if (!formUrl) return null;

  return (
    <section className="home-welcome" aria-labelledby="home-welcome-title">
      <div className="home-welcome__copy">
        <p className="home-kicker">{localize(welcome.kicker, lang)}</p>
        <h2 id="home-welcome-title">{localize(welcome.title, lang)}</h2>
        <p>{localize(welcome.intro, lang)}</p>
      </div>
      <a className="home-button home-button--primary" href={formUrl} target="_blank" rel="noopener noreferrer">
        {localize(welcome.buttonLabel, lang)}
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
};

export default WelcomeBand;
```

- [ ] **Step 2: Place it above “Your next step”**

In `app/src/pages/index.tsx`, add with the other home imports:

```tsx
import WelcomeBand from '../components/home/WelcomeBand';
```

In the returned JSX, change:

```tsx
      <VisitOverview lang={lang} />
      <NextSteps lang={lang} />
```

to:

```tsx
      <VisitOverview lang={lang} />
      <WelcomeBand lang={lang} />
      <NextSteps lang={lang} />
```

- [ ] **Step 3: Style the band**

In `app/src/styles/globals.css`, directly after the rule `.home-next-step > a { ... }`, add. The colors come from the `--organic-*` variables that each theme already sets, so one rule covers church, light, dark, modern, and Living.

```css
.home-welcome {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(1.5rem, 4vw, 3rem);
  padding: clamp(2rem, 4.5vw, 3.2rem) clamp(1.5rem, 4vw, 3.4rem);
  border: 1px solid var(--organic-border);
  border-radius: 2rem;
  background:
    radial-gradient(circle at 94% 18%, color-mix(in srgb, var(--organic-gold) 30%, transparent), transparent 15rem),
    linear-gradient(115deg, var(--organic-mint) 0%, var(--organic-surface) 68%);
  box-shadow: 0 24px 70px rgba(23, 63, 58, 0.08);
}

.home-welcome h2 {
  margin: 0 0 0.7rem;
  color: var(--organic-ink);
  font-size: clamp(1.8rem, 3.4vw, 2.9rem);
  letter-spacing: -0.05em;
  line-height: 1.08;
}

.home-welcome__copy > p:last-child {
  max-width: 560px;
  margin: 0;
  color: var(--organic-muted);
  font-size: 1.02rem;
  line-height: 1.7;
}
```

Inside the existing `@media (max-width: 900px)` block that contains `.home-next-steps__grid { grid-template-columns: 1fr; }`, add right after `.home-next-step { min-height: 220px; }`:

```css
  .home-welcome {
    grid-template-columns: 1fr;
  }

  .home-welcome > .home-button {
    justify-self: start;
  }
```

- [ ] **Step 4: Typecheck, tests, and build**

Run: `cd app && npm run typecheck && npm test && npm run build`
Expected: no type errors; all lib and route tests pass; the static export completes. The band is off by default, so the exported `out/index.html` contains no `home-welcome` markup.

- [ ] **Step 5: Browser check of the band**

With `npm run dev` running, turn the band on in `/manage/settings` → Copy → Newcomer registration, paste a `https://forms.office.com/r/...` link, save, and open `/`.
Expected:
- The band appears after the first-visit section and directly above “Your next step”. The three next-step cards stay 01–03.
- The button opens the form in a new tab.
- The language toggle switches every band string.
- At a mobile width (for example 390px), the button sits under the text and nothing overflows horizontally.
- The band is readable in the church, light, dark, and Living themes.
- After turning the band off and saving, the band is gone and the homepage looks as it did before.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/home/WelcomeBand.tsx app/src/pages/index.tsx app/src/styles/globals.css
git commit -m "홈 다음 걸음 위에 새가족 등록 안내를 보여 준다."
```

---

### Task 6: Final verification

- [ ] **Step 1: Full test, typecheck, and build**

Run: `cd app && npm test && npm run typecheck && npm run build && cd ../api && npm test`
Expected: every suite passes and the build completes.

- [ ] **Step 2: Confirm scope**

Run: `git diff --stat HEAD~6 -- . ':!docs'`
Expected: only the files in the File Map (plus Task 0's four files). No changes under `api/applications`, `app/src/lib/applications.ts`, `app/src/pages/resources.tsx`, or `app/src/components/home/NextSteps.tsx`.

- [ ] **Step 3: Whitespace check**

Run: `git diff --check HEAD~6`
Expected: no output.
