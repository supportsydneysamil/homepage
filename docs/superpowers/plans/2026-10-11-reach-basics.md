# Reach Basics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site findable, shareable, and easy to reach for young visitors: Korean exported HTML with browser-language detection, share previews and search files, a light hero photo, social links from site settings, contact topics with prayer sharing, and Cloudflare Web Analytics on production.

**Architecture:** Everything stays inside the existing static export. Share and search metadata are fixed at build time in `Layout` and `_document`. Pure helpers in `app/src/lib/` (`language.ts`, `pageMeta.ts`, `structuredData.ts`, `social.ts`, `contact.ts`, `analytics.ts`) carry the rules and are unit tested. Social links live in `ChurchInfo` JSON, validated in the settings editor and again by `PUT /api/site-settings`. The contact API gains a pure `buildContactEmail`.

**Tech Stack:** Next.js 16 Pages Router (`output: "export"`), React 18, TypeScript 5, `node:test` via `tsx --test src/lib/*.test.ts` and `node --test scripts/*.mjs` in `app/`, `node --test` in `api/`, Azure Functions (CommonJS), Azure Static Web Apps, Python 3 + Pillow for one-off image generation, existing `globals.css`.

Spec: `docs/superpowers/specs/2026-10-11-reach-basics-design.md` (Korean: `.ko.md`).

## Global Constraints

- Site URL: `https://sydneysamil.org`.
- Exported HTML is Korean: `_document` renders `<Html lang="ko">` and `LanguageProvider` starts in `'ko'`.
- Language on first load: stored `ko`/`en` wins; otherwise Korean if any `navigator.languages` entry is `ko` or `ko-*` (case-insensitive); otherwise English if the list is non-empty; an empty list keeps Korean. Only the toggle writes `localStorage['lang']`.
- `LanguageContext.tsx` must keep the exact line `document.documentElement.lang = lang;` (`scripts/check-homepage.py` asserts it).
- Titles: home `시드니 삼일교회 | Sydney Samil Church` (ko) and `Sydney Samil Church | 시드니 삼일교회` (en); other pages `{page} | 시드니 삼일교회` (ko) and `{page} | Sydney Samil Church` (en). Korean page titles: 소개, 예배, 이벤트, 설교, 자료·신청, 문의.
- Home description ko: `시드니 펜넌트힐스(Pennant Hills)에 있는 한인교회, 시드니 삼일교회입니다. 함께 예배하고, 삶을 나누며, 믿음 안에서 자랍니다.` en: `Sydney Samil Church is a Korean church in Pennant Hills, Sydney, where we worship, share life, and grow in faith together.`
- Share image: `https://sydneysamil.org/og-image.jpg`, 1200 × 628. No `og:url`, no canonical link.
- Built-in hero: `/church-hero.jpg` (2000 px wide, JPEG quality 82). `church-bg.png` is deleted.
- Social channels and hosts (https only, at most 300 characters after trimming): instagram `instagram.com`, `www.instagram.com`; youtube `youtube.com`, `www.youtube.com`, `m.youtube.com`; kakao `pf.kakao.com`; facebook `facebook.com`, `www.facebook.com`, `m.facebook.com`.
- Settings error `socialUrl`: `해당 서비스의 https 주소를 입력해 주세요.` / `Enter an https link for this service.`
- Server error: `Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.`
- Every social link opens with `target="_blank" rel="noopener noreferrer"`.
- Contact topics `general` | `community` | `prayer` (default `general`); prayer shares `staff` | `team` (default `staff`). Subjects: `Contact form: {name}`, `[목장 연결] {name}`, `[기도 요청] {name}`. Body lines: `Topic: Find a community (목장 연결)`, `Topic: Prayer request (기도 요청)`, `Sharing: Pastoral staff only (교역자만 보기)`, `Sharing: OK to share with the prayer team (중보기도팀 공유 가능)`.
- Beacon: `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>` only when `NODE_ENV === 'production'` and `NEXT_PUBLIC_CF_BEACON_TOKEN` matches `/^[A-Za-z0-9]+$/`. Workflow sets the variable from `vars.CF_BEACON_TOKEN` on `main` only.
- No new runtime dependency and no database schema change.
- Commit messages follow repo history: one Korean sentence ending in `-한다.`

## File Map

- `app/src/lib/language.ts` (new) — `Lang`, `pickInitialLanguage`.
- `app/src/lib/LanguageContext.tsx` — start in Korean, detect on mount.
- `app/src/pages/_document.tsx` (new) — `lang="ko"`, icon links, analytics beacon.
- `app/scripts/check-export.mjs` (new) — assertions on `out/` after a build.
- `scripts/make-share-assets.py` (new) — writes hero, share image, icons.
- `app/public/` — add `church-hero.jpg`, `og-image.jpg`, `favicon.ico`, `apple-touch-icon.png`, `robots.txt`, `sitemap.xml`; delete `church-bg.png`.
- `app/scripts/check-public.mjs` (new) — public file assertions.
- `app/src/lib/siteSettings.ts`, `app/src/styles/globals.css`, `scripts/check-homepage.py` — point at `church-hero.jpg`.
- `app/src/lib/pageMeta.ts` (new) — site URL, titles, descriptions, share image, locales.
- `app/src/components/Layout.tsx`, `app/src/pages/_app.tsx`, every page with `meta` — localized metadata and preview tags.
- `app/src/lib/structuredData.ts` (new) — `churchJsonLd`, `serializeJsonLd`; rendered on `app/src/pages/index.tsx`.
- `app/src/lib/social.ts` (new), `app/src/lib/churchInfo.ts`, `app/src/lib/settingsValidation.ts`, `app/src/components/settings/ChurchInfoFields.tsx` — social links data, validation, editor.
- `api/shared/social.js` (new), `api/site-settings/index.js` — server validation.
- `app/src/components/Footer.tsx`, `app/src/pages/contact.tsx` — social links on the site.
- `app/src/lib/contact.ts` (new), `api/contact/index.js` — contact topics.
- `app/src/lib/analytics.ts` (new), `.github/workflows/azure-static-web-apps-blue-coast-0d8f0a81e.yml`, `README.md` — analytics.

## Known Pre-existing Failure

`python3 scripts/check-homepage.py` already fails before this work at `require(html, "20 Sep", ...)` because it expects an old seed event date. Do not fix it in this plan and do not treat that failure as a regression. Only update its hero marker in Task 2.

---

### Task 1: Korean exported HTML and browser-language detection

**Files:**
- Create: `app/src/lib/language.ts`
- Test: `app/src/lib/language.test.ts`
- Modify: `app/src/lib/LanguageContext.tsx`
- Create: `app/src/pages/_document.tsx`
- Create: `app/scripts/check-export.mjs`
- Modify: `app/package.json` (scripts)

**Interfaces:**
- Produces:
  - `export type Lang = 'ko' | 'en'` from `app/src/lib/language.ts`
  - `export const pickInitialLanguage = (stored: string | null, browserLanguages: readonly string[] | undefined) => Lang`
  - `app/src/pages/_document.tsx` default export `Document` (Tasks 2 and 8 extend it)
  - `app/scripts/check-export.mjs` with a module-level `const home` holding `out/index.html` and a `read(name)` helper (Tasks 2, 3, 4, 8 append tests)
  - npm script `test:export`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/language.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { pickInitialLanguage } from './language';

test('a stored choice wins over the browser languages', () => {
  assert.strictEqual(pickInitialLanguage('en', ['ko-KR']), 'en');
  assert.strictEqual(pickInitialLanguage('ko', ['en-AU']), 'ko');
});

test('any Korean entry in the browser languages picks Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, ['ko-KR', 'en-AU']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'ko']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'KO-kr']), 'ko');
});

test('browser languages without Korean pick English', () => {
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'en']), 'en');
  assert.strictEqual(pickInitialLanguage('fr', ['zh-CN']), 'en');
  assert.strictEqual(pickInitialLanguage(null, ['kok-IN']), 'en');
});

test('no browser language information keeps Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, []), 'ko');
  assert.strictEqual(pickInitialLanguage(null, undefined), 'ko');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npx tsx --test src/lib/language.test.ts`
Expected: FAIL with a module-not-found error for `./language`.

- [ ] **Step 3: Implement `language.ts`**

Create `app/src/lib/language.ts`:

```ts
export type Lang = 'ko' | 'en';

const isKorean = (tag: string) => /^ko(?:-|$)/i.test(tag);

export const pickInitialLanguage = (
  stored: string | null,
  browserLanguages: readonly string[] | undefined
): Lang => {
  if (stored === 'ko' || stored === 'en') return stored;
  if (!browserLanguages || !browserLanguages.length) return 'ko';
  return browserLanguages.some(isKorean) ? 'ko' : 'en';
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npx tsx --test src/lib/language.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Start in Korean and detect on mount**

Replace the whole of `app/src/lib/LanguageContext.tsx` with:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pickInitialLanguage, type Lang } from './language';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const browserLanguages = (): readonly string[] => {
  const { languages, language } = window.navigator;
  if (languages && languages.length) return languages;
  return language ? [language] : [];
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    setLangState(pickInitialLanguage(window.localStorage.getItem('lang'), browserLanguages()));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', next);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ko' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
```

- [ ] **Step 6: Add `_document` with `lang="ko"`**

Create `app/src/pages/_document.tsx`:

```tsx
import { Head, Html, Main, NextScript } from 'next/document';

const Document = () => (
  <Html lang="ko">
    <Head />
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
```

- [ ] **Step 7: Add the export check**

Create `app/scripts/check-export.mjs`:

```js
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const read = (name) => readFileSync(new URL(`../out/${name}`, import.meta.url), 'utf8');
const home = read('index.html');

test('the exported homepage is Korean', () => {
  assert.ok(home.includes('<html lang="ko">'));
  assert.ok(home.includes('처음 오셔도'));
});
```

In `app/package.json`, add to `"scripts"` after `"test:routes"`:

```json
    "test:export": "node --test scripts/check-export.mjs",
```

- [ ] **Step 8: Verify**

Run: `cd app && npm run test:lib && npm run typecheck && npm run build && npm run test:export`
Expected: all lib tests pass, `tsc --noEmit` prints nothing, build lists the same routes as before, and `test:export` passes 1 test.

- [ ] **Step 9: Commit**

```bash
git add app/src/lib/language.ts app/src/lib/language.test.ts app/src/lib/LanguageContext.tsx app/src/pages/_document.tsx app/scripts/check-export.mjs app/package.json
git commit -m "사이트를 한국어로 내보내고 처음 방문 언어를 브라우저 언어로 고른다."
```

---

### Task 2: Light hero photo, share image, icons, and search files

**Files:**
- Create: `scripts/make-share-assets.py`
- Create (generated): `app/public/church-hero.jpg`, `app/public/og-image.jpg`, `app/public/favicon.ico`, `app/public/apple-touch-icon.png`
- Delete: `app/public/church-bg.png`
- Create: `app/public/robots.txt`, `app/public/sitemap.xml`
- Create: `app/scripts/check-public.mjs`
- Modify: `app/src/lib/siteSettings.ts:8`, `app/src/styles/globals.css` (three `url('/church-bg.png')`), `scripts/check-homepage.py:37`
- Modify: `app/src/pages/_document.tsx`, `app/scripts/check-export.mjs`, `app/package.json`

**Interfaces:**
- Consumes: `_document.tsx` and `check-export.mjs` from Task 1.
- Produces: `DEFAULT_HERO_IMAGE === '/church-hero.jpg'`; public files `/og-image.jpg` (1200 × 628), `/favicon.ico`, `/apple-touch-icon.png`; npm script `test:public`.

- [ ] **Step 1: Write the failing public-file test**

Create `app/scripts/check-public.mjs`:

```js
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert';

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);

test('robots.txt keeps private areas out of search and points to the sitemap', () => {
  const lines = readFileSync(publicFile('robots.txt'), 'utf8').split('\n');
  for (const line of [
    'User-agent: *',
    'Disallow: /manage',
    'Disallow: /settings',
    'Disallow: /profile',
    'Disallow: /login',
    'Sitemap: https://sydneysamil.org/sitemap.xml',
  ]) {
    assert.ok(lines.includes(line), line);
  }
});

test('the sitemap lists every public page and nothing else', () => {
  const sitemap = readFileSync(publicFile('sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepStrictEqual(urls, [
    'https://sydneysamil.org/',
    'https://sydneysamil.org/about',
    'https://sydneysamil.org/worship',
    'https://sydneysamil.org/events',
    'https://sydneysamil.org/sermons',
    'https://sydneysamil.org/resources',
    'https://sydneysamil.org/contact',
  ]);
});

test('the share image and icons are committed', () => {
  for (const name of ['og-image.jpg', 'favicon.ico', 'apple-touch-icon.png']) {
    assert.ok(existsSync(publicFile(name)), name);
  }
});

test('the built-in hero is a light JPEG and the heavy PNG is gone', () => {
  assert.ok(statSync(publicFile('church-hero.jpg')).size < 600 * 1024);
  assert.ok(!existsSync(publicFile('church-bg.png')));
});
```

In `app/package.json` scripts, add after `"test:export"`:

```json
    "test:public": "node --test scripts/check-public.mjs",
```

and change `"test"` to:

```json
    "test": "npm run test:lib && npm run test:routes && npm run test:public"
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npm run test:public`
Expected: FAIL; `robots.txt` does not exist (ENOENT), and the other three tests fail too.

- [ ] **Step 3: Add the asset script**

Create `scripts/make-share-assets.py`:

```python
"""Writes the built-in hero photo, the share preview image, and the icons into app/public.

Usage: python3 scripts/make-share-assets.py <photo> <logo>
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

PUBLIC = Path(__file__).resolve().parents[1] / "app" / "public"
HERO_WIDTH = 2000
SHARE_SIZE = (1200, 628)


def hero_photo(photo: Image.Image) -> None:
    width = min(photo.width, HERO_WIDTH)
    height = round(photo.height * width / photo.width)
    photo.resize((width, height), Image.LANCZOS).save(
        PUBLIC / "church-hero.jpg", quality=82, optimize=True, progressive=True
    )


def share_image(photo: Image.Image) -> None:
    height = round(photo.width * SHARE_SIZE[1] / SHARE_SIZE[0])
    photo.crop((0, 0, photo.width, height)).resize(SHARE_SIZE, Image.LANCZOS).save(
        PUBLIC / "og-image.jpg", quality=85, optimize=True, progressive=True
    )


def icons(logo: Image.Image) -> None:
    background = logo.getpixel((0, 0))
    difference = ImageChops.difference(logo, Image.new("RGB", logo.size, background))
    # JPEG noise in the logo background would otherwise stretch the crop to the edges.
    bounds = ImageChops.add(difference, difference, 2.0, -20).getbbox()
    mark = logo.crop(bounds) if bounds else logo
    side = round(max(mark.size) * 1.2)
    square = Image.new("RGB", (side, side), background)
    square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    square.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    square.resize((256, 256), Image.LANCZOS).save(
        PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: python3 scripts/make-share-assets.py <photo> <logo>")
    photo = Image.open(sys.argv[1]).convert("RGB")
    logo = Image.open(sys.argv[2]).convert("RGB")
    hero_photo(photo)
    share_image(photo)
    icons(logo)
    print("Wrote church-hero.jpg, og-image.jpg, apple-touch-icon.png, favicon.ico")
```

- [ ] **Step 4: Generate the assets and remove the heavy PNG**

Run (install Pillow first only if `python3 -c "import PIL"` fails: `python3 -m pip install Pillow`):

```bash
curl -s -o /tmp/samil-logo.png https://samilchurchstorage0.blob.core.windows.net/samilmedia/site/3788fc71-12cc-48d4-b346-73226b3480c3-samil-logo.png
python3 scripts/make-share-assets.py app/public/church-bg.png /tmp/samil-logo.png
git rm -q app/public/church-bg.png
ls -la app/public
```

Expected: the script prints `Wrote church-hero.jpg, og-image.jpg, apple-touch-icon.png, favicon.ico`; `church-hero.jpg` is about 400 KB, `og-image.jpg` about 150 KB; `church-bg.png` is gone. Open `og-image.jpg` and `apple-touch-icon.png` to confirm the church building and the logo are centred and uncropped.

- [ ] **Step 5: Add the search engine files**

Create `app/public/robots.txt`:

```
User-agent: *
Disallow: /manage
Disallow: /settings
Disallow: /profile
Disallow: /login
Sitemap: https://sydneysamil.org/sitemap.xml
```

Create `app/public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://sydneysamil.org/</loc></url>
  <url><loc>https://sydneysamil.org/about</loc></url>
  <url><loc>https://sydneysamil.org/worship</loc></url>
  <url><loc>https://sydneysamil.org/events</loc></url>
  <url><loc>https://sydneysamil.org/sermons</loc></url>
  <url><loc>https://sydneysamil.org/resources</loc></url>
  <url><loc>https://sydneysamil.org/contact</loc></url>
</urlset>
```

- [ ] **Step 6: Point everything at the new hero**

In `app/src/lib/siteSettings.ts` change line 8 to:

```ts
export const DEFAULT_HERO_IMAGE = '/church-hero.jpg';
```

In `app/src/styles/globals.css` replace all three occurrences of `url('/church-bg.png')` with `url('/church-hero.jpg')` (around lines 118, 1428, and 3148). Then confirm none remain:

Run: `grep -rn "church-bg" app/src scripts/check-homepage.py`
Expected after the next edit: no output.

In `scripts/check-homepage.py` change the marker `"/church-bg.png",` (line 37) to:

```python
    "/church-hero.jpg",
```

- [ ] **Step 7: Link the icons from `_document`**

Replace `<Head />` in `app/src/pages/_document.tsx` with:

```tsx
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
```

- [ ] **Step 8: Extend the export check**

Append to `app/scripts/check-export.mjs`:

```js
test('the exported homepage links the icons and the light hero photo', () => {
  assert.ok(home.includes('rel="icon" href="/favicon.ico"'));
  assert.ok(home.includes('rel="apple-touch-icon" href="/apple-touch-icon.png"'));
  assert.ok(home.includes('/church-hero.jpg'));
  assert.ok(!home.includes('/church-bg.png'));
});
```

- [ ] **Step 9: Verify**

Run: `cd app && npm test && npm run typecheck && npm run build && npm run test:export && ls out/robots.txt out/sitemap.xml out/og-image.jpg`
Expected: all tests pass (including the 4 public-file tests), no type errors, 2 export tests pass, and the three files exist in `out/`.

- [ ] **Step 10: Commit**

```bash
git add scripts/make-share-assets.py scripts/check-homepage.py app/public app/scripts/check-public.mjs app/scripts/check-export.mjs app/package.json app/src/lib/siteSettings.ts app/src/styles/globals.css app/src/pages/_document.tsx
git commit -m "기본 첫 화면 사진을 가볍게 바꾸고 공유 이미지, 아이콘, 검색엔진 파일을 더한다."
```

---

### Task 3: Localized titles, descriptions, and share preview tags

**Files:**
- Create: `app/src/lib/pageMeta.ts`
- Test: `app/src/lib/pageMeta.test.ts`
- Modify: `app/src/components/Layout.tsx`, `app/src/pages/_app.tsx`
- Modify meta in: `app/src/pages/index.tsx`, `about.tsx`, `worship.tsx`, `events/index.tsx`, `events/detail.tsx`, `sermons.tsx`, `resources.tsx`, `contact.tsx`, `manage/index.tsx`, `manage/settings.tsx`, `settings.tsx`
- Modify: `app/scripts/check-export.mjs`

**Interfaces:**
- Consumes: `Lang` from `app/src/lib/language.ts`; `LocalizedText` from `app/src/lib/churchInfo.ts`.
- Produces (all from `app/src/lib/pageMeta.ts`):
  - `export const SITE_URL = 'https://sydneysamil.org'`
  - `export type PageMeta = { title?: LocalizedText; description?: LocalizedText }`
  - `export const SITE_NAME: LocalizedText`
  - `export const HOME_DESCRIPTION: LocalizedText`
  - `export const SHARE_IMAGE: { url: string; width: number; height: number; alt: LocalizedText }`
  - `export const documentTitle = (title: LocalizedText | undefined, lang: Lang) => string`
  - `export const pageDescription = (description: LocalizedText | undefined, lang: Lang) => string`
  - `export const openGraphLocales = (lang: Lang) => { locale: string; alternate: string }`
  - `Layout` props become `{ children: ReactNode; meta?: PageMeta }`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/pageMeta.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import {
  HOME_DESCRIPTION,
  SHARE_IMAGE,
  documentTitle,
  openGraphLocales,
  pageDescription,
} from './pageMeta';

test('the home title carries both church names, led by the active language', () => {
  assert.strictEqual(documentTitle(undefined, 'ko'), '시드니 삼일교회 | Sydney Samil Church');
  assert.strictEqual(documentTitle(undefined, 'en'), 'Sydney Samil Church | 시드니 삼일교회');
});

test('other page titles end with the church name in the active language', () => {
  const title = { ko: '설교', en: 'Sermons' };
  assert.strictEqual(documentTitle(title, 'ko'), '설교 | 시드니 삼일교회');
  assert.strictEqual(documentTitle(title, 'en'), 'Sermons | Sydney Samil Church');
});

test('pages without a description use the home description', () => {
  assert.strictEqual(pageDescription(undefined, 'ko'), HOME_DESCRIPTION.ko);
  assert.strictEqual(pageDescription({ ko: '설교 안내', en: 'Sermons' }, 'en'), 'Sermons');
});

test('the Korean home description carries local search words', () => {
  assert.ok(HOME_DESCRIPTION.ko.includes('펜넌트힐스'));
  assert.ok(HOME_DESCRIPTION.ko.includes('한인교회'));
});

test('the share image is the absolute 1200 by 628 church photo', () => {
  assert.strictEqual(SHARE_IMAGE.url, 'https://sydneysamil.org/og-image.jpg');
  assert.strictEqual(SHARE_IMAGE.width, 1200);
  assert.strictEqual(SHARE_IMAGE.height, 628);
});

test('open graph locale follows the active language', () => {
  assert.deepStrictEqual(openGraphLocales('ko'), { locale: 'ko_KR', alternate: 'en_AU' });
  assert.deepStrictEqual(openGraphLocales('en'), { locale: 'en_AU', alternate: 'ko_KR' });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx tsx --test src/lib/pageMeta.test.ts`
Expected: FAIL with a module-not-found error for `./pageMeta`.

- [ ] **Step 3: Implement `pageMeta.ts`**

Create `app/src/lib/pageMeta.ts`:

```ts
import type { LocalizedText } from './churchInfo';
import type { Lang } from './language';

export const SITE_URL = 'https://sydneysamil.org';

export type PageMeta = {
  title?: LocalizedText;
  description?: LocalizedText;
};

export const SITE_NAME: LocalizedText = { ko: '시드니 삼일교회', en: 'Sydney Samil Church' };

export const HOME_DESCRIPTION: LocalizedText = {
  ko: '시드니 펜넌트힐스(Pennant Hills)에 있는 한인교회, 시드니 삼일교회입니다. 함께 예배하고, 삶을 나누며, 믿음 안에서 자랍니다.',
  en: 'Sydney Samil Church is a Korean church in Pennant Hills, Sydney, where we worship, share life, and grow in faith together.',
};

export const SHARE_IMAGE: { url: string; width: number; height: number; alt: LocalizedText } = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 628,
  alt: {
    ko: '푸른 하늘 아래 시드니 삼일교회 외관',
    en: 'Sydney Samil Church building beneath a blue sky',
  },
};

export const documentTitle = (title: LocalizedText | undefined, lang: Lang) => {
  const other: Lang = lang === 'ko' ? 'en' : 'ko';
  return title ? `${title[lang]} | ${SITE_NAME[lang]}` : `${SITE_NAME[lang]} | ${SITE_NAME[other]}`;
};

export const pageDescription = (description: LocalizedText | undefined, lang: Lang) =>
  (description ?? HOME_DESCRIPTION)[lang];

export const openGraphLocales = (lang: Lang) =>
  lang === 'ko'
    ? { locale: 'ko_KR', alternate: 'en_AU' }
    : { locale: 'en_AU', alternate: 'ko_KR' };
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd app && npx tsx --test src/lib/pageMeta.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Render localized metadata and preview tags in `Layout`**

Replace the whole of `app/src/components/Layout.tsx` with:

```tsx
import Head from 'next/head';
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollActivity from './ScrollActivity';
import { useLanguage } from '../lib/LanguageContext';
import {
  SHARE_IMAGE,
  SITE_NAME,
  documentTitle,
  openGraphLocales,
  pageDescription,
  type PageMeta,
} from '../lib/pageMeta';
import { useTheme } from '../lib/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  meta?: PageMeta;
}

const Layout = ({ children, meta }: LayoutProps) => {
  const { activeThemeId } = useTheme();
  const { lang } = useLanguage();
  const title = documentTitle(meta?.title, lang);
  const description = pageDescription(meta?.description, lang);
  const locales = openGraphLocales(lang);

  return (
    <>
      <Head>
        <title key="title">{title}</title>
        <meta key="description" name="description" content={description} />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:site_name" property="og:site_name" content={`${SITE_NAME.ko} ${SITE_NAME.en}`} />
        <meta key="og:title" property="og:title" content={title} />
        <meta key="og:description" property="og:description" content={description} />
        <meta key="og:image" property="og:image" content={SHARE_IMAGE.url} />
        <meta key="og:image:width" property="og:image:width" content={String(SHARE_IMAGE.width)} />
        <meta key="og:image:height" property="og:image:height" content={String(SHARE_IMAGE.height)} />
        <meta key="og:image:alt" property="og:image:alt" content={SHARE_IMAGE.alt[lang]} />
        <meta key="og:locale" property="og:locale" content={locales.locale} />
        <meta key="og:locale:alternate" property="og:locale:alternate" content={locales.alternate} />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      </Head>
      <div className={`layout theme-${activeThemeId}`} lang={lang}>
        <ScrollActivity />
        <Header />
        <main className="content">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
```

- [ ] **Step 6: Pass page meta through `_app`**

Replace the whole of `app/src/pages/_app.tsx` with:

```tsx
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { LanguageProvider } from '../lib/LanguageContext';
import type { PageMeta } from '../lib/pageMeta';
import { ThemeProvider } from '../lib/ThemeContext';
import '../styles/globals.css';

type PageWithMeta = AppProps['Component'] & {
  meta?: PageMeta;
};

function MyApp({ Component, pageProps }: AppProps) {
  const PageComponent = Component as PageWithMeta;

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Layout meta={PageComponent.meta}>
          <PageComponent {...pageProps} />
        </Layout>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default MyApp;
```

- [ ] **Step 7: Localize every page’s meta**

In each file below: add `import type { PageMeta } from '<relative>/lib/pageMeta';` (use `'../lib/pageMeta'` in `app/src/pages/*.tsx` and `'../../lib/pageMeta'` in `app/src/pages/events/*.tsx` and `app/src/pages/manage/*.tsx`), replace the component’s `meta?: { title?: string; description?: string }` type with `meta?: PageMeta`, and replace the `.meta = { ... }` object with the one shown.

`app/src/pages/index.tsx` (also import `HOME_DESCRIPTION`: `import { HOME_DESCRIPTION, type PageMeta } from '../lib/pageMeta';`):

```tsx
Home.meta = {
  description: HOME_DESCRIPTION,
};
```

`app/src/pages/about.tsx`:

```tsx
About.meta = {
  title: { ko: '소개', en: 'About' },
  description: {
    ko: '시드니 삼일교회의 이야기와 비전, 사명을 소개합니다. 펜넌트힐스의 한인교회로 예배와 가정교회 목장, 다음 세대를 세웁니다.',
    en: 'Meet Sydney Samil Church and discover our story, vision, and mission.',
  },
};
```

`app/src/pages/worship.tsx`:

```tsx
Worship.meta = {
  title: { ko: '예배', en: 'Worship' },
  description: {
    ko: '시드니 삼일교회 주일예배 시간과 오시는 길 안내입니다. 처음 오셔도 편안하게 함께 예배해요.',
    en: 'Service times and location for Sydney Samil Church.',
  },
};
```

`app/src/pages/events/index.tsx`:

```tsx
EventsPage.meta = {
  title: { ko: '이벤트', en: 'Events' },
  description: {
    ko: '시드니 삼일교회의 행사와 모임 소식입니다.',
    en: 'Events and gatherings at Sydney Samil Church.',
  },
};
```

`app/src/pages/events/detail.tsx`:

```tsx
EventDetailPage.meta = {
  title: { ko: '이벤트', en: 'Event' },
  description: {
    ko: '시드니 삼일교회 행사 안내입니다.',
    en: 'Event details from Sydney Samil Church.',
  },
};
```

`app/src/pages/sermons.tsx`:

```tsx
Sermons.meta = {
  title: { ko: '설교', en: 'Sermons' },
  description: {
    ko: '시드니 삼일교회 주일 설교를 다시 들어 보세요.',
    en: 'Recent messages from Sydney Samil Church.',
  },
};
```

`app/src/pages/resources.tsx`:

```tsx
Resources.meta = {
  title: { ko: '자료·신청', en: 'Resources' },
  description: {
    ko: '시드니 삼일교회 주보와 자료, 온라인 신청을 한곳에서 확인하세요.',
    en: 'Bulletins, resources, and applications from Sydney Samil Church.',
  },
};
```

`app/src/pages/contact.tsx`:

```tsx
Contact.meta = {
  title: { ko: '문의', en: 'Contact' },
  description: {
    ko: '첫 방문, 목장 연결, 기도 요청까지 시드니 삼일교회에 편하게 문의하세요.',
    en: 'Contact Sydney Samil Church, plan a visit, or request prayer.',
  },
};
```

`app/src/pages/manage/index.tsx`:

```tsx
ManagePage.meta = {
  title: { ko: '자료 관리', en: 'Content management' },
  description: {
    ko: '시드니 삼일교회 편집자를 위한 자료 관리입니다.',
    en: 'Content management for Sydney Samil Church editors.',
  },
};
```

`app/src/pages/manage/settings.tsx` (`SiteSettingsPage.meta`) and `app/src/pages/settings.tsx` (`SettingsPage.meta`), same object in both:

```tsx
{
  title: { ko: '사이트 설정', en: 'Site settings' },
  description: {
    ko: '관리자를 위한 웹사이트 설정입니다.',
    en: 'Global website settings for administrators.',
  },
}
```

- [ ] **Step 8: Use the shared title on the event detail page**

In `app/src/pages/events/detail.tsx`, add `import { documentTitle, type PageMeta } from '../../lib/pageMeta';` (merging with the import from Step 7) and replace the `<Head>` block with:

```tsx
      <Head>
        <title key="title">{documentTitle({ ko: event.title, en: event.title }, lang)}</title>
        <meta key="description" name="description" content={event.description || event.title} />
      </Head>
```

- [ ] **Step 9: Extend the export check**

Append to `app/scripts/check-export.mjs`:

```js
test('the exported homepage has a Korean title and share preview tags', () => {
  assert.match(home, /<title[^>]*>시드니 삼일교회 \| Sydney Samil Church<\/title>/);
  for (const tag of [
    'property="og:title" content="시드니 삼일교회 | Sydney Samil Church"',
    'property="og:image" content="https://sydneysamil.org/og-image.jpg"',
    'property="og:image:width" content="1200"',
    'property="og:locale" content="ko_KR"',
    'name="twitter:card" content="summary_large_image"',
  ]) {
    assert.ok(home.includes(tag), tag);
  }
  assert.ok(!home.includes('og:url'));
  assert.ok(!home.includes('rel="canonical"'));
});

test('other pages export their own Korean titles', () => {
  assert.match(read('sermons.html'), /<title[^>]*>설교 \| 시드니 삼일교회<\/title>/);
  assert.match(read('contact.html'), /<title[^>]*>문의 \| 시드니 삼일교회<\/title>/);
});
```

- [ ] **Step 10: Verify**

Run: `cd app && npm test && npm run typecheck && npm run build && npm run test:export`
Expected: all tests pass, no type errors, 4 export tests pass. If an `og:` assertion fails, print the tag with `grep -o '<meta property="og:title"[^>]*>' out/index.html` and adjust only the attribute order in `Layout`, keeping `property` before `content`.

- [ ] **Step 11: Commit**

```bash
git add app/src/lib/pageMeta.ts app/src/lib/pageMeta.test.ts app/src/components/Layout.tsx app/src/pages app/scripts/check-export.mjs
git commit -m "페이지 제목과 설명을 한·영으로 나누고 공유 미리보기 태그를 넣는다."
```

---

### Task 4: Church structured data on the homepage

**Files:**
- Create: `app/src/lib/structuredData.ts`
- Test: `app/src/lib/structuredData.test.ts`
- Modify: `app/src/pages/index.tsx`, `app/scripts/check-export.mjs`

**Interfaces:**
- Consumes: `SITE_URL` from `app/src/lib/pageMeta.ts`; `formatFullAddress`, `ChurchInfo` from `app/src/lib/churchInfo.ts`; `useSiteSettings()` returns `churchInfo` and `logoImageUrl`.
- Produces:
  - `export const churchJsonLd = (info: ChurchInfo, logoImageUrl: string) => Record<string, unknown>`-shaped object with `'@context'`, `'@type'`, `name`, `alternateName`, `url`, `telephone`, `email`, `address`, optional `logo` (Task 6 adds optional `sameAs`)
  - `export const serializeJsonLd = (value: unknown) => string`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/structuredData.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CHURCH_INFO } from './churchInfo';
import { churchJsonLd, serializeJsonLd } from './structuredData';

test('church structured data names the church in both languages', () => {
  const data = churchJsonLd(DEFAULT_CHURCH_INFO, '');
  assert.strictEqual(data['@context'], 'https://schema.org');
  assert.strictEqual(data['@type'], 'Church');
  assert.strictEqual(data.name, '시드니 삼일교회');
  assert.strictEqual(data.alternateName, 'Sydney Samil Church');
  assert.strictEqual(data.url, 'https://sydneysamil.org');
  assert.strictEqual(data.telephone, '0433 576 500');
  assert.strictEqual(data.email, 'info@sydneysamil.org');
  assert.strictEqual(data.address, 'Corner Bellamy St & Boundary Rd, Pennant Hills NSW 2120');
});

test('the logo is included only for an absolute https url', () => {
  assert.strictEqual(
    churchJsonLd(DEFAULT_CHURCH_INFO, 'https://cdn.example/logo.png').logo,
    'https://cdn.example/logo.png'
  );
  for (const logo of ['', '/logo.png', 'http://cdn.example/logo.png']) {
    assert.ok(!('logo' in churchJsonLd(DEFAULT_CHURCH_INFO, logo)), logo);
  }
});

test('serialized structured data cannot close its script tag', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const serialized = serializeJsonLd(value);
  assert.ok(!serialized.includes('<'));
  assert.deepStrictEqual(JSON.parse(serialized), value);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx tsx --test src/lib/structuredData.test.ts`
Expected: FAIL with a module-not-found error for `./structuredData`.

- [ ] **Step 3: Implement `structuredData.ts`**

Create `app/src/lib/structuredData.ts`:

```ts
import { formatFullAddress, type ChurchInfo } from './churchInfo';
import { SITE_URL } from './pageMeta';

const isAbsoluteHttps = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const churchJsonLd = (info: ChurchInfo, logoImageUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Church',
  name: info.churchNameKo,
  alternateName: info.churchNameEn,
  url: SITE_URL,
  telephone: info.phone,
  email: info.email,
  address: formatFullAddress(info),
  ...(isAbsoluteHttps(logoImageUrl) ? { logo: logoImageUrl } : {}),
});

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd app && npx tsx --test src/lib/structuredData.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Render it on the homepage**

In `app/src/pages/index.tsx`, add these imports:

```tsx
import Head from 'next/head';
import { useSiteSettings } from '../lib/ThemeContext';
import { churchJsonLd, serializeJsonLd } from '../lib/structuredData';
```

Inside `Home`, after `const { lang } = useLanguage();`, add:

```tsx
  const { churchInfo, logoImageUrl } = useSiteSettings();
```

Make the first child of `<div className="home-page">`:

```tsx
      <Head>
        <script
          key="church-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(churchJsonLd(churchInfo, logoImageUrl)) }}
        />
      </Head>
```

- [ ] **Step 6: Extend the export check**

Append to `app/scripts/check-export.mjs`:

```js
test('the exported homepage describes the church for search engines', () => {
  const match = home.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
  assert.ok(match, 'structured data script');
  const data = JSON.parse(match[1]);
  assert.strictEqual(data['@type'], 'Church');
  assert.strictEqual(data.name, '시드니 삼일교회');
});
```

- [ ] **Step 7: Verify**

Run: `cd app && npm test && npm run typecheck && npm run build && npm run test:export`
Expected: all tests pass, no type errors, 5 export tests pass.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/structuredData.ts app/src/lib/structuredData.test.ts app/src/pages/index.tsx app/scripts/check-export.mjs
git commit -m "홈에 검색엔진용 교회 정보를 넣는다."
```

---

### Task 5: Social links in site settings

**Files:**
- Create: `app/src/lib/social.ts`
- Test: `app/src/lib/social.test.ts`
- Modify: `app/src/lib/churchInfo.ts`
- Modify: `app/src/lib/settingsValidation.ts`, Test: `app/src/lib/settingsValidation.test.ts`
- Modify: `app/src/components/settings/ChurchInfoFields.tsx`
- Create: `api/shared/social.js`, Test: `api/shared/social.test.js`
- Modify: `api/site-settings/index.js`, Test: `api/site-settings/index.test.js`

**Interfaces:**
- Consumes: `LocalizedText` from `app/src/lib/churchInfo.ts`.
- Produces (from `app/src/lib/social.ts`):
  - `export type SocialChannel = 'instagram' | 'youtube' | 'kakao' | 'facebook'`
  - `export type SocialLinks = Record<SocialChannel, string>`
  - `export const MAX_SOCIAL_URL = 300`
  - `export const SOCIAL_CHANNELS: { id: SocialChannel; label: LocalizedText; hosts: string[]; placeholder: string }[]` in the order instagram, youtube, kakao, facebook
  - `export const EMPTY_SOCIAL_LINKS: SocialLinks`
  - `export const isSocialUrl = (channel: SocialChannel, value: string) => boolean` (pass a trimmed value)
  - `export const parseSocialLinks = (input: unknown) => SocialLinks`
  - `export const socialLinkList = (links: SocialLinks) => { id: SocialChannel; label: LocalizedText; url: string }[]`
  - `ChurchInfo.social: SocialLinks`
  - Validation code `'socialUrl'` with path `social.<channel>` on tab `'church'`
- Produces (from `api/shared/social.js`): `SOCIAL_HOSTS`, `isSocialUrl(channel, value)`, `socialLinksError(churchInfo) => string | null`

- [ ] **Step 1: Write the failing client tests**

Create `app/src/lib/social.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { parseChurchInfo } from './churchInfo';
import { EMPTY_SOCIAL_LINKS, isSocialUrl, parseSocialLinks, socialLinkList } from './social';

test('church info has no social links by default', () => {
  assert.deepStrictEqual(parseChurchInfo(undefined).social, EMPTY_SOCIAL_LINKS);
  assert.deepStrictEqual(parseChurchInfo({}).social, EMPTY_SOCIAL_LINKS);
});

test('each channel accepts only https links on its own hosts', () => {
  assert.ok(isSocialUrl('instagram', 'https://www.instagram.com/sydneysamil'));
  assert.ok(isSocialUrl('youtube', 'https://www.youtube.com/@sydneysamil'));
  assert.ok(isSocialUrl('kakao', 'https://pf.kakao.com/_abc/chat'));
  assert.ok(isSocialUrl('facebook', 'https://m.facebook.com/sydneysamil'));
  assert.ok(!isSocialUrl('instagram', 'http://www.instagram.com/sydneysamil'));
  assert.ok(!isSocialUrl('instagram', 'https://www.youtube.com/@sydneysamil'));
  assert.ok(!isSocialUrl('kakao', 'https://open.kakao.com/o/abc'));
  assert.ok(!isSocialUrl('facebook', 'https://facebook.com.evil.example/x'));
  assert.ok(!isSocialUrl('youtube', `https://www.youtube.com/${'a'.repeat(300)}`));
  assert.ok(!isSocialUrl('youtube', 'not a url'));
});

test('parsing trims kept links and empties anything invalid', () => {
  assert.deepStrictEqual(
    parseSocialLinks({
      instagram: '  https://www.instagram.com/sydneysamil  ',
      youtube: 'https://example.com/channel',
      kakao: 42,
    }),
    {
      instagram: 'https://www.instagram.com/sydneysamil',
      youtube: '',
      kakao: '',
      facebook: '',
    }
  );
  assert.deepStrictEqual(parseChurchInfo({ social: 'nope' }).social, EMPTY_SOCIAL_LINKS);
});

test('the link list keeps channel order and skips empty channels', () => {
  const list = socialLinkList({
    ...EMPTY_SOCIAL_LINKS,
    facebook: 'https://www.facebook.com/a',
    instagram: 'https://www.instagram.com/a',
  });
  assert.deepStrictEqual(list.map((link) => link.id), ['instagram', 'facebook']);
  assert.strictEqual(list[1].url, 'https://www.facebook.com/a');
  assert.strictEqual(list[1].label.en, 'Facebook');
});
```

Append to `app/src/lib/settingsValidation.test.ts`:

```ts
test('social links may be empty but must match their service when set', () => {
  const issues = validateChurchInfoDraft({
    ...DEFAULT_CHURCH_INFO,
    social: {
      instagram: 'https://www.instagram.com/sydneysamil',
      youtube: 'https://example.com/channel',
      kakao: '',
      facebook: 'http://www.facebook.com/sydneysamil',
    },
  });
  assert.deepStrictEqual(issues, [
    { tab: 'church', path: 'social.youtube', code: 'socialUrl' },
    { tab: 'church', path: 'social.facebook', code: 'socialUrl' },
  ]);
});

test('social link message asks for an https link', () => {
  const issue = { tab: 'church' as const, path: 'social.youtube', code: 'socialUrl' as const };
  assert.strictEqual(settingsValidationMessage(issue, true), '해당 서비스의 https 주소를 입력해 주세요.');
  assert.strictEqual(settingsValidationMessage(issue, false), 'Enter an https link for this service.');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd app && npx tsx --test src/lib/social.test.ts src/lib/settingsValidation.test.ts`
Expected: FAIL; `./social` is not found.

- [ ] **Step 3: Implement `social.ts`**

Create `app/src/lib/social.ts`:

```ts
import type { LocalizedText } from './churchInfo';

export type SocialChannel = 'instagram' | 'youtube' | 'kakao' | 'facebook';
export type SocialLinks = Record<SocialChannel, string>;

export const MAX_SOCIAL_URL = 300;

export const SOCIAL_CHANNELS: {
  id: SocialChannel;
  label: LocalizedText;
  hosts: string[];
  placeholder: string;
}[] = [
  {
    id: 'instagram',
    label: { ko: 'Instagram', en: 'Instagram' },
    hosts: ['instagram.com', 'www.instagram.com'],
    placeholder: 'https://www.instagram.com/…',
  },
  {
    id: 'youtube',
    label: { ko: 'YouTube', en: 'YouTube' },
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
    placeholder: 'https://www.youtube.com/@…',
  },
  {
    id: 'kakao',
    label: { ko: '카카오톡 채널', en: 'KakaoTalk Channel' },
    hosts: ['pf.kakao.com'],
    placeholder: 'https://pf.kakao.com/_…/chat',
  },
  {
    id: 'facebook',
    label: { ko: 'Facebook', en: 'Facebook' },
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
    placeholder: 'https://www.facebook.com/…',
  },
];

export const EMPTY_SOCIAL_LINKS: SocialLinks = { instagram: '', youtube: '', kakao: '', facebook: '' };

export const isSocialUrl = (channel: SocialChannel, value: string) => {
  const hosts = SOCIAL_CHANNELS.find((entry) => entry.id === channel)?.hosts ?? [];
  if (value.length > MAX_SOCIAL_URL) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname);
  } catch (error) {
    return false;
  }
};

export const parseSocialLinks = (input: unknown): SocialLinks => {
  const row =
    input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const links: SocialLinks = { ...EMPTY_SOCIAL_LINKS };
  SOCIAL_CHANNELS.forEach(({ id }) => {
    const value = typeof row[id] === 'string' ? (row[id] as string).trim() : '';
    links[id] = isSocialUrl(id, value) ? value : '';
  });
  return links;
};

export const socialLinkList = (links: SocialLinks) =>
  SOCIAL_CHANNELS.filter((channel) => links[channel.id]).map((channel) => ({
    id: channel.id,
    label: channel.label,
    url: links[channel.id],
  }));
```

- [ ] **Step 4: Add `social` to `ChurchInfo`**

In `app/src/lib/churchInfo.ts`:

Add at the top of the file:

```ts
import { EMPTY_SOCIAL_LINKS, parseSocialLinks, type SocialLinks } from './social';
```

In `export type ChurchInfo = { ... }`, add after `gatherings: ChurchGathering[];`:

```ts
  social: SocialLinks;
```

In `DEFAULT_CHURCH_INFO`, add after the `gatherings: [ ... ],` array:

```ts
  social: EMPTY_SOCIAL_LINKS,
```

In the object returned at the end of `parseChurchInfo`, add after `gatherings,`:

```ts
    social: parseSocialLinks(row.social),
```

(`social.ts` imports only a type from `churchInfo.ts`, so there is no runtime import cycle.)

- [ ] **Step 5: Validate social links in the editor**

In `app/src/lib/settingsValidation.ts`:

Add after the existing imports:

```ts
import { SOCIAL_CHANNELS, isSocialUrl } from './social';
```

Add `| 'socialUrl'` to the end of the `SettingsValidationCode` union, after `| 'formUrl'`.

In `validateChurchInfoDraft`, insert right before its `return Array.from(`:

```ts
  SOCIAL_CHANNELS.forEach(({ id }) => {
    const url = value.social[id].trim();
    if (url && !isSocialUrl(id, url)) {
      issues.push({ tab: 'church', path: `social.${id}`, code: 'socialUrl' });
    }
  });
```

In `settingsValidationMessage`, add to the `messages` record after the `formUrl` entry:

```ts
    socialUrl: { ko: '해당 서비스의 https 주소를 입력해 주세요.', en: 'Enter an https link for this service.' },
```

- [ ] **Step 6: Run the client tests to verify they pass**

Run: `cd app && npm run test:lib`
Expected: PASS, including the 4 social tests and the 2 new validation tests; the existing “valid default settings have no validation issues” test still passes.

- [ ] **Step 7: Add the social panel to the settings editor**

In `app/src/components/settings/ChurchInfoFields.tsx`, add after the `../../lib/churchInfo` import:

```tsx
import { MAX_SOCIAL_URL, SOCIAL_CHANNELS } from '../../lib/social';
```

Insert this panel directly after the closing `</SettingsPanel>` of the “연락처 / Contact” panel (before the “위치 / Location” panel):

```tsx
      <SettingsPanel
        title={isKo ? '소셜 채널' : 'Social channels'}
        hint={isKo ? '비워 둔 채널은 사이트에 보이지 않습니다.' : 'Empty channels stay hidden.'}
      >
        <div className="settings-grid">
          {SOCIAL_CHANNELS.map((channel) => (
            <TextField
              key={channel.id}
              fieldPath={`social.${channel.id}`}
              label={isKo ? channel.label.ko : channel.label.en}
              value={value.social[channel.id]}
              onChange={(url) => update({ social: { ...value.social, [channel.id]: url } })}
              placeholder={channel.placeholder}
              type="url"
              inputMode="url"
              maxLength={MAX_SOCIAL_URL}
              full
            />
          ))}
        </div>
      </SettingsPanel>
```

- [ ] **Step 8: Write the failing server tests**

Create `api/shared/social.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { isSocialUrl, socialLinksError } = require('./social');

const ERROR = 'Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.';

test('accepts each channel on its own https hosts', () => {
  assert.ok(isSocialUrl('instagram', 'https://instagram.com/sydneysamil'));
  assert.ok(isSocialUrl('youtube', 'https://m.youtube.com/@sydneysamil'));
  assert.ok(isSocialUrl('kakao', 'https://pf.kakao.com/_abc/chat'));
  assert.ok(isSocialUrl('facebook', 'https://www.facebook.com/sydneysamil'));
});

test('rejects other hosts, http, long links, and unknown channels', () => {
  assert.ok(!isSocialUrl('instagram', 'http://instagram.com/a'));
  assert.ok(!isSocialUrl('kakao', 'https://open.kakao.com/o/abc'));
  assert.ok(!isSocialUrl('youtube', `https://youtube.com/${'a'.repeat(300)}`));
  assert.ok(!isSocialUrl('tiktok', 'https://tiktok.com/@a'));
});

test('church info without social links has no error', () => {
  assert.strictEqual(socialLinksError({}), null);
  assert.strictEqual(socialLinksError({ social: { instagram: '', youtube: '   ' } }), null);
});

test('one invalid social link is an error', () => {
  assert.strictEqual(socialLinksError({ social: { facebook: 'https://example.com/page' } }), ERROR);
});
```

Append to `api/site-settings/index.test.js`:

```js
const putWithSocial = (social) =>
  adminReq('PUT', {
    themeId: 'church',
    heroImagePath: null,
    pastorImagePath: null,
    logoImagePath: null,
    churchInfo: { social },
  });

const socialDeps = (saved) => ({
  getCurrentSettings: async () => ({ themeId: 'church' }),
  saveSettings: async (next) => {
    saved.push(next);
    return { ...next, churchInfo: JSON.parse(next.churchInfoJson) };
  },
  deleteBlob: async () => {},
  publicUrlFor: (blobPath) => `https://example.test/${blobPath}`,
});

test('rejects a social link that is not on its service', async () => {
  const context = contextOf();
  const saved = [];
  await handler(context, putWithSocial({ instagram: 'https://example.com/me' }), socialDeps(saved));
  assert.strictEqual(context.res.status, 400);
  assert.strictEqual(
    context.res.body.error,
    'Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.'
  );
  assert.strictEqual(saved.length, 0);
});

test('accepts valid or blank social links', async () => {
  const context = contextOf();
  const saved = [];
  await handler(
    context,
    putWithSocial({
      instagram: 'https://www.instagram.com/sydneysamil',
      kakao: 'https://pf.kakao.com/_abc/chat',
      youtube: '',
      facebook: '',
    }),
    socialDeps(saved)
  );
  assert.strictEqual(context.res.status, 200);
  assert.strictEqual(saved.length, 1);
});
```

- [ ] **Step 9: Run them to verify they fail**

Run: `cd api && node --test shared/social.test.js site-settings/index.test.js`
Expected: FAIL; `./social` is not found, and “rejects a social link that is not on its service” gets status 200.

- [ ] **Step 10: Implement the server rules**

Create `api/shared/social.js`:

```js
const SOCIAL_HOSTS = {
  instagram: ['instagram.com', 'www.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  kakao: ['pf.kakao.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
};

const MAX_SOCIAL_URL = 300;

const isSocialUrl = (channel, value) => {
  const hosts = Object.prototype.hasOwnProperty.call(SOCIAL_HOSTS, channel) ? SOCIAL_HOSTS[channel] : null;
  if (!hosts || value.length > MAX_SOCIAL_URL) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname);
  } catch (error) {
    return false;
  }
};

const socialLinksError = (churchInfo) => {
  const social = churchInfo && churchInfo.social;
  if (!social || typeof social !== 'object') return null;
  for (const channel of Object.keys(SOCIAL_HOSTS)) {
    const raw = social[channel];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value && !isSocialUrl(channel, value)) {
      return 'Social links must be https links to Instagram, YouTube, KakaoTalk Channel, or Facebook.';
    }
  }
  return null;
};

module.exports = { SOCIAL_HOSTS, isSocialUrl, socialLinksError };
```

In `api/site-settings/index.js`, add after the `require('../shared/applications')` line:

```js
const { socialLinksError } = require('../shared/social');
```

and insert right after the `if (welcomeError) { ... }` block:

```js
    const socialError = churchInfo.omitted ? null : socialLinksError(churchInfo.value);
    if (socialError) {
      context.res = { status: 400, body: { error: socialError } };
      return;
    }
```

- [ ] **Step 11: Verify**

Run: `cd api && npm test && cd ../app && npm test && npm run typecheck`
Expected: all API tests pass (4 new in `shared/social.test.js`, 2 new in `site-settings/index.test.js`), all app tests pass, no type errors.

- [ ] **Step 12: Check the editor in the browser**

Run: `cd app && npm run dev`, open `http://localhost:3000/manage/settings`, go to the church info tab. Expected: a “소셜 채널” panel after “연락처” with four full-width URL fields. Typing `https://example.com` into YouTube shows “해당 서비스의 https 주소를 입력해 주세요.” and blocks save; clearing it removes the error. (Saving needs the API; the dev role bypass shows the page without signing in.)

- [ ] **Step 13: Commit**

```bash
git add app/src/lib/social.ts app/src/lib/social.test.ts app/src/lib/churchInfo.ts app/src/lib/settingsValidation.ts app/src/lib/settingsValidation.test.ts app/src/components/settings/ChurchInfoFields.tsx api/shared/social.js api/shared/social.test.js api/site-settings/index.js api/site-settings/index.test.js
git commit -m "사이트 설정에 소셜 채널 주소를 추가하고 서버에서도 검사한다."
```

---

### Task 6: Social links in the footer, on the contact page, and in structured data

**Files:**
- Modify: `app/src/components/Footer.tsx`
- Modify: `app/src/pages/contact.tsx`
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/lib/structuredData.ts`, Test: `app/src/lib/structuredData.test.ts`

**Interfaces:**
- Consumes: `socialLinkList`, `SocialLinks` from Task 5; `churchJsonLd` from Task 4.
- Produces: `churchJsonLd(...).sameAs?: string[]`; CSS class `footer__details--social`.

- [ ] **Step 1: Write the failing structured-data test**

Append to `app/src/lib/structuredData.test.ts`:

```ts
test('sameAs lists only the social links that are set', () => {
  const info = {
    ...DEFAULT_CHURCH_INFO,
    social: {
      ...DEFAULT_CHURCH_INFO.social,
      instagram: 'https://www.instagram.com/a',
      kakao: 'https://pf.kakao.com/_a',
    },
  };
  assert.deepStrictEqual(churchJsonLd(info, '').sameAs, [
    'https://www.instagram.com/a',
    'https://pf.kakao.com/_a',
  ]);
  assert.ok(!('sameAs' in churchJsonLd(DEFAULT_CHURCH_INFO, '')));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx tsx --test src/lib/structuredData.test.ts`
Expected: FAIL; `sameAs` is `undefined`.

- [ ] **Step 3: Add `sameAs`**

Replace `churchJsonLd` in `app/src/lib/structuredData.ts` with the version below, and add `import { socialLinkList } from './social';` to the imports:

```ts
export const churchJsonLd = (info: ChurchInfo, logoImageUrl: string) => {
  const sameAs = socialLinkList(info.social).map((link) => link.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: info.churchNameKo,
    alternateName: info.churchNameEn,
    url: SITE_URL,
    telephone: info.phone,
    email: info.email,
    address: formatFullAddress(info),
    ...(isAbsoluteHttps(logoImageUrl) ? { logo: logoImageUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
};
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd app && npx tsx --test src/lib/structuredData.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the footer column**

Replace the whole of `app/src/components/Footer.tsx` with:

```tsx
import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { phoneHref } from '../lib/churchInfo';
import { localize } from '../lib/siteCopy';
import { socialLinkList } from '../lib/social';
import BrandMark from './BrandMark';

const Footer = () => {
  const { lang } = useLanguage();
  const { logoImageUrl, churchInfo, siteCopy } = useSiteSettings();
  const footer = siteCopy.footer;
  const social = socialLinkList(churchInfo.social);

  return (
    <footer className="footer">
      <div className="footer__brand">
        <BrandMark src={logoImageUrl} className="footer__mark" />
        <div>
          <strong>{churchInfo.churchNameEn}</strong>
          <p>{localize(footer.tagline, lang)}</p>
        </div>
      </div>

      <div className={social.length ? 'footer__details footer__details--social' : 'footer__details'}>
        <div>
          <span>{localize(footer.findUs, lang)}</span>
          <p>
            {churchInfo.addressLine1}
            <br />
            {churchInfo.addressLine2}
          </p>
        </div>
        <div>
          <span>{localize(footer.contact, lang)}</span>
          <a href={phoneHref(churchInfo.phone)}>{churchInfo.phone}</a>
          <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
        </div>
        <div>
          <span>{localize(footer.explore, lang)}</span>
          <Link href="/about">{localize(footer.about, lang)}</Link>
          <Link href="/worship">{localize(footer.worship, lang)}</Link>
          <Link href="/sermons">{localize(footer.sermons, lang)}</Link>
        </div>
        {social.length ? (
          <div>
            <span>{lang === 'ko' ? '소식 받기' : 'Follow us'}</span>
            {social.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                {localize(link.label, lang)}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="footer__bottom">
        <small suppressHydrationWarning>
          &copy; {new Date().getFullYear()} {churchInfo.churchNameEn}
        </small>
        <Link href="/contact" className="footer__visit">
          {localize(footer.meetUs, lang)}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
```

In `app/src/styles/globals.css`, insert directly after the `.footer__details { ... }` block (the one with `grid-template-columns: 1.4fr 1fr 0.7fr;`, around line 4021) and before `.footer__details > div`:

```css
.footer__details--social {
  grid-template-columns: 1.4fr 1fr 0.7fr 0.7fr;
}
```

The later `@media (max-width: 700px) { .footer__details { grid-template-columns: 1fr; } }` rule has the same specificity and comes later, so narrow screens still stack to one column.

- [ ] **Step 6: Add “Message us” to the contact details**

In `app/src/pages/contact.tsx`, add the import:

```tsx
import { socialLinkList } from '../lib/social';
```

Inside `Contact`, after `const copy = siteCopy.contact;`, add:

```tsx
  const socialLinks = socialLinkList(churchInfo.social);
  const messengers = (['kakao', 'instagram'] as const).flatMap((id) =>
    socialLinks.filter((link) => link.id === id)
  );
```

In the `<aside className="contact-intro">`, insert directly after the email `<div>` (the one containing `mailto:`):

```tsx
          {messengers.length ? (
            <div>
              <span>{isKo ? '메시지로 문의' : 'Message us'}</span>
              {messengers.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  {isKo ? link.label.ko : link.label.en}
                </a>
              ))}
            </div>
          ) : null}
```

- [ ] **Step 7: Verify**

Run: `cd app && npm test && npm run typecheck && npm run build && npm run test:export`
Expected: all pass; the default build has no social links, so the footer still has three columns.

- [ ] **Step 8: Check in the browser with sample links**

Temporarily change `EMPTY_SOCIAL_LINKS` in `app/src/lib/social.ts` to `{ instagram: 'https://www.instagram.com/test', youtube: '', kakao: 'https://pf.kakao.com/_test/chat', facebook: '' }`, run `cd app && npm run dev`, and check `http://localhost:3000/` and `/contact` at desktop width and at 390 px:
- Footer shows a “소식 받기” column with Instagram and 카카오톡 채널; at 390 px all columns stack.
- Contact details show “메시지로 문의” with 카카오톡 채널 first, then Instagram; links open in a new tab.
- Switching to English shows “Follow us”, “Message us”, and “KakaoTalk Channel”.

Then restore `EMPTY_SOCIAL_LINKS` to `{ instagram: '', youtube: '', kakao: '', facebook: '' }` and confirm with `git diff app/src/lib/social.ts` (no output).

- [ ] **Step 9: Commit**

```bash
git add app/src/components/Footer.tsx app/src/pages/contact.tsx app/src/styles/globals.css app/src/lib/structuredData.ts app/src/lib/structuredData.test.ts
git commit -m "소셜 채널을 푸터, 문의 페이지, 교회 정보에 보여 준다."
```

---

### Task 7: Contact topics and prayer sharing

**Files:**
- Create: `app/src/lib/contact.ts`, Test: `app/src/lib/contact.test.ts`
- Modify: `app/src/pages/contact.tsx`
- Modify: `app/src/styles/globals.css`
- Modify: `api/contact/index.js`, Test: `api/contact/index.test.js` (new)

**Interfaces:**
- Consumes: `socialLinkList` (Task 5), `PageMeta` (Task 3).
- Produces:
  - `export const CONTACT_TOPICS = ['general', 'community', 'prayer'] as const`, `export type ContactTopic`, `export type PrayerShare = 'staff' | 'team'`, `export const parseContactTopic = (value: unknown) => ContactTopic` from `app/src/lib/contact.ts`
  - `POST /api/contact` body gains optional `topic` and `share`
  - `module.exports.buildContactEmail = ({ name, email, phone, message, topic, share }) => { subject: string; text: string }` on `api/contact/index.js`

- [ ] **Step 1: Write the failing client test**

Create `app/src/lib/contact.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { CONTACT_TOPICS, parseContactTopic } from './contact';

test('known topics pass through', () => {
  for (const topic of CONTACT_TOPICS) {
    assert.strictEqual(parseContactTopic(topic), topic);
  }
});

test('missing, unknown, or repeated topics fall back to general', () => {
  for (const value of [undefined, '', 'Prayer', 'spam', ['prayer'], 42]) {
    assert.strictEqual(parseContactTopic(value), 'general', String(value));
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx tsx --test src/lib/contact.test.ts`
Expected: FAIL with a module-not-found error for `./contact`.

- [ ] **Step 3: Implement `contact.ts`**

Create `app/src/lib/contact.ts`:

```ts
export const CONTACT_TOPICS = ['general', 'community', 'prayer'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export type PrayerShare = 'staff' | 'team';

export const parseContactTopic = (value: unknown): ContactTopic =>
  CONTACT_TOPICS.find((topic) => topic === value) ?? 'general';
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd app && npx tsx --test src/lib/contact.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the failing API test**

Create `api/contact/index.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const handler = require('./index');
const { buildContactEmail } = handler;

const base = { name: 'Kim', email: 'kim@example.com', phone: '', message: 'Hello' };

test('a general message keeps the original subject and no topic line', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'general' });
  assert.strictEqual(subject, 'Contact form: Kim');
  assert.strictEqual(text, 'Name: Kim\nEmail: kim@example.com\n\nHello');
});

test('a community request is tagged for small-group follow-up', () => {
  const { subject, text } = buildContactEmail({ ...base, topic: 'community', share: 'team' });
  assert.strictEqual(subject, '[목장 연결] Kim');
  assert.ok(text.includes('Topic: Find a community (목장 연결)'));
  assert.ok(!text.includes('Sharing:'));
});

test('a prayer request is tagged and defaults to pastoral staff only', () => {
  const { subject, text } = buildContactEmail({ ...base, phone: '0400 000 000', topic: 'prayer' });
  assert.strictEqual(subject, '[기도 요청] Kim');
  assert.strictEqual(
    text,
    [
      'Name: Kim',
      'Email: kim@example.com',
      'Phone: 0400 000 000',
      'Topic: Prayer request (기도 요청)',
      'Sharing: Pastoral staff only (교역자만 보기)',
      '',
      'Hello',
    ].join('\n')
  );
});

test('a prayer request can allow the prayer team', () => {
  const { text } = buildContactEmail({ ...base, topic: 'prayer', share: 'team' });
  assert.ok(text.includes('Sharing: OK to share with the prayer team (중보기도팀 공유 가능)'));
});

test('unknown topic and share values fall back to the defaults', () => {
  assert.strictEqual(buildContactEmail({ ...base, topic: 'spam' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base, topic: '__proto__' }).subject, 'Contact form: Kim');
  assert.strictEqual(buildContactEmail({ ...base }).subject, 'Contact form: Kim');
  assert.ok(
    buildContactEmail({ ...base, topic: 'prayer', share: 'everyone' }).text.includes(
      'Sharing: Pastoral staff only (교역자만 보기)'
    )
  );
});

test('the handler is still the default export', () => {
  assert.strictEqual(typeof handler, 'function');
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd api && node --test contact/index.test.js`
Expected: FAIL with `TypeError: buildContactEmail is not a function`.

- [ ] **Step 7: Implement `buildContactEmail` and use it**

Replace the whole of `api/contact/index.js` with:

```js
const { EmailClient } = require('@azure/communication-email');

const getEnv = (name) => process.env[name] || '';

const parseBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.rawBody) {
    try {
      return JSON.parse(req.rawBody);
    } catch (error) {
      return null;
    }
  }
  return null;
};

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value || '');

const limit = (value, max) => value.slice(0, max);

const TOPICS = {
  general: null,
  community: { tag: '[목장 연결]', label: 'Find a community (목장 연결)' },
  prayer: { tag: '[기도 요청]', label: 'Prayer request (기도 요청)' },
};

const SHARES = {
  staff: 'Pastoral staff only (교역자만 보기)',
  team: 'OK to share with the prayer team (중보기도팀 공유 가능)',
};

const known = (table, value, fallback) =>
  Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;

const buildContactEmail = ({ name, email, phone, message, topic, share }) => {
  const topicId = known(TOPICS, String(topic || ''), 'general');
  const details = TOPICS[topicId];
  const subject = details ? `${details.tag} ${name}` : `Contact form: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    details ? `Topic: ${details.label}` : null,
    topicId === 'prayer' ? `Sharing: ${SHARES[known(SHARES, String(share || ''), 'staff')]}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');
  return { subject, text };
};

module.exports = async function (context, req) {
  if (req.method && req.method.toUpperCase() !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
    return;
  }

  const body = parseBody(req) || {};
  const name = limit((body.name || '').toString().trim(), 200);
  const email = limit((body.email || '').toString().trim(), 320);
  const phone = limit((body.phone || '').toString().trim(), 80);
  const message = limit((body.message || '').toString().trim(), 8000);

  if (!name || !email || !message || !isValidEmail(email)) {
    context.res = { status: 400, body: { error: 'Invalid form submission.' } };
    return;
  }

  const connectionString = getEnv('ACS_CONNECTION_STRING');
  const toEmail = getEnv('CONTACT_TO') || 'info@sydneysamil.org';
  const fromEmail = getEnv('CONTACT_FROM');

  if (!connectionString || !fromEmail) {
    context.res = {
      status: 500,
      body: { error: 'Email service is not configured.' },
    };
    return;
  }

  const { subject, text } = buildContactEmail({
    name,
    email,
    phone,
    message,
    topic: body.topic,
    share: body.share,
  });

  try {
    const client = new EmailClient(connectionString);
    const poller = await client.beginSend({
      senderAddress: fromEmail,
      replyTo: [{ address: email, displayName: name }],
      recipients: {
        to: [{ address: toEmail }],
      },
      content: {
        subject,
        plainText: text,
      },
    });
    const result = await poller.pollUntilDone();
    const status = (result && result.status) || '';

    if (status && status !== 'Succeeded') {
      context.log.warn(`ACS email send finished with status ${status}`);
      context.res = { status: 502, body: { error: 'Email provider rejected request.' } };
      return;
    }

    context.res = { status: 202, body: { ok: true } };
  } catch (error) {
    context.log.error('ACS email send failed', error);
    context.res = { status: 500, body: { error: 'Unable to reach email provider.' } };
  }
};

module.exports.buildContactEmail = buildContactEmail;
```

- [ ] **Step 8: Run the API tests to verify they pass**

Run: `cd api && npm test`
Expected: PASS, including the 6 new contact tests.

- [ ] **Step 9: Add topics and prayer sharing to the contact page**

Replace the whole of `app/src/pages/contact.tsx` with:

```tsx
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { phoneHref } from '../lib/churchInfo';
import { parseContactTopic, type ContactTopic, type PrayerShare } from '../lib/contact';
import type { PageMeta } from '../lib/pageMeta';
import { localize } from '../lib/siteCopy';
import { socialLinkList } from '../lib/social';

const CONTACT_ENDPOINT = '/api/contact';

const TOPIC_OPTIONS: { id: ContactTopic; ko: string; en: string }[] = [
  { id: 'general', ko: '일반 문의', en: 'General question' },
  { id: 'community', ko: '목장 연결', en: 'Find a community' },
  { id: 'prayer', ko: '기도 요청', en: 'Prayer request' },
];

const SHARE_OPTIONS: { id: PrayerShare; ko: string; en: string }[] = [
  { id: 'staff', ko: '교역자만 보기', en: 'Pastoral staff only' },
  { id: 'team', ko: '중보기도팀과 함께 기도해도 괜찮아요', en: 'OK to share with the prayer team' },
];

const Contact: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  const { churchInfo, siteCopy } = useSiteSettings();
  const copy = siteCopy.contact;
  const socialLinks = socialLinkList(churchInfo.social);
  const messengers = (['kakao', 'instagram'] as const).flatMap((id) =>
    socialLinks.filter((link) => link.id === id)
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [topic, setTopic] = useState<ContactTopic>('general');
  const [share, setShare] = useState<PrayerShare>('staff');
  // Remounting the form clears the typed fields while the chosen topic stays in state.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (router.isReady) setTopic(parseContactTopic(router.query.topic));
  }, [router.isReady, router.query.topic]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (formData.get('name') || '').toString(),
          email: (formData.get('email') || '').toString(),
          phone: (formData.get('phone') || '').toString(),
          message: (formData.get('message') || '').toString(),
          topic,
          share: topic === 'prayer' ? share : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setStatus('success');
      setFormKey((key) => key + 1);
    } catch {
      setStatus('error');
    }
  };

  return (
    <article className="site-page contact-page">
      <PageHero
        eyebrow={localize(copy.eyebrow, lang)}
        title={localize(copy.title, lang)}
        description={localize(copy.description, lang)}
      />

      <section className="contact-layout">
        <aside className="contact-intro">
          <p className="site-kicker">{localize(copy.detailsKicker, lang)}</p>
          <div>
            <span>{isKo ? '전화' : 'Phone'}</span>
            <a href={phoneHref(churchInfo.phone)}>{churchInfo.phone}</a>
          </div>
          <div>
            <span>{isKo ? '이메일' : 'Email'}</span>
            <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
          </div>
          {messengers.length ? (
            <div>
              <span>{isKo ? '메시지로 문의' : 'Message us'}</span>
              {messengers.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  {isKo ? link.label.ko : link.label.en}
                </a>
              ))}
            </div>
          ) : null}
          <div>
            <span>{isKo ? '주소' : 'Address'}</span>
            <p>
              {churchInfo.addressLine1}
              <br />
              {churchInfo.addressLine2}
            </p>
          </div>
          <p className="contact-intro__note">{localize(copy.note, lang)}</p>
        </aside>

        <form key={formKey} className="site-form contact-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>{isKo ? '문의 종류' : 'What is this about?'}</legend>
            <div className="contact-choices">
              {TOPIC_OPTIONS.map((option) => (
                <label className="contact-choice" key={option.id}>
                  <input
                    type="radio"
                    name="topic"
                    value={option.id}
                    checked={topic === option.id}
                    onChange={() => setTopic(option.id)}
                  />
                  {isKo ? option.ko : option.en}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            <span>{isKo ? '이름' : 'Name'}</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label>
            <span>{isKo ? '이메일' : 'Email'}</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            <span>{isKo ? '연락처 (선택)' : 'Phone (optional)'}</span>
            <input type="tel" name="phone" autoComplete="tel" />
          </label>
          {topic === 'prayer' ? (
            <fieldset>
              <legend>{isKo ? '공유 범위' : 'Who may see this?'}</legend>
              <div className="contact-choices">
                {SHARE_OPTIONS.map((option) => (
                  <label className="contact-choice" key={option.id}>
                    <input
                      type="radio"
                      name="share"
                      value={option.id}
                      checked={share === option.id}
                      onChange={() => setShare(option.id)}
                    />
                    {isKo ? option.ko : option.en}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <label>
            <span>
              {topic === 'prayer' ? (isKo ? '기도 제목' : 'Prayer request') : isKo ? '메시지' : 'Message'}
            </span>
            {topic === 'community' ? (
              <small className="contact-form__hint">
                {isKo
                  ? '사는 지역, 연령대, 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요.'
                  : 'Tell us your area, age group, and which days suit you, and we will suggest a community.'}
              </small>
            ) : null}
            <textarea name="message" rows={6} required />
          </label>
          <button className="site-button site-button--primary" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? (isKo ? '보내는 중…' : 'Sending…') : (isKo ? '메시지 보내기' : 'Send message')}
            <span aria-hidden="true">→</span>
          </button>
          <div className="form-status" aria-live="polite">
            {status === 'success' ? (
              <p className="success-text">{isKo ? '메시지를 보냈습니다. 곧 연락드리겠습니다.' : 'Message sent. We will be in touch soon.'}</p>
            ) : null}
            {status === 'error' ? (
              <p className="error-text" role="alert">{isKo ? '전송에 실패했습니다. 다시 시도해 주세요.' : 'Something went wrong. Please try again.'}</p>
            ) : null}
          </div>
        </form>
      </section>
    </article>
  );
};

Contact.meta = {
  title: { ko: '문의', en: 'Contact' },
  description: {
    ko: '첫 방문, 목장 연결, 기도 요청까지 시드니 삼일교회에 편하게 문의하세요.',
    en: 'Contact Sydney Samil Church, plan a visit, or request prayer.',
  },
};

export default Contact;
```

- [ ] **Step 10: Style the choices**

In `app/src/styles/globals.css`, insert directly after the `.site-form textarea { resize: vertical; }` block (around line 4441):

```css
.site-form fieldset {
  display: grid;
  gap: 0.6rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.site-form legend {
  padding: 0;
  color: var(--site-ink);
  font-size: 0.85rem;
  font-weight: 750;
}

.contact-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.site-form .contact-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.95rem;
  border: 1px solid var(--site-line);
  border-radius: 999px;
  background: var(--site-canvas);
  cursor: pointer;
}

.site-form .contact-choice input {
  width: auto;
  margin: 0;
  padding: 0;
  border: 0;
  box-shadow: none;
  accent-color: var(--site-accent);
}

.site-form .contact-choice:has(input:checked) {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 10%, var(--site-canvas));
}

.site-form .contact-choice:has(input:focus-visible) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 16%, transparent);
}

.contact-form__hint {
  color: var(--site-muted);
  font-size: 0.8rem;
  font-weight: 500;
}
```

- [ ] **Step 11: Verify**

Run: `cd app && npm test && npm run typecheck && npm run build && npm run test:export`
Expected: all pass.

- [ ] **Step 12: Check in the browser**

Run: `cd app && npm run dev` and open, at desktop width and 390 px, in Korean and English:
- `http://localhost:3000/contact` — “일반 문의” is selected; no sharing choice; message label is “메시지”.
- `http://localhost:3000/contact?topic=community` — “목장 연결” is selected and the area/age/day hint shows above the message box.
- `http://localhost:3000/contact?topic=prayer` — “기도 요청” is selected; “공유 범위” shows with “교역자만 보기” selected; message label is “기도 제목”.
- From the homepage, the “기도 요청” and “연결 요청” next-step links land with the matching topic selected.
- Keyboard: Tab reaches each radio group, arrow keys move within it, and the focused pill shows a focus ring.

- [ ] **Step 13: Commit**

```bash
git add app/src/lib/contact.ts app/src/lib/contact.test.ts app/src/pages/contact.tsx app/src/styles/globals.css api/contact/index.js api/contact/index.test.js
git commit -m "문의 종류와 기도 요청 공유 범위를 받아 메일 제목에 표시한다."
```

---

### Task 8: Cloudflare Web Analytics on production

**Files:**
- Create: `app/src/lib/analytics.ts`, Test: `app/src/lib/analytics.test.ts`
- Modify: `app/src/pages/_document.tsx`
- Modify: `app/scripts/check-export.mjs`
- Modify: `.github/workflows/azure-static-web-apps-blue-coast-0d8f0a81e.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `_document.tsx` from Tasks 1–2.
- Produces: `export const CLOUDFLARE_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js'`, `export const cloudflareBeaconConfig = (token: string | undefined, nodeEnv: string | undefined) => string | null`.

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/analytics.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert';
import { cloudflareBeaconConfig } from './analytics';

test('a production build with a token loads the beacon', () => {
  assert.strictEqual(cloudflareBeaconConfig('0123abcdEF', 'production'), '{"token":"0123abcdEF"}');
});

test('no beacon without a token, outside production, or with an unexpected token', () => {
  assert.strictEqual(cloudflareBeaconConfig(undefined, 'production'), null);
  assert.strictEqual(cloudflareBeaconConfig('', 'production'), null);
  assert.strictEqual(cloudflareBeaconConfig('0123abcd', 'development'), null);
  assert.strictEqual(cloudflareBeaconConfig('abc"}<script>', 'production'), null);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx tsx --test src/lib/analytics.test.ts`
Expected: FAIL with a module-not-found error for `./analytics`.

- [ ] **Step 3: Implement `analytics.ts`**

Create `app/src/lib/analytics.ts`:

```ts
export const CLOUDFLARE_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

export const cloudflareBeaconConfig = (token: string | undefined, nodeEnv: string | undefined) =>
  nodeEnv === 'production' && token && /^[A-Za-z0-9]+$/.test(token) ? JSON.stringify({ token }) : null;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `cd app && npx tsx --test src/lib/analytics.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Render the beacon from `_document`**

Replace the whole of `app/src/pages/_document.tsx` with:

```tsx
import { Head, Html, Main, NextScript } from 'next/document';
import { CLOUDFLARE_BEACON_SRC, cloudflareBeaconConfig } from '../lib/analytics';

const beaconConfig = cloudflareBeaconConfig(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN, process.env.NODE_ENV);

const Document = () => (
  <Html lang="ko">
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
    <body>
      <Main />
      <NextScript />
      {beaconConfig ? <script defer src={CLOUDFLARE_BEACON_SRC} data-cf-beacon={beaconConfig} /> : null}
    </body>
  </Html>
);

export default Document;
```

- [ ] **Step 6: Extend the export check**

Append to `app/scripts/check-export.mjs`:

```js
test('the analytics beacon appears only when a token was set at build time', () => {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  assert.strictEqual(home.includes('static.cloudflareinsights.com/beacon.min.js'), Boolean(token));
  if (token) assert.ok(home.includes(`data-cf-beacon="{&quot;token&quot;:&quot;${token}&quot;}"`));
});
```

- [ ] **Step 7: Verify both builds**

Run:

```bash
cd app
NEXT_PUBLIC_CF_BEACON_TOKEN=0123abcd npm run build && NEXT_PUBLIC_CF_BEACON_TOKEN=0123abcd npm run test:export
npm run build && npm run test:export
npm test && npm run typecheck
```

Expected: both export runs pass 6 tests; the first build’s `out/index.html` contains the beacon and the second does not; all unit tests pass; no type errors. If the escaped-attribute assertion fails, run `grep -o 'data-cf-beacon="[^"]*"' out/index.html` after the token build and match the assertion to React’s actual escaping.

- [ ] **Step 8: Pass the token in the deploy workflow on `main` only**

In `.github/workflows/azure-static-web-apps-blue-coast-0d8f0a81e.yml`, add an `env:` block to the `Build And Deploy` step, between `uses: Azure/static-web-apps-deploy@v1` and `with:`:

```yaml
        env:
          NEXT_PUBLIC_CF_BEACON_TOKEN: ${{ github.ref_name == 'main' && vars.CF_BEACON_TOKEN || '' }}
```

- [ ] **Step 9: Document the setting**

In `README.md`, add this section directly before `## Contact form (Azure Communication Services)`:

```markdown
## Analytics (Cloudflare Web Analytics)
The production build adds the Cloudflare Web Analytics beacon when the GitHub repository variable `CF_BEACON_TOKEN` is set. The deploy workflow passes it as `NEXT_PUBLIC_CF_BEACON_TOKEN` on `main` only, so local development and the dev preview never report. The beacon sets no cookies.

1) In Cloudflare, open Web Analytics, add the site `sydneysamil.org`, and copy the token from the JS snippet.
2) In GitHub → Settings → Secrets and variables → Actions → Variables, add `CF_BEACON_TOKEN` with that token.
3) Push to `main`. Visits appear in Cloudflare within a few minutes.
```

- [ ] **Step 10: Commit**

```bash
git add app/src/lib/analytics.ts app/src/lib/analytics.test.ts app/src/pages/_document.tsx app/scripts/check-export.mjs .github/workflows/azure-static-web-apps-blue-coast-0d8f0a81e.yml README.md
git commit -m "운영 사이트에 Cloudflare 방문 분석을 붙인다."
```

---

### Task 9: Final verification and handoff

**Files:** none changed unless a check fails.

- [ ] **Step 1: Run every automated check**

Run:

```bash
cd app && npm test && npm run typecheck && npm run build && npm run test:export
cd ../api && npm test
```

Expected: everything passes. (`scripts/check-homepage.py` is excluded; see Known Pre-existing Failure.)

- [ ] **Step 2: Browser pass**

Run `cd app && npm run dev` and check at desktop width and 390 px:
- In a private window with the browser language set to English only, the site opens in English; with Korean listed anywhere, it opens in Korean. After pressing the language toggle, a reload keeps the chosen language.
- The tab shows the church icon; the page title follows the language.
- The homepage hero photo looks the same as before and loads quickly; the theme previews in site settings that used the old photo still show it.
- Footer and contact page show no social section while settings have no social links.
- `/contact?topic=prayer` works as in Task 7.

- [ ] **Step 3: Check the dev preview after pushing**

Push the branch to `dev` (the workflow deploys the stable dev preview). On the preview:
- `/robots.txt` and `/sitemap.xml` return plain text and XML, not the homepage.
- Submitting a prayer request delivers a “[기도 요청] {name}” email to the contact inbox with the sharing line.
- The page source has no `cloudflareinsights` beacon (preview builds never get the token).

- [ ] **Step 4: Hand the church checklist to the owner**

Report these remaining non-code steps from the spec’s “Church Checklist”:
- Create the Cloudflare account and set the `CF_BEACON_TOKEN` repository variable (README section).
- Enter social channel links in Site settings → Church info → 소셜 채널.
- Confirm who reads the contact inbox so “교역자만 보기” is accurate.
- Register the site in Google Search Console and Naver Search Advisor and submit `https://sydneysamil.org/sitemap.xml`.
- Review the Google Business Profile.
- After the production deploy, refresh previews with the Kakao sharing debugger (`https://developers.kakao.com/tool/debugger/sharing`) and the Facebook sharing debugger (`https://developers.facebook.com/tools/debug/`).
