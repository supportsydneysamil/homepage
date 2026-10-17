# House Church Page

Korean design: [목장 페이지](./2026-10-16-mokjang-design.ko.md)

## Goal

Sydney Samil Church is a house church (가정교회). A house church runs on three parts: the weekly 목장 (mokjang) gathering, the combined Sunday service, and 삶공부 (life classes). The site menu only has the service. The word 목장 already appears in the home community pillar, the pastor introduction, a next-step card, the contact form’s “목장 연결” topic, and the newcomer band, but nothing explains what a 목장 is. A first-time visitor has to ask to be connected without knowing it means sharing dinner in someone’s home.

This work adds 목장 to the top menu, plus a page that explains it, a list of the church’s 목장, and a detail page for each one.

## Decision

Nearly every house church site we looked at has its own house church menu: [Houston Seoul Baptist Church](https://www.seoulbaptist.org/), [Sydney New Life Church](https://newlifesydney.ch360.org/housechurch) (Thornleigh, the same 2120 area), [Australia Korean Baptist Church](https://akbc.org.au/menu03_01), and [Dawoon Community Church](https://www.downchurch.com/bbs/page.php?hid=church_introduce). Most of those pages explain principles such as restoring the New Testament church and the “three axes and four pillars”, which suits members and visiting pastors. Few answer what a newcomer actually asks: what happens at a gathering, whether to bring food, and whether non-Christians are welcome. This page concentrates on those questions.

Some churches, such as [Bukbu Church](https://www.bukbu.or.kr/page_bRnJ46) and [Livingway Church](http://livingway.or.kr/aboutmokjang), publish their 목장 list. A list changes with every split and goes stale without upkeep; most of Livingway’s entries stopped in 2018. So editors maintain the list from content management, and detail pages look complete with only the basic fields filled in.

There is no filterable “find a group” tool of the kind common at English-speaking churches. In a house church, staff connect people to a suitable 목장, and there are fewer than ten of them.

목장 meet in private homes, so home addresses, personal phone numbers, and 목자 (shepherd) contact details are never published. 목자 and 목녀 names are shown only to signed-in members.

The layout was chosen from three mockups (one page / two pages / one page with detail pages): the one-page section order, with small tiles that open detail pages.

## Scope

In scope:

1. “목장 / House Church” in the top menu and footer
2. The page `/mokjang`: first screen, an evening at a 목장, welcome note, 목장 tiles, common questions, life classes, connection request
3. Detail pages at `/mokjang/detail?slug=…`
4. 목장 data, API, and photos
5. A “목장” tab in content management (editors)
6. A “목장” group in Site settings → Copy (admins)
7. Links from the home next-step card and the contact form, and the sitemap

Out of scope:

- Search and filters for 목장
- 목자 editing their own 목장
- Grouping by 초원 (groups of 목장) and manual ordering
- A 목장 news board
- Reordering photos (only choosing the cover is supported)

## Screens

### House church page

`app/src/pages/mokjang/index.tsx`, top to bottom:

1. **First screen**: `PageHero` with kicker, title, and lead. Buttons: “목장 연결 요청” (`/contact?topic=community`) and “목장 둘러보기” (`#mokjang-list` on the same page).
2. **An evening at a 목장**: four step cards, each with a time, a name, and a description.
3. **Welcome note**: title and body in a band with a gold left rule.
4. **목장 tiles** (`id="mokjang-list"`): title, intro, and the tiles. Four columns on desktop, three on tablet, two on phones. Each whole tile links to its detail page. A tile shows only the cover photo (16:9), the 목장 name, “suburb · day time-of-day”, and an audience chip.
5. **Common questions**: a `<details>` list. Items with an empty question are not rendered.
6. **Life classes**: title and two cards. Cards with an empty name are not rendered.
7. **Connection request**: a dark green band with title, body, and “연결 요청 남기기” (`/contact?topic=community`).

When no 목장 is published or the list fails to load, the tile area shows “목장 소개를 준비하고 있어요. 연결 요청을 남겨 주시면 안내해 드릴게요.” with a link to the connection request. The other sections still render.

### Detail page

`app/src/pages/mokjang/detail.tsx`. Like event details, it finds the 목장 by the `slug` query value. The site is a static export, so addresses such as `/mokjang/chiangmai` are not used.

- “← 목장 목록” (`/mokjang#mokjang-list`)
- Cover photo (16:6). The cover and gallery use the full page width (1200px); the header, info table, members box, story, and contact box are 880px wide.
- Kicker “목장”, the 목장 name, and the one-line introduction
- Info table: meeting (day time · suburb), audience, language, children welcome (only when ticked), supported mission field (only when set)
- Members-only box: “교인에게만 보여요” with the 목자 name and the 목녀·목부 name. Not rendered when the names are absent from the response.
- 목장 story: only when set
- Photo gallery: only when there are photos after the cover. Reuses `EventGallery` for the enlarged view.
- “이 목장이 궁금하신가요?” and “이 목장 문의” (`/contact?topic=community&mokjang={slug}`)

The document title is the 목장 name, and the description is the one-line introduction, falling back to the house church page description. When the 목장 does not exist or is a draft, `EmptyState` shows “목장을 찾을 수 없습니다” with a link back to the list.

### Default image

A 목장 without photos shows the first letter of its name, large, on the site’s pale green diagonal pattern, both on its tile and its detail page. This is CSS, not an image file.

### Display rules

Pure functions in `app/src/lib/mokjang.ts`:

- Day: `mon`…`sun` → 월…일 / Mon…Sun; on the detail page 월요일 / Monday
- Time of day: before 12:00 오전 / morning, before 17:00 오후 / afternoon, otherwise 저녁 / evening
- Tile: “Epping · 금 저녁” / “Epping · Fri evening”
- Detail: “금요일 저녁 7:00 · Epping” / “Friday 7:00 PM · Epping”
- Audience: `family` 부부·자녀 가정 / Couples & families, `young` 청년·싱글 / Young adults & singles, `senior` 시니어 / Seniors, `all` 누구나 / Everyone
- Language: `ko` 한국어 / Korean, `en` 영어 / English, `both` 한국어·영어 / Korean & English
- Text: in English, an empty English field falls back to the Korean
- Order: Korean name, 가나다 order (`localeCompare(…, 'ko')`)

## Data

Add two tables to `SCHEMA_SQL` in `api/shared/db.js`.

`dbo.Mokjangs`:

| Column | Type | Rule |
| --- | --- | --- |
| `Id` | `UNIQUEIDENTIFIER` | Default `NEWID()` |
| `Slug` | `NVARCHAR(80)` | Required, unique, lowercase words and hyphens |
| `NameKo` / `NameEn` | `NVARCHAR(60)` | Korean required, English optional |
| `TaglineKo` / `TaglineEn` | `NVARCHAR(120)` | Optional |
| `Suburb` | `NVARCHAR(60)` | Required |
| `MeetingDay` | `NVARCHAR(3)` | Required, `mon`…`sun` |
| `MeetingTime` | `NVARCHAR(5)` | Required, `HH:MM` |
| `Audience` | `NVARCHAR(10)` | `family` / `young` / `senior` / `all`, default `all` |
| `MeetingLanguage` | `NVARCHAR(4)` | `ko` / `en` / `both`, default `ko` |
| `KidsWelcome` | `BIT` | Default 0 |
| `MissionKo` / `MissionEn` | `NVARCHAR(120)` | Optional |
| `StoryKo` / `StoryEn` | `NVARCHAR(2000)` | Optional |
| `ShepherdName` / `PartnerName` | `NVARCHAR(60)` | Optional, members only |
| `IsPublished` | `BIT` | Default 1 |
| `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt` | | As in other tables |

`dbo.MokjangImages` has the same shape as `dbo.EventImages`. `MokjangId` references `dbo.Mokjangs(Id)` with `ON DELETE CASCADE`. The cover is the photo with the lowest `SortOrder`. It starts as the first photo uploaded; when an editor picks another photo, `PUT` carries `coverImageId` and the API sets that photo’s `SortOrder` to one below the lowest in that 목장. Photos of other 목장 are never touched.

There are no columns for a home address or phone number.

## API

### `/api/mokjang`

`api/mokjang/index.js`, structured like the events API.

`GET`:

- With no query it returns the list; with `slug` or `id` it returns one 목장. Both come back as `{ mokjangs: [...] }`.
- Editors also receive drafts. Everyone else receives published 목장 only.
- With the `member` role, the response includes `shepherdName` and `partnerName`. Without it, both keys are omitted entirely. Admins and editors also hold `member` through role expansion.
- Each list entry carries a single `coverImage` URL because the tiles show photos, unlike the events list. A single 목장 carries the full `images` list.
- Photo URLs are `/api/files/download/{image id}`.

`POST`, `PUT`, and `DELETE` are for editors only.

- `validateMokjangInput` enforces the rules and lengths in the table above. Failures return 400 with Korean and English errors.
- An empty `Slug` is built from the English name. With no English name either, it returns 400 “주소 이름을 영어 소문자로 입력해 주세요.”
- A unique constraint violation returns 409 “같은 주소 이름의 목장이 이미 있습니다.”
- Photo paths must start with `mokjang/` and contain no `..`.
- `DELETE` reads the photo paths first, deletes the 목장, then deletes the photo files from storage.

### `/api/mokjang/images`

`api/mokjang-images/index.js`, the same as `api/event-images`. An editor’s `DELETE ?id=` removes one photo row and its stored file.

### Photo storage and access

- Add `mokjang` to `ALLOWED_FOLDERS` in `api/shared/blob.js`. It uses the private container.
- Add `dbo.MokjangImages` to the `api/files-download` lookup with `'public'` visibility.
- `staticwebapp.config.json`:
  - `/api/mokjang/images`: `editor`
  - `/api/mokjang` `GET`: `anonymous`, `authenticated`
  - `/api/mokjang` `POST`, `PUT`, `DELETE`: `editor`

## Management

### Content management → 목장 (editors)

Add `mokjang` to `MANAGE_TABS`, labelled “목장 / House churches”. `app/src/pages/manage/index.tsx` is already 1,268 lines, so the tab lives in `app/src/components/manage/MokjangManager.tsx` and the page renders it when the tab is selected. The list and form use the same `ManageToolbar`, `ManageList`, and `ContentForm` as the events tab. Photos upload the same way as event photos: request an upload URL, upload, then send the paths on save.

Form groups:

1. Basics: 목장 name (ko/en), slug, one-line introduction (ko/en), suburb, meeting day, meeting time
2. Gathering: audience, language, children welcome, supported mission field (ko/en)
3. 목장 story (ko/en)
4. Photos: upload several, delete one at a time with the × on each photo, select a photo to make it the cover (photos keep their place; the cover gets an outline and a “대표” tag; applied on save, Cancel keeps the current cover), with the note “목장 식구들이 공개에 동의한 사진만 올려 주세요. 아이 얼굴은 특히 주의해 주세요. 처음 올린 사진이 대표 사진이 되고, 저장한 뒤 사진 목록에서 바꿀 수 있습니다.”
5. Members only: 목자, 목녀·목부, with the note “로그인한 교인에게만 보입니다.”
6. Published / Draft

In the list, drafts carry a “초안” badge and each row shows the suburb and meeting day.

### Site settings → Copy → 목장 (admins)

Add a `mokjang` group to `SiteCopy` and a “목장 / House Church” section to `SiteCopyFields`. Every field is Korean and English, with the same length limits and validation as other copy fields.

- `hero`: `kicker`, `title`, `lead`, `ctaConnect`, `ctaBrowse`
- `evening`: `kicker`, `title`, four `steps` (`time`, `title`, `body`)
- `welcome`: `kicker`, `title`, `body`
- `list`: `kicker`, `title`, `intro`, `empty`
- `faq`: `kicker`, five `items` (`question`, `answer`)
- `study`: `kicker`, `title`, two `items` (`title`, `body`)
- `cta`: `kicker`, `title`, `body`, `button`

The number of items is fixed. As with the existing `parseValues`, saved arrays are read against the default item count. An empty question or class name removes that item from the page.

Add `mokjang` (“목장” / “House Church”) to `footer` and to the footer “메뉴명” fields.

### Default copy

The Korean default copy, including the step table and all five questions with answers, is listed in full in the [Korean design](./2026-10-16-mokjang-design.ko.md#기본-문구). The English defaults are:

- Hero: “House Church”; “A small church\nthat meets at home”; “Each week, six to twelve people gather in a home to share a meal, talk about their week, and pray for one another. Sydney Samil Church is a house church made up of these gatherings.”; “Ask to join a house church”; “Browse house churches”
- Evening: “An evening together”; “What a gathering looks like”; steps “Dinner together / A home-cooked meal, with hosts taking turns” (7:00), “Sharing life / What we were thankful for and what was hard this week” (8:00), “A short Bible time / Reflecting on Sunday’s message together” (8:40), “Praying for each other / Sharing prayer requests and praying together” (9:00)
- Welcome: “Everyone is welcome”; “You do not need to have faith figured out, or to have been to church before.”; “A house church is a table where you are welcomed as you are, without judgement. Many people who are still exploring faith are part of one.”
- List: “Our house churches”; “Find one near you”; “Select a house church to see when it meets, who it is for, and its language.”; empty “House church profiles are on the way. Leave a request and we will connect you.”
- Questions (“Common questions”):
  1. Do I need to bring food? — Not on your first visit. Members take turns preparing the meal.
  2. Can I bring my children? — Yes. House churches that suit families with children are marked in their details.
  3. Can I come if I am not a Christian? — Of course. People who are still exploring faith are part of our house churches, and nothing is forced on anyone.
  4. How is a house church chosen for me? — Leave a request and we will ask about your area, the days that suit you, and your family, then suggest one. You are welcome to visit a few times before deciding.
  5. Do I have to go every week? — House churches meet weekly, but come as your schedule allows.
- Life classes: “Life classes”; “Growing through life classes”; “Life Bible study / Sunday 2:30 PM · The first course on the foundations of faith”; “More life classes / New classes open each term. Watch Events for dates.”
- Connection request: “Get connected”; “Not sure which one fits?”; “Tell us your area and which days suit you, and we will suggest a house church.”; “Ask to be connected”

The Life Bible study time also appears in the church info gatherings. When it changes, update both places.

The detail page’s info table labels, “교인에게만 보여요”, “이 목장이 궁금하신가요?”, “이 목장 문의”, and “← 목장 목록” are fixed strings in code, as on the event detail page.

## Site connections

- **Top menu**: in `Header`’s `navItems`, after Worship, add `{ href: '/mokjang', labelKo: '목장', labelEn: 'House Church' }`. Check that the English menu, the Operations menu, and the sign-in button fit on one line at 961px and wider. If they do not, raise the hamburger breakpoint (currently 960px) to the smallest width that fits.
- **Footer “Explore”**: About, Worship, House Church, Sermons.
- **First home next-step card**: change its link to `/mokjang`.
  - Title: 목장과 연결되고 싶나요? / Looking for community? (unchanged)
  - Description: 목장이 어떤 곳인지 살펴보고, 가까운 목장을 찾아보세요. / See what a house church is like and find one near you.
  - Button: 목장 알아보기 / Explore house churches
  - Saved copy is matched to cards by link, so any copy an admin saved for this card falls back to the new defaults. This is the existing rule that a retired card’s copy drops out.
- **Contact form**: opened with `?topic=community&mokjang={slug}`, it loads that 목장. If found and the message box is still empty, it fills “관심 있는 목장: {name}” / “House church I am interested in: {name}” followed by a blank line. If not found, nothing is filled. The email subject stays “[목장 연결] {name}”, and the 목장 name is in the body. The message goes to the church inbox, not to the 목자.
- **Sitemap**: add `https://sydneysamil.org/mokjang` after `/worship`. Detail pages use query addresses and are left out, as with events.
- **Page meta**: title “목장” / “House Church”. Description “시드니 삼일교회는 가정교회입니다. 가정에서 매주 모이는 목장을 소개하고, 가까운 목장을 안내합니다.” / “Sydney Samil Church is a house church. Meet the small communities that gather in homes each week, and find one near you.”

## Failure

- If the 목장 list fails to load, the tile area shows the empty message and the connection link, and the copy sections still render.
- If site settings fail to load, the default copy is used.
- On the detail page, a missing or draft 목장 shows the empty state.
- A missing photo URL or a photo that fails to load shows the default image.
- Invalid input is rejected with 400 and a duplicate slug with 409; the stored 목장 is unchanged.
- If deleting a stored photo file fails, the 목장 and photo rows stay deleted and the error is logged, as with event photos.
- An unknown `mokjang` value on the contact form is ignored.

## Verification

API unit tests (`node --test`):

- `validateMokjangInput`: required fields, day, time, audience, and language values, lengths, slug rules and building it from the English name, photo paths
- Response assembly: without `member`, the `shepherdName` and `partnerName` keys are absent; with `member`, they are present
- Visitors do not receive drafts; editors do
- The list carries one `coverImage`; a single 목장 carries all `images`
- `files-download` serves 목장 photos without sign-in
- Only editors can delete through `mokjang-images`

Front-end unit tests:

- Day, time of day, tile and detail strings, audience and language labels (ko/en)
- English falls back to Korean when empty
- 가나다 ordering
- `parseSiteCopy`: 목장 defaults, empty questions and class cards hidden, one edited field keeps the rest
- The first home next-step card links to `/mokjang`
- The contact form prefill string
- `check-public.mjs`: the sitemap includes `/mokjang`

Browser checks at desktop and phone widths, in Korean and English:

- All seven sections of the house church page, and “목장 둘러보기” scrolling to the tiles
- Signed out, the detail page has no 목자 box; signed in as a member, it does
- The default image for a 목장 without photos
- The English menu fits on one line on wide screens
- “이 목장 문의” opens the contact form with the 목장 name filled in
- An editor creates a 목장, uploads photos, saves it as a draft, publishes it, and deletes it

## Church tasks

- Enter each 목장’s introduction, suburb, meeting time, photos, and 목자 names. Get consent from 목장 members before publishing photos.
- Check and refine the default copy, especially the evening times and the answer to “목장은 어떻게 정해지나요?”, so they match what the church actually does.
- Let 목자 and 목녀 know their names are shown only to signed-in members.

## Done when

A first-time visitor can choose 목장 in the top menu, read what a 목장 is and how an evening goes, open the tile of a nearby 목장 to see when it meets and who it is for, and send a connection request from “이 목장 문의” with the 목장 name already filled in. Signed out, no 목자 name appears anywhere; members see it on the detail page. Editors can add and update a 목장 after a split from content management.
