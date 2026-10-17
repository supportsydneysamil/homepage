# 목장 페이지

영어 설계: [House Church Page](./2026-10-16-mokjang-design.md)

## 목표

시드니 삼일교회는 가정교회다. 가정교회는 목장 모임, 주일 연합예배, 삶공부의 세 축으로 움직이는데, 사이트 메뉴에는 예배만 있다. ‘목장’이라는 말은 홈의 공동체 소개, 담임목사 소개, 다음 걸음 카드, 문의 폼의 ‘목장 연결’, 새가족 안내에 이미 나오지만 목장이 무엇인지 설명하는 곳은 없다. 처음 온 사람은 그것이 누군가의 집에서 함께 저녁을 먹는 모임이라는 것도 모른 채 연결 요청을 해야 한다.

이 작업은 상단 메뉴에 ‘목장’을 더하고, 목장을 설명하는 페이지와 목장 목록, 목장별 상세 페이지를 만든다.

## 판단

조사한 가정교회 사이트는 거의 모두 가정교회 메뉴를 따로 둔다. [휴스턴 서울교회](https://www.seoulbaptist.org/), [시드니새생명교회](https://newlifesydney.ch360.org/housechurch)(Thornleigh, 같은 2120 지역), [시드니성서침례교회](https://akbc.org.au/menu03_01), [다운공동체교회](https://www.downchurch.com/bbs/page.php?hid=church_introduce)가 그렇다. 하지만 대부분 신약교회 회복, 세 축과 네 기둥 같은 원리를 설명하는 글이라 교인이나 연수 오는 목회자에게 맞춰져 있다. 모임에서 무엇을 하는지, 음식을 가져가야 하는지, 믿지 않아도 가도 되는지처럼 처음 온 사람이 실제로 묻는 것에 답하는 곳은 드물다. 이 페이지는 그 질문에 답하는 데 집중한다.

[북부교회](https://www.bukbu.or.kr/page_bRnJ46)나 [리빙웨이교회](http://livingway.or.kr/aboutmokjang)처럼 목장 목록을 공개하는 교회도 있다. 목록은 분가 때마다 바뀌어서 관리하지 않으면 금방 낡는다. 리빙웨이교회 목록은 대부분 2018년 글에서 멈춰 있다. 그래서 목록은 편집자가 자료 관리에서 쉽게 고칠 수 있게 하고, 상세 페이지는 기본 정보만 있어도 비어 보이지 않게 만든다.

영어권 교회에서 흔한 필터형 ‘그룹 찾기’는 쓰지 않는다. 가정교회는 교역자가 맞는 목장을 연결해 주는 방식이고, 목장도 10개 미만이다.

목장은 가정집에서 모이므로 집 주소, 개인 전화번호, 목자 연락처는 공개하지 않는다. 목자·목녀 이름은 로그인한 교인에게만 보인다.

화면 구성은 목업 세 가지(한 페이지 / 두 페이지 / 한 페이지와 상세 페이지) 가운데, 한 페이지 순서에 작은 타일과 상세 페이지를 합친 안으로 정했다.

## 범위

포함:

1. 상단 메뉴와 푸터의 ‘목장 / House Church’
2. 목장 페이지 `/mokjang`: 첫 화면, 목장의 한 저녁, 환영 안내, 목장 타일, 자주 묻는 질문, 삶공부, 연결 요청
3. 목장 상세 페이지 `/mokjang/detail?slug=…`
4. 목장 데이터와 API, 목장 사진
5. 자료 관리의 ‘목장’ 탭 (편집자)
6. 사이트 설정 → 문구의 ‘목장’ 묶음 (관리자)
7. 홈 다음 걸음 카드와 문의 폼 연결, 사이트맵

포함하지 않음:

- 목장 검색과 필터
- 목자가 자기 목장을 직접 고치는 기능
- 초원별 묶음과 순서 지정
- 목장 소식 게시판
- 사진 순서 바꾸기(대표 사진 고르기만 지원)

## 화면

### 목장 페이지

`app/src/pages/mokjang/index.tsx`. 위에서 아래로:

1. **첫 화면**: `PageHero`에 작은 제목, 큰 제목, 소개 문장. 버튼은 ‘목장 연결 요청’(`/contact?topic=community`)과 ‘목장 둘러보기’(같은 페이지의 `#mokjang-list`).
2. **목장의 한 저녁**: 네 단계 카드. 각 카드는 시간, 이름, 설명.
3. **환영 안내**: 제목과 본문. 금색 왼쪽 선이 있는 띠.
4. **목장 타일** (`id="mokjang-list"`): 제목, 안내 문장, 타일 목록. 데스크톱 4열, 태블릿 3열, 휴대폰 2열. 타일 전체가 상세 페이지 링크다. 타일에는 대표 사진(16:9), 목장 이름, ‘지역 · 요일 시간대’, 대상 칩만 둔다.
5. **자주 묻는 질문**: `<details>` 목록. 질문이 빈 칸은 그리지 않는다.
6. **삶공부**: 제목과 카드 두 개. 카드 이름이 빈 칸은 그리지 않는다.
7. **연결 요청**: 진한 초록 띠. 제목, 본문, ‘연결 요청 남기기’(`/contact?topic=community`).

공개된 목장이 없거나 목록을 불러오지 못하면 타일 자리에 “목장 소개를 준비하고 있어요. 연결 요청을 남겨 주시면 안내해 드릴게요.”와 연결 요청 링크를 보여 준다. 나머지 섹션은 그대로 그린다.

### 목장 상세 페이지

`app/src/pages/mokjang/detail.tsx`. 행사 상세와 같이 주소의 `slug`로 목장을 찾는다. 사이트가 정적으로 내보내지므로 `/mokjang/치앙마이` 같은 주소는 쓰지 않는다.

- ‘← 목장 목록’(`/mokjang#mokjang-list`)
- 대표 사진(16:6). 대표 사진과 갤러리는 페이지 전체 폭(1200px)을 쓰고, 제목·정보 표·목자 상자·이야기·문의 상자는 880px 폭이다.
- 작은 제목 ‘목장’, 목장 이름, 한 줄 소개
- 정보 표: 모임(요일 시간 · 지역), 대상, 언어, 아이 동반(체크했을 때만), 후원 선교지(있을 때만)
- 교인에게만 보이는 상자: ‘교인에게만 보여요’와 목자 이름, 목녀·목부 이름. 이름이 응답에 없으면 상자를 그리지 않는다.
- 목장 이야기: 있을 때만
- 사진 갤러리: 대표 사진 뒤의 사진이 있을 때만. `EventGallery`를 그대로 써서 크게 보기를 지원한다.
- ‘이 목장이 궁금하신가요?’와 ‘이 목장 문의’(`/contact?topic=community&mokjang={slug}`)

문서 제목은 목장 이름, 설명은 한 줄 소개(없으면 목장 페이지 설명)다. 목장이 없거나 초안이면 `EmptyState`로 “목장을 찾을 수 없습니다”와 목장 목록 링크를 보여 준다.

### 기본 이미지

사진이 없는 목장은 사이트의 연한 초록 사선 무늬 위에 목장 이름 첫 글자를 크게 쓴 이미지를 타일과 상세에 쓴다. 이미지 파일이 아니라 CSS다.

### 표시 규칙

`app/src/lib/mokjang.ts`의 순수 함수가 정한다.

- 요일: `mon`…`sun` → 월…일 / Mon…Sun, 상세에서는 월요일 / Monday
- 시간대: 12:00 전은 오전 / morning, 17:00 전은 오후 / afternoon, 그 뒤는 저녁 / evening
- 타일: “Epping · 금 저녁” / “Epping · Fri evening”
- 상세: “금요일 저녁 7:00 · Epping” / “Friday 7:00 PM · Epping”
- 대상: `family` 부부·자녀 가정 / Couples & families, `young` 청년·싱글 / Young adults & singles, `senior` 시니어 / Seniors, `all` 누구나 / Everyone
- 언어: `ko` 한국어 / Korean, `en` 영어 / English, `both` 한국어·영어 / Korean & English
- 글: 영어 화면에서 영어 칸이 비어 있으면 한국어를 쓴다.
- 정렬: 한국어 이름의 가나다순 (`localeCompare(…, 'ko')`)

## 데이터

`api/shared/db.js`의 `SCHEMA_SQL`에 두 표를 더한다.

`dbo.Mokjangs`:

| 열 | 형식 | 규칙 |
| --- | --- | --- |
| `Id` | `UNIQUEIDENTIFIER` | 기본값 `NEWID()` |
| `Slug` | `NVARCHAR(80)` | 필수, 고유, 소문자와 하이픈 |
| `NameKo` / `NameEn` | `NVARCHAR(60)` | 한국어 필수, 영어 선택 |
| `TaglineKo` / `TaglineEn` | `NVARCHAR(120)` | 선택 |
| `Suburb` | `NVARCHAR(60)` | 필수 |
| `MeetingDay` | `NVARCHAR(3)` | 필수, `mon`…`sun` |
| `MeetingTime` | `NVARCHAR(5)` | 필수, `HH:MM` |
| `Audience` | `NVARCHAR(10)` | `family` / `young` / `senior` / `all`, 기본 `all` |
| `MeetingLanguage` | `NVARCHAR(4)` | `ko` / `en` / `both`, 기본 `ko` |
| `KidsWelcome` | `BIT` | 기본 0 |
| `MissionKo` / `MissionEn` | `NVARCHAR(120)` | 선택 |
| `StoryKo` / `StoryEn` | `NVARCHAR(2000)` | 선택 |
| `ShepherdName` / `PartnerName` | `NVARCHAR(60)` | 선택, 교인에게만 |
| `IsPublished` | `BIT` | 기본 1 |
| `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt` | | 다른 표와 같음 |

`dbo.MokjangImages`는 `dbo.EventImages`와 같은 모양이다. `MokjangId`는 `dbo.Mokjangs(Id)`를 참조하고 `ON DELETE CASCADE`다. 대표 사진은 `SortOrder`가 가장 작은 사진이다. 처음에는 가장 먼저 올린 사진이고, 편집자가 다른 사진을 고르면 `PUT`의 `coverImageId`로 그 사진의 `SortOrder`를 그 목장에서 가장 작은 값보다 하나 작게 바꾼다. 다른 목장의 사진은 바꾸지 않는다.

집 주소와 전화번호 열은 만들지 않는다.

## API

### `/api/mokjang`

`api/mokjang/index.js`. 행사 API와 같은 구조다.

`GET`:

- 쿼리가 없으면 목록, `slug` 또는 `id`가 있으면 한 목장을 `{ mokjangs: [...] }`로 돌려준다.
- 편집자는 초안도 받는다. 그 밖에는 공개된 목장만 받는다.
- `member` 역할이 있으면 `shepherdName`과 `partnerName`을 넣는다. 없으면 두 키를 아예 넣지 않는다. 관리자와 편집자는 역할 확장으로 `member`도 가진다.
- 목록의 각 목장에는 대표 사진 주소 `coverImage` 하나만 넣는다. 타일이 사진을 보여 줘야 하기 때문이다(행사 목록과 다르다). 한 목장 조회는 `images` 전체를 넣는다.
- 사진 주소는 `/api/files/download/{이미지 Id}`다.

`POST`, `PUT`, `DELETE`는 편집자만 쓴다.

- 검증 함수 `validateMokjangInput`이 위 표의 규칙과 길이를 지킨다. 실패하면 400과 한·영 오류.
- `Slug`는 비어 있으면 영어 이름에서 만든다. 영어 이름도 없으면 400 “주소 이름을 영어 소문자로 입력해 주세요.”
- 고유 제약에 걸리면 409 “같은 주소 이름의 목장이 이미 있습니다.”
- 사진 경로는 `mokjang/`으로 시작해야 하고 `..`이 없어야 한다.
- `DELETE`는 사진 경로를 먼저 읽고, 목장을 지운 뒤, 저장소의 사진 파일도 지운다.

### `/api/mokjang/images`

`api/mokjang-images/index.js`. `api/event-images`와 같다. 편집자가 `DELETE ?id=`로 사진 하나를 지우면 표의 행을 지우고 저장소 파일도 지운다.

### 사진 저장과 공개

- `api/shared/blob.js`의 `ALLOWED_FOLDERS`에 `mokjang`을 더한다. 비공개 컨테이너다.
- `api/files-download`의 조회에 `dbo.MokjangImages`를 `'public'` 공개 범위로 더한다.
- `staticwebapp.config.json`:
  - `/api/mokjang/images`: `editor`
  - `/api/mokjang` `GET`: `anonymous`, `authenticated`
  - `/api/mokjang` `POST`, `PUT`, `DELETE`: `editor`

## 관리

### 자료 관리 → 목장 (편집자)

`MANAGE_TABS`에 `mokjang`을 더하고, 탭 이름은 ‘목장 / House churches’다. `app/src/pages/manage/index.tsx`가 이미 1,268줄이라, 목장 탭은 `app/src/components/manage/MokjangManager.tsx`에 따로 두고 페이지는 탭을 고를 때 이 컴포넌트를 그린다. 목록과 입력 화면은 행사 탭과 같은 `ManageToolbar`, `ManageList`, `ContentForm`을 쓰고, 사진은 행사 사진과 같은 방식(업로드 주소 받기 → 올리기 → 저장할 때 경로 보내기)으로 올린다.

입력 화면 묶음:

1. 기본 정보: 목장 이름(한/영), 주소 이름(slug), 한 줄 소개(한/영), 지역, 모임 요일, 모임 시간
2. 모임 정보: 대상, 모임 언어, 아이 동반, 후원 선교지(한/영)
3. 목장 이야기(한/영)
4. 사진: 여러 장 올리기, 사진 모서리의 ×로 하나씩 지우기, 사진을 눌러 대표 사진 고르기(사진은 자리를 옮기지 않고 대표 사진에 테두리와 ‘대표’ 표시, 저장할 때 반영, 취소하면 그대로), 안내 “목장 식구들이 공개에 동의한 사진만 올려 주세요. 아이 얼굴은 특히 주의해 주세요. 처음 올린 사진이 대표 사진이 되고, 저장한 뒤 사진 목록에서 바꿀 수 있습니다.”
5. 교인에게만 보이는 정보: 목자, 목녀·목부, 안내 “로그인한 교인에게만 보입니다.”
6. 공개 / 초안

목록에서 초안에는 ‘초안’ 표시가 붙고, 각 줄에는 지역과 모임 요일을 함께 보여 준다.

### 사이트 설정 → 문구 → 목장 (관리자)

`SiteCopy`에 `mokjang` 묶음을 더하고 `SiteCopyFields`에 ‘목장 / House Church’ 섹션을 둔다. 모든 칸은 한/영이고, 길이 제한과 검증은 다른 문구 칸과 같다.

- `hero`: `kicker`, `title`, `lead`, `ctaConnect`, `ctaBrowse`
- `evening`: `kicker`, `title`, `steps` 4칸(`time`, `title`, `body`)
- `welcome`: `kicker`, `title`, `body`
- `list`: `kicker`, `title`, `intro`, `empty`
- `faq`: `kicker`, `items` 5칸(`question`, `answer`)
- `study`: `kicker`, `title`, `items` 2칸(`title`, `body`)
- `cta`: `kicker`, `title`, `body`, `button`

칸 수는 고정이다. 기존 `parseValues`처럼 저장된 배열을 기본값의 칸 수에 맞춰 읽는다. 질문이나 삶공부 이름을 비우면 그 칸은 화면에서 빠진다.

`footer`에 `mokjang`(‘목장’ / ‘House Church’)을 더하고 푸터 ‘메뉴명’ 칸에 넣는다.

### 기본 문구

`hero`:

- kicker: House Church · 목장 / House Church
- title: 한 주에 한 번,\n집에서 만나는 작은 교회 / A small church\nthat meets at home
- lead: 6~12명이 가정에 모여 밥을 먹고, 한 주의 삶을 나누고, 서로를 위해 기도합니다. 시드니 삼일교회는 목장으로 이루어진 가정교회입니다. / Each week, six to twelve people gather in a home to share a meal, talk about their week, and pray for one another. Sydney Samil Church is a house church made up of these gatherings.
- ctaConnect: 목장 연결 요청 / Ask to join a house church
- ctaBrowse: 목장 둘러보기 / Browse house churches

`evening`: 목장의 한 저녁 / An evening together, 이렇게 모여요 / What a gathering looks like

| time | title | body |
| --- | --- | --- |
| 7:00 | 함께 식사 / Dinner together | 돌아가며 준비하는 집밥 / A home-cooked meal, with hosts taking turns |
| 8:00 | 삶 나눔 / Sharing life | 한 주 동안 감사했던 일과 힘들었던 일 / What we were thankful for and what was hard this week |
| 8:40 | 짧은 말씀 / A short Bible time | 주일 설교를 함께 되새기기 / Reflecting on Sunday’s message together |
| 9:00 | 서로를 위한 기도 / Praying for each other | 기도 제목을 나누고 함께 기도 / Sharing prayer requests and praying together |

`welcome`:

- kicker: 누구나 환영해요 / Everyone is welcome
- title: 아직 신앙이 없어도, 교회가 처음이어도 괜찮아요. / You do not need to have faith figured out, or to have been to church before.
- body: 목장은 평가받지 않고 있는 모습 그대로 환영받는 밥상 공동체입니다. 아직 예수님을 모르는 분도 많이 함께하고 계세요. / A house church is a table where you are welcomed as you are, without judgement. Many people who are still exploring faith are part of one.

`list`:

- kicker: 우리 목장들 / Our house churches
- title: 가까운 목장을 둘러보세요 / Find one near you
- intro: 목장을 누르면 모임 시간, 대상, 사용 언어를 자세히 볼 수 있어요. / Select a house church to see when it meets, who it is for, and its language.
- empty: 목장 소개를 준비하고 있어요. 연결 요청을 남겨 주시면 안내해 드릴게요. / House church profiles are on the way. Leave a request and we will connect you.

`faq`: 자주 묻는 질문 / Common questions

1. 음식을 가져가야 하나요? / Do I need to bring food? — 처음에는 빈손으로 오셔도 됩니다. 식사는 목장 식구들이 돌아가며 준비해요. / Not on your first visit. Members take turns preparing the meal.
2. 아이와 함께 가도 되나요? / Can I bring my children? — 네. 아이와 함께 오기 좋은 목장은 목장 정보에 표시해 두었어요. / Yes. House churches that suit families with children are marked in their details.
3. 믿지 않는데 가도 될까요? / Can I come if I am not a Christian? — 물론입니다. 신앙을 알아 가는 중인 분들도 함께하고, 아무것도 강요하지 않아요. / Of course. People who are still exploring faith are part of our house churches, and nothing is forced on anyone.
4. 목장은 어떻게 정해지나요? / How is a house church chosen for me? — 연결 요청을 남겨 주시면 사는 지역과 편한 요일, 가족 상황을 듣고 맞는 목장을 안내해 드려요. 몇 번 참석해 보고 정하셔도 괜찮아요. / Leave a request and we will ask about your area, the days that suit you, and your family, then suggest one. You are welcome to visit a few times before deciding.
5. 꼭 매주 가야 하나요? / Do I have to go every week? — 목장은 매주 모이지만, 형편에 맞게 오시면 됩니다. / House churches meet weekly, but come as your schedule allows.

`study`: 삶공부 / Life classes, 목장과 함께 배우는 삶공부 / Growing through life classes

- 생명의 삶 / Life Bible study — 주일 오후 2:30 · 신앙의 기초를 배우는 첫 과정 / Sunday 2:30 PM · The first course on the foundations of faith
- 그 밖의 삶공부 / More life classes — 학기마다 열려요. 일정은 행사와 소식에서 안내합니다. / New classes open each term. Watch Events for dates.

생명의 삶 시간은 교회 정보의 모임 안내에도 있다. 시간이 바뀌면 두 곳을 함께 고친다.

`cta`:

- kicker: 연결 요청 / Get connected
- title: 어느 목장이 맞을지 모르겠다면 / Not sure which one fits?
- body: 사는 지역과 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요. / Tell us your area and which days suit you, and we will suggest a house church.
- button: 연결 요청 남기기 / Ask to be connected

상세 페이지의 정보 표 이름, ‘교인에게만 보여요’, ‘이 목장이 궁금하신가요?’, ‘이 목장 문의’, ‘← 목장 목록’은 행사 상세처럼 코드의 고정 문구다.

## 사이트 연결

- **상단 메뉴**: `Header`의 `navItems`에서 ‘예배’ 다음에 `{ href: '/mokjang', labelKo: '목장', labelEn: 'House Church' }`. 영어 메뉴와 운영 메뉴, 로그인 버튼이 함께 있을 때 961px 이상에서 한 줄에 들어가는지 확인한다. 넘치면 햄버거 메뉴 기준(지금 960px)을 들어가는 가장 작은 폭까지 올린다.
- **푸터 ‘둘러보기’**: 교회 소개, 예배 안내, 목장, 설교 순서.
- **홈 다음 걸음 첫 카드**: 링크를 `/mokjang`으로 바꾼다.
  - 제목: 목장과 연결되고 싶나요? / Looking for community? (지금과 같음)
  - 설명: 목장이 어떤 곳인지 살펴보고, 가까운 목장을 찾아보세요. / See what a house church is like and find one near you.
  - 버튼: 목장 알아보기 / Explore house churches
  - 저장된 문구는 링크로 카드를 찾으므로, 이 카드에 관리자가 저장해 둔 문구는 새 기본 문구로 돌아간다. 기존 규칙(“없어진 카드의 문구는 빠진다”) 그대로다.
- **문의 폼**: `?topic=community&mokjang={slug}`로 열리면 그 목장을 불러온다. 찾았고 메시지 칸이 아직 비어 있으면 “관심 있는 목장: {이름}” / “House church I am interested in: {name}”과 빈 줄을 채운다. 찾지 못하면 아무것도 채우지 않는다. 메일 제목은 지금처럼 “[목장 연결] {이름}”이고, 목장 이름은 본문에 들어간다. 문의는 교회 메일함으로 가고 목자에게 직접 가지 않는다.
- **사이트맵**: `/worship` 다음에 `https://sydneysamil.org/mokjang`. 상세 페이지는 쿼리 주소라 넣지 않는다(행사와 같다).
- **페이지 설명**: 제목 ‘목장’ / ‘House Church’. 설명 “시드니 삼일교회는 가정교회입니다. 가정에서 매주 모이는 목장을 소개하고, 가까운 목장을 안내합니다.” / “Sydney Samil Church is a house church. Meet the small communities that gather in homes each week, and find one near you.”

## 실패

- 목장 목록을 불러오지 못하면 타일 자리에 준비 중 문구와 연결 요청 링크를 보여 주고, 문구 섹션은 그대로 그린다.
- 사이트 설정을 불러오지 못하면 기본 문구를 쓴다.
- 상세에서 목장이 없거나 초안이면 빈 상태 안내를 보여 준다.
- 사진 주소가 없거나 사진을 불러오지 못하면 기본 이미지를 쓴다.
- 잘못된 입력은 400, 같은 주소 이름은 409로 거절하고 저장된 목장은 그대로다.
- 사진 파일 삭제가 실패해도 목장과 사진 행은 지워진 상태로 남고 오류를 기록한다(행사 사진과 같다).
- 문의 폼의 `mokjang` 값이 맞지 않으면 무시한다.

## 확인

API 단위 테스트 (`node --test`):

- `validateMokjangInput`: 필수 칸, 요일·시간·대상·언어 값, 길이, slug 규칙과 영어 이름에서 만들기, 사진 경로
- 응답 조립: `member`가 없으면 `shepherdName`, `partnerName` 키가 없다. `member`가 있으면 있다.
- 일반 방문자는 초안을 받지 못하고 편집자는 받는다.
- 목록은 `coverImage` 하나, 한 목장은 `images` 전체
- `files-download`는 목장 사진을 로그인 없이 내준다.
- `mokjang-images`는 편집자만 지울 수 있다.

화면 단위 테스트:

- 요일, 시간대, 타일·상세 표시 문자열, 대상·언어 이름 (한/영)
- 영어 칸이 비면 한국어
- 가나다순 정렬
- `parseSiteCopy`: 목장 기본 문구, 빈 질문과 빈 삶공부 칸 숨기기, 한 칸만 고쳐도 나머지 유지
- 홈 다음 걸음 첫 카드 링크가 `/mokjang`
- 문의 폼 미리 채우기 문자열
- `check-public.mjs`: 사이트맵에 `/mokjang`

브라우저 확인 (데스크톱과 휴대폰 너비, 한국어와 영어):

- 목장 페이지 일곱 섹션과 ‘목장 둘러보기’ 이동
- 로그인 전 상세에 목자 상자가 없고, 교인 로그인 후 있다.
- 사진이 없는 목장의 기본 이미지
- 영어 메뉴가 넓은 화면에서 한 줄에 들어간다.
- ‘이 목장 문의’가 목장 이름이 채워진 문의 폼을 연다.
- 편집자가 목장을 만들고, 사진을 올리고, 초안으로 두었다가 공개하고, 지운다.

## 교회가 할 일

- 목장마다 소개, 지역, 모임 시간, 사진, 목자 이름을 입력한다. 사진은 목장 식구들의 공개 동의를 받는다.
- 기본 문구, 특히 목장 저녁 순서의 시간과 “목장은 어떻게 정해지나요?”의 답이 교회의 실제와 맞는지 확인하고 다듬는다.
- 목자·목녀에게 이름이 교인에게만 보인다는 것을 알린다.

## 완료 기준

처음 온 사람이 상단 메뉴의 ‘목장’을 눌러 목장이 무엇이고 한 저녁이 어떻게 흘러가는지 읽고, 가까운 목장의 타일을 눌러 모임 시간과 대상을 확인한 뒤, ‘이 목장 문의’로 목장 이름이 채워진 연결 요청을 보낼 수 있다. 로그인하지 않으면 목자 이름은 어디에도 보이지 않고, 교인은 상세 페이지에서 본다. 편집자는 자료 관리에서 분가한 목장을 추가하고 고칠 수 있다.
