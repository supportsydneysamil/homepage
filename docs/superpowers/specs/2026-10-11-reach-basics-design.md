# Reach Basics

한국어: [젊은 층 연결 기본기](./2026-10-11-reach-basics-design.ko.md)

## Goal

Young people find churches through search, links shared in KakaoTalk and Instagram, and the channels they already use. Today the site is weak at all three: shared links show no preview, search engines read an English page with no Korean keywords, there are no social links anywhere, and the home “prayer” and “community” buttons land on a generic contact form that drops the topic. This work fixes those basics with small, independent changes inside the existing architecture.

## Product Judgment

The site already explains a first visit well. What it lacks is the path before and after that: being found, being shared, and being easy to reach. Those are cheap to fix and help every later feature, so they come before larger work such as a podcast feed, a young-adults page, or push notifications.

Share previews and search metadata are fixed at build time. Kakao, Naver, and Facebook read only the exported HTML, so build time is what they see anyway. Fetching live site settings during the build would tie deploys to the production API, and a share-preview function per event is larger work with little value while events have no photos.

The exported HTML becomes Korean. The church’s main audience is Korean, Korean text in the HTML helps Korean searches, and visitors whose browsers do not list Korean switch to English as soon as the page loads.

## Scope

In scope:

1. Default language: Korean exported HTML and browser-language detection
2. Share and search: localized page titles and descriptions, preview tags, icons, `robots.txt`, `sitemap.xml`, and church structured data on the homepage
3. Social links: four optional channels in site settings, shown in the footer, on the contact page, and in the structured data
4. Contact topics: general, community, and prayer, with a sharing choice for prayer requests
5. Analytics: Cloudflare Web Analytics on the production site only

Each item ships on its own, in this order.

Out of scope:

- A per-event share preview (needs a share function; later)
- An installable web app and push notifications
- The Naver ownership-verification file (added once the church downloads it from Naver)
- Anonymous prayer requests and a separate prayer inbox
- Pulling Instagram posts into the site

## Default Language

`app/src/pages/_document.tsx` renders `<Html lang="ko">`. `LanguageProvider` starts in Korean, so the exported HTML is Korean.

On first load the language is chosen by `pickInitialLanguage(stored, languages)`:

- A stored `ko` or `en` wins.
- Otherwise, if any entry in `navigator.languages` starts with `ko`, the language is Korean. This covers Korean speakers whose phones list English first.
- Otherwise, if the list has entries, the language is English.
- An empty or missing list keeps Korean.

Only a click on the language toggle stores a choice. An automatic choice is not stored, so detection keeps working until the visitor picks a language. `document.documentElement.lang` keeps following the active language.

## Share and Search

### Page titles and descriptions

Each page’s `meta` becomes `{ title: LocalizedText; description: LocalizedText }`, and `Layout` renders the version for the active language. A shared helper formats the document title:

- Home: “시드니 삼일교회 | Sydney Samil Church” in Korean, “Sydney Samil Church | 시드니 삼일교회” in English
- Other pages: “{page} | 시드니 삼일교회” in Korean, “{page} | Sydney Samil Church” in English

Korean page titles match the navigation labels: 소개, 예배, 이벤트, 설교, 자료·신청, 문의. The event detail page’s own title uses the same helper.

The home description:

- ko: 시드니 펜넌트힐스(Pennant Hills)에 있는 한인교회, 시드니 삼일교회입니다. 함께 예배하고, 삶을 나누며, 믿음 안에서 자랍니다.
- en: Sydney Samil Church is a Korean church in Pennant Hills, Sydney, where we worship, share life, and grow in faith together.

Other public pages get a Korean description alongside their current English one. Descriptions leave out service times, which can change in site settings.

### Preview tags

`Layout` renders on every page:

- `og:type` `website`, `og:site_name` “시드니 삼일교회 Sydney Samil Church”
- `og:title` and `og:description`, the same as the document title and description
- `og:image` `https://sydneysamil.org/og-image.jpg`, with width, height, and localized alt text
- `og:locale` `ko_KR` or `en_AU` for the active language, and the other as `og:locale:alternate`
- `twitter:card` `summary_large_image`

There is no `og:url` and no canonical link. The event detail page identifies the event by query string, which the exported HTML cannot know, and a wrong canonical would merge every event into one URL.

`og-image.jpg` is the church exterior photo (`church-bg.png`) cropped from the top to 1.91:1 (819 × 429) and saved as JPEG.

`SITE_URL` (`https://sydneysamil.org`) lives in one module.

### Icons

`favicon.ico` (16, 32, and 48 px) and `apple-touch-icon.png` (180 px) are generated once from the current church logo, centred on a square filled with the logo’s background colour, and committed to `app/public/`. `_document` links both. Changing the logo in site settings does not change these files; they are replaced by hand if the logo ever changes.

### Search engine files

`app/public/robots.txt`:

```
User-agent: *
Disallow: /manage
Disallow: /settings
Disallow: /profile
Disallow: /login
Sitemap: https://sydneysamil.org/sitemap.xml
```

`app/public/sitemap.xml` lists the seven public pages: `/`, `/about`, `/worship`, `/events`, `/sermons`, `/resources`, `/contact`. Static Web Apps serves real files before the navigation fallback, so both stop returning the homepage HTML.

### Structured data

The homepage renders one `application/ld+json` script built by a pure `churchJsonLd(churchInfo, logoImageUrl)`:

- `@type` `Church`, `name` (Korean church name), `alternateName` (English church name)
- `url` (`SITE_URL`), `telephone`, `email`, `address` (the full address as text)
- `logo` when the logo URL is an absolute https URL
- `sameAs` with the non-empty social links

Values come from site settings, so the exported HTML carries the defaults and the page updates once settings load. Google renders the page and reads the updated values. The JSON is serialized with `<` escaped as `\u003c`, so admin-entered text cannot close the script tag.

## Social Links

### Site settings

`ChurchInfo` gains `social: { instagram, youtube, kakao, facebook }`, each a string that defaults to empty. `parseChurchInfo` trims each value and keeps it only when it is an https URL of at most 300 characters on that channel’s hosts:

- Instagram: `instagram.com`, `www.instagram.com`
- YouTube: `youtube.com`, `www.youtube.com`, `m.youtube.com`
- KakaoTalk Channel: `pf.kakao.com`
- Facebook: `facebook.com`, `www.facebook.com`, `m.facebook.com`

Anything else becomes empty. The rules live in `app/src/lib/social.ts` and are mirrored in `api/shared/social.js`, following the pattern of the newcomer form link.

Site settings → Church info gets a “Social channels / 소셜 채널” panel with four URL fields and the hint “비워 둔 채널은 사이트에 보이지 않습니다. / Empty channels stay hidden.” Placeholders show the expected shape, such as `https://pf.kakao.com/_…/chat`. A non-empty invalid link is a church-tab validation error with code `socialUrl` and the message “해당 서비스의 https 주소를 입력해 주세요.” / “Enter an https link for this service.”, and save is blocked.

`PUT /api/site-settings` rejects the save with status 400 when any non-empty `churchInfo.social` value fails the same rules. No schema change is needed: church info is already stored as JSON.

### Where they appear

- Footer: a “소식 받기 / Follow us” column lists the channels that are set, labelled Instagram, YouTube, 카카오톡 채널 / KakaoTalk Channel, and Facebook. The column is absent when none are set.
- Contact page details: a “메시지로 문의 / Message us” row below email shows the KakaoTalk Channel and Instagram links when set. If an admin enters the channel’s chat URL (`…/chat`), the link opens a one-to-one chat.
- Homepage structured data: `sameAs`.

Every social link opens in a new tab with `rel="noopener noreferrer"`.

## Contact Topics

### Contact page

The form starts with a “문의 종류 / What is this about?” radio group:

- `general`: 일반 문의 / General question
- `community`: 목장 연결 / Find a community
- `prayer`: 기도 요청 / Prayer request

`parseContactTopic` reads `?topic=` once the router is ready, and anything else falls back to `general`. The home next-step links already use `?topic=community` and `?topic=prayer`, so they start working without change.

- `community` shows the message hint “사는 지역, 연령대, 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요.” / “Tell us your area, age group, and which days suit you, and we will suggest a community.”
- `prayer` renames the message field to “기도 제목 / Prayer request” and adds a “공유 범위 / Who may see this?” radio group:
  - `staff` (default): 교역자만 보기 / Pastoral staff only
  - `team`: 중보기도팀과 함께 기도해도 괜찮아요 / OK to share with the prayer team

The selected topic stays selected after a successful send.

### Contact API

`POST /api/contact` accepts `topic` and `share`. An unknown topic becomes `general`. `share` applies only to prayer, and an unknown value becomes `staff`. Recipients do not change.

A pure `buildContactEmail` builds the subject and body:

- general: subject “Contact form: {name}” (unchanged)
- community: subject “[목장 연결] {name}”, body line “Topic: Find a community (목장 연결)”
- prayer: subject “[기도 요청] {name}”, body lines “Topic: Prayer request (기도 요청)” and “Sharing: Pastoral staff only (교역자만 보기)” or “Sharing: OK to share with the prayer team (중보기도팀 공유 가능)”

The church confirms one wording before release: “교역자만 보기” is accurate only if only pastoral staff read the contact inbox.

## Analytics

`_document` adds the Cloudflare Web Analytics beacon when `NEXT_PUBLIC_CF_BEACON_TOKEN` is set at build time, the build is a production build, and the token contains only letters and digits:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…","spa":true}'></script>
```

The deploy step in the Static Web Apps workflow sets `NEXT_PUBLIC_CF_BEACON_TOKEN: ${{ github.ref_name == 'main' && vars.CF_BEACON_TOKEN || '' }}`, so only the production site reports. Local development and the dev preview never load the beacon. The token is public by design, so a repository variable is enough.

The beacon sets no cookies, so no consent banner is needed. It reports page views, referrers, devices, and countries. SPA mode counts client-side navigation as page views.

## Church Checklist

Outside the code:

- Create a free Cloudflare account, add sydneysamil.org to Web Analytics, and store the token in the GitHub repository variable `CF_BEACON_TOKEN`
- Enter the social channel links in site settings
- Confirm who reads the contact inbox, so the prayer sharing wording is accurate
- Register the site in Google Search Console and Naver Search Advisor, and submit the sitemap
- Review the Google Business Profile
- After the first deploy, refresh cached previews with the Kakao sharing debugger and the Facebook sharing debugger

## Failure Handling

If site settings fail to load, social links are empty and nothing social renders; structured data uses the defaults. An invalid stored social link is dropped on parse instead of rendering a broken link. A rejected settings save leaves stored settings unchanged. The contact API treats unknown topic and share values as the defaults. Without a token, no analytics script is rendered. Without `navigator.languages`, the site stays Korean.

## Testing

Unit tests:

- `pickInitialLanguage`: stored value wins; any `ko*` entry gives Korean; a non-Korean list gives English; an empty list keeps Korean
- The title helper for home and other pages in both languages
- `churchJsonLd`: required fields, `sameAs` only for non-empty links, `logo` only for absolute https URLs, `<` escaped in serialized output
- Social parsing keeps valid links, and drops other hosts, http links, and links over 300 characters
- Church info validation flags a non-empty invalid social link and allows empty ones
- The site-settings API rejects an invalid social link and accepts valid ones
- `parseContactTopic` accepts the three topics and defaults anything else
- `buildContactEmail` subjects and bodies for each topic and share value, including unknown values
- `robots.txt` and `sitemap.xml` exist in `app/public` with the expected lines

Export check after `npm run build`: `out/index.html` has `lang="ko"`, Korean body text, the preview tags, and the icon links, and includes the beacon only when the token is set.

Browser check at desktop and mobile widths, in Korean and English: a first visit follows the browser language; the footer and contact page show only the channels that are set; `?topic=prayer` preselects prayer, shows the sharing choice, and the inbox receives “[기도 요청] {name}”.

## Success Criteria

Sending sydneysamil.org in KakaoTalk shows a preview with the church photo and a Korean title and description. A first visit on a Korean phone shows Korean, and on an English-only phone shows English. Social channels an admin enters appear in the footer and on the contact page. “기도 요청” on the homepage opens the form with prayer selected, and the church inbox receives a “[기도 요청] {name}” email. Cloudflare shows visits to the production site.
