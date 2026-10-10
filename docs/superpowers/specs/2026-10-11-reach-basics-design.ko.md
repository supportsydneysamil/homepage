# 젊은 층 연결 기본기

영어 설계: [Reach Basics](./2026-10-11-reach-basics-design.md)

## 목표

젊은 사람들은 검색, 카카오톡과 인스타그램에서 공유된 링크, 자기가 이미 쓰는 채널로 교회를 찾는다. 지금 사이트는 세 가지 모두 약하다. 링크를 공유하면 미리보기가 없고, 검색엔진은 한국어 검색어가 없는 영어 페이지를 읽고, 소셜 링크는 어디에도 없다. 홈의 ‘기도 요청’과 ‘연결 요청’ 버튼은 주제를 잃은 채 일반 문의 폼으로 간다. 이 작업은 지금 구조 안에서 작고 독립적인 변경으로 이 기본기를 고친다.

## 판단

사이트는 첫 방문 안내를 이미 잘 한다. 부족한 것은 그 앞뒤의 길이다. 발견되고, 공유되고, 쉽게 연락할 수 있어야 한다. 고치는 비용이 작고 이후의 모든 기능에 도움이 되므로, 팟캐스트 피드, 청년 페이지, 푸시 알림 같은 큰 작업보다 먼저 한다.

공유 미리보기와 검색 정보는 빌드할 때 고정한다. 카카오, 네이버, 페이스북은 내보낸 HTML만 읽으므로 어차피 그들이 보는 것은 빌드 시점의 값이다. 빌드 중에 운영 사이트 설정을 불러오면 배포가 운영 API에 묶인다. 행사별 공유 미리보기 함수는 규모가 크고, 행사 사진이 없는 지금은 효과도 작다.

내보낸 HTML은 한국어가 된다. 교회의 주된 대상이 한국어 사용자이고, HTML 속 한국어 본문이 한국어 검색에 유리하다. 브라우저에 한국어가 없는 방문자는 페이지가 열리자마자 영어로 바뀐다.

## 범위

포함:

1. 기본 언어: 한국어 HTML 내보내기와 브라우저 언어 감지
2. 공유와 검색: 언어별 페이지 제목·설명, 미리보기 태그, 아이콘, `robots.txt`, `sitemap.xml`, 홈의 교회 구조화 데이터
3. 소셜 링크: 사이트 설정의 선택 채널 네 개를 푸터, 문의 페이지, 구조화 데이터에 표시
4. 문의 종류: 일반, 목장 연결, 기도 요청. 기도 요청에는 공유 범위 선택
5. 방문 분석: 운영 사이트에만 Cloudflare Web Analytics

각 항목은 따로 배포할 수 있고, 위 순서로 진행한다.

포함하지 않음:

- 행사별 공유 미리보기 (공유 함수가 필요하다. 다음 단계)
- 홈 화면 설치와 푸시 알림
- 네이버 소유 확인 파일 (교회가 네이버에서 받으면 추가한다)
- 익명 기도 요청, 기도 요청 전용 메일함
- 인스타그램 게시물을 사이트로 끌어오기

## 기본 언어

`app/src/pages/_document.tsx`는 `<Html lang="ko">`를 그린다. `LanguageProvider`는 한국어로 시작하므로 내보낸 HTML은 한국어다.

처음 열릴 때 언어는 `pickInitialLanguage(stored, languages)`가 정한다.

- 저장된 `ko` 또는 `en`이 있으면 그것을 쓴다.
- 없으면 `navigator.languages` 중 하나라도 `ko`로 시작할 때 한국어다. 영어를 첫 언어로 둔 폰을 쓰는 한국어 사용자도 여기에 들어간다.
- 그 밖에 목록에 항목이 있으면 영어다.
- 목록이 비어 있거나 없으면 한국어를 유지한다.

언어 버튼을 직접 눌렀을 때만 선택을 저장한다. 자동으로 고른 언어는 저장하지 않으므로, 방문자가 직접 고르기 전까지 감지가 계속 작동한다. `document.documentElement.lang`은 계속 현재 언어를 따른다.

## 공유와 검색

### 페이지 제목과 설명

각 페이지의 `meta`는 `{ title: LocalizedText; description: LocalizedText }`가 되고, `Layout`은 현재 언어의 값을 그린다. 공통 함수가 문서 제목을 만든다.

- 홈: 한국어 “시드니 삼일교회 | Sydney Samil Church”, 영어 “Sydney Samil Church | 시드니 삼일교회”
- 다른 페이지: 한국어 “{페이지} | 시드니 삼일교회”, 영어 “{페이지} | Sydney Samil Church”

한국어 페이지 제목은 메뉴 이름과 같다: 소개, 예배, 이벤트, 설교, 자료·신청, 문의. 행사 상세 페이지의 자체 제목도 같은 함수를 쓴다.

홈 설명:

- ko: 시드니 펜넌트힐스(Pennant Hills)에 있는 한인교회, 시드니 삼일교회입니다. 함께 예배하고, 삶을 나누며, 믿음 안에서 자랍니다.
- en: Sydney Samil Church is a Korean church in Pennant Hills, Sydney, where we worship, share life, and grow in faith together.

다른 공개 페이지는 지금의 영어 설명 옆에 한국어 설명을 더한다. 사이트 설정에서 바뀔 수 있는 예배 시간은 설명에 넣지 않는다.

### 미리보기 태그

`Layout`은 모든 페이지에 다음을 그린다.

- `og:type` `website`, `og:site_name` “시드니 삼일교회 Sydney Samil Church”
- `og:title`과 `og:description`: 문서 제목, 설명과 같다
- `og:image` `https://sydneysamil.org/og-image.jpg`와 너비, 높이, 언어별 대체 텍스트
- `og:locale`: 현재 언어에 따라 `ko_KR` 또는 `en_AU`, 다른 하나는 `og:locale:alternate`
- `twitter:card` `summary_large_image`

`og:url`과 canonical 링크는 넣지 않는다. 행사 상세는 주소의 쿼리로 행사를 구분하는데, 내보낸 HTML은 그 값을 알 수 없다. 잘못된 canonical은 모든 행사를 한 주소로 합쳐 버린다.

`og-image.jpg`는 교회 외관 사진(`church-bg.png`)을 위에서부터 1.91:1(819 × 429)로 잘라 JPEG로 저장한 것이다.

`SITE_URL`(`https://sydneysamil.org`)은 한 모듈에 둔다.

### 아이콘

`favicon.ico`(16, 32, 48px)와 `apple-touch-icon.png`(180px)를 지금 교회 로고로 한 번 만들어 `app/public/`에 넣는다. 로고는 로고 배경색으로 채운 정사각형 가운데에 둔다. `_document`가 둘을 연결한다. 사이트 설정에서 로고를 바꿔도 이 파일은 바뀌지 않는다. 로고가 바뀌면 손으로 교체한다.

### 검색엔진용 파일

`app/public/robots.txt`:

```
User-agent: *
Disallow: /manage
Disallow: /settings
Disallow: /profile
Disallow: /login
Sitemap: https://sydneysamil.org/sitemap.xml
```

`app/public/sitemap.xml`에는 공개 페이지 일곱 개를 넣는다: `/`, `/about`, `/worship`, `/events`, `/sermons`, `/resources`, `/contact`. Static Web Apps는 주소 대체 규칙보다 실제 파일을 먼저 보내므로, 두 주소는 더 이상 홈 HTML을 돌려주지 않는다.

### 구조화 데이터

홈은 순수 함수 `churchJsonLd(churchInfo, logoImageUrl)`이 만든 `application/ld+json` 스크립트 하나를 그린다.

- `@type` `Church`, `name`(한글 교회명), `alternateName`(영문 교회명)
- `url`(`SITE_URL`), `telephone`, `email`, `address`(전체 주소 문자열)
- `logo`: 로고 주소가 https 절대 주소일 때만
- `sameAs`: 비어 있지 않은 소셜 링크

값은 사이트 설정에서 오므로, 내보낸 HTML에는 기본값이 들어가고 설정을 불러온 뒤 갱신된다. 구글은 페이지를 그려서 갱신된 값을 읽는다. JSON은 `<`를 `\u003c`로 바꿔 직렬화해서, 관리자가 입력한 글이 스크립트 태그를 닫지 못하게 한다.

## 소셜 링크

### 사이트 설정

`ChurchInfo`에 `social: { instagram, youtube, kakao, facebook }`을 더한다. 각각 문자열이고 기본값은 빈 값이다. `parseChurchInfo`는 앞뒤 공백을 빼고, 300자 이하이면서 그 채널 주소인 https 주소일 때만 남긴다.

- 인스타그램: `instagram.com`, `www.instagram.com`
- 유튜브: `youtube.com`, `www.youtube.com`, `m.youtube.com`
- 카카오톡 채널: `pf.kakao.com`
- 페이스북: `facebook.com`, `www.facebook.com`, `m.facebook.com`

그 밖의 값은 빈 값이 된다. 규칙은 `app/src/lib/social.ts`에 두고 `api/shared/social.js`에 같은 규칙을 둔다. 새가족 폼 링크와 같은 방식이다.

사이트 설정 → 교회 정보에 ‘소셜 채널 / Social channels’ 묶음을 두고, 주소 칸 네 개와 “비워 둔 채널은 사이트에 보이지 않습니다. / Empty channels stay hidden.” 안내를 단다. 자리 표시 글은 `https://pf.kakao.com/_…/chat`처럼 기대하는 모양을 보여 준다. 비어 있지 않은데 올바르지 않은 링크는 교회 정보 탭의 검증 오류(`socialUrl`)가 되고, “해당 서비스의 https 주소를 입력해 주세요.” / “Enter an https link for this service.”와 함께 저장이 막힌다.

`PUT /api/site-settings`는 `churchInfo.social`의 값 중 비어 있지 않은 것이 같은 규칙을 통과하지 못하면 400으로 저장을 거절한다. 교회 정보는 이미 JSON으로 저장되므로 스키마는 바꾸지 않는다.

### 보여 주는 곳

- 푸터: ‘소식 받기 / Follow us’ 칸에 입력된 채널을 Instagram, YouTube, 카카오톡 채널 / KakaoTalk Channel, Facebook이라는 이름으로 나열한다. 하나도 없으면 칸이 없다.
- 문의 페이지 연락처: 이메일 아래 ‘메시지로 문의 / Message us’ 줄에 카카오톡 채널과 인스타그램 링크를 보여 준다. 관리자가 채널의 채팅 주소(`…/chat`)를 넣으면 링크가 1:1 채팅을 연다.
- 홈 구조화 데이터: `sameAs`

모든 소셜 링크는 새 탭에서 `rel="noopener noreferrer"`로 연다.

## 문의 종류

### 문의 페이지

폼은 ‘문의 종류 / What is this about?’ 라디오로 시작한다.

- `general`: 일반 문의 / General question
- `community`: 목장 연결 / Find a community
- `prayer`: 기도 요청 / Prayer request

`parseContactTopic`은 라우터가 준비되면 `?topic=`을 읽고, 그 밖의 값은 `general`이 된다. 홈 다음 걸음 링크는 이미 `?topic=community`와 `?topic=prayer`를 쓰므로 고치지 않아도 작동한다.

- `community`는 메시지 칸에 “사는 지역, 연령대, 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요.” / “Tell us your area, age group, and which days suit you, and we will suggest a community.” 안내를 보여 준다.
- `prayer`는 메시지 칸 이름을 ‘기도 제목 / Prayer request’로 바꾸고 ‘공유 범위 / Who may see this?’ 라디오를 더한다.
  - `staff`(기본값): 교역자만 보기 / Pastoral staff only
  - `team`: 중보기도팀과 함께 기도해도 괜찮아요 / OK to share with the prayer team

보내기에 성공해도 고른 문의 종류는 그대로 남는다.

### 문의 API

`POST /api/contact`는 `topic`과 `share`를 받는다. 모르는 종류는 `general`이 된다. `share`는 기도 요청에만 쓰이고, 모르는 값은 `staff`가 된다. 받는 사람은 바뀌지 않는다.

순수 함수 `buildContactEmail`이 제목과 본문을 만든다.

- general: 제목 “Contact form: {이름}” (지금과 같음)
- community: 제목 “[목장 연결] {이름}”, 본문 “Topic: Find a community (목장 연결)”
- prayer: 제목 “[기도 요청] {이름}”, 본문 “Topic: Prayer request (기도 요청)”, 그리고 “Sharing: Pastoral staff only (교역자만 보기)” 또는 “Sharing: OK to share with the prayer team (중보기도팀 공유 가능)”

배포 전에 교회가 문구 하나를 확인한다. “교역자만 보기”는 문의 메일함을 교역자만 읽을 때만 정확하다.

## 방문 분석

`_document`는 빌드할 때 `NEXT_PUBLIC_CF_BEACON_TOKEN`이 있고, 운영용 빌드이고, 토큰이 영문자와 숫자로만 되어 있을 때 Cloudflare Web Analytics 스크립트를 넣는다.

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…","spa":true}'></script>
```

Static Web Apps 워크플로의 배포 단계에 `NEXT_PUBLIC_CF_BEACON_TOKEN: ${{ github.ref_name == 'main' && vars.CF_BEACON_TOKEN || '' }}`를 두어 운영 사이트만 보고하게 한다. 로컬 개발과 dev 미리보기 사이트는 스크립트를 불러오지 않는다. 토큰은 원래 공개되는 값이므로 저장소 변수로 충분하다.

이 스크립트는 쿠키를 쓰지 않으므로 동의 배너가 필요 없다. 페이지 방문수, 유입 경로, 기기, 국가를 보여 준다. SPA 모드는 페이지 안 이동도 방문으로 센다.

## 교회가 할 일

코드 밖의 일:

- 무료 Cloudflare 계정을 만들고 Web Analytics에 sydneysamil.org를 등록한 뒤, 토큰을 GitHub 저장소 변수 `CF_BEACON_TOKEN`에 넣는다
- 사이트 설정에 소셜 채널 주소를 입력한다
- 문의 메일함을 누가 읽는지 확인해서 기도 요청 공유 문구가 정확하게 한다
- 구글 서치 콘솔과 네이버 서치어드바이저에 사이트를 등록하고 사이트맵을 제출한다
- Google 비즈니스 프로필을 점검한다
- 첫 배포 후 카카오 공유 디버거와 페이스북 공유 디버거로 저장된 미리보기를 새로 고친다

## 실패

사이트 설정을 불러오지 못하면 소셜 링크는 비어 있고 아무것도 나타나지 않는다. 구조화 데이터는 기본값을 쓴다. 저장된 소셜 링크가 올바르지 않으면 깨진 링크 대신 버린다. 설정 저장이 거절되면 저장된 설정은 그대로다. 문의 API는 모르는 종류와 공유 범위를 기본값으로 처리한다. 토큰이 없으면 분석 스크립트는 없다. `navigator.languages`가 없으면 한국어를 유지한다.

## 확인

단위 테스트:

- `pickInitialLanguage`: 저장값 우선, `ko`로 시작하는 항목이 있으면 한국어, 한국어가 없는 목록은 영어, 빈 목록은 한국어
- 홈과 다른 페이지의 두 언어 제목
- `churchJsonLd`: 필수 항목, 비어 있지 않은 링크만 `sameAs`, https 절대 주소일 때만 `logo`, 직렬화 결과의 `<` 처리
- 소셜 파싱은 올바른 링크를 남기고, 다른 주소, http 주소, 300자 넘는 주소를 버린다
- 교회 정보 검증은 비어 있지 않은 잘못된 소셜 링크를 잡고 빈 값은 허용한다
- 사이트 설정 API는 잘못된 소셜 링크를 거절하고 올바른 링크는 받는다
- `parseContactTopic`은 세 종류를 받고 그 밖은 기본값으로 바꾼다
- `buildContactEmail`의 종류별, 공유 범위별 제목과 본문, 모르는 값 포함
- `app/public`의 `robots.txt`와 `sitemap.xml`이 있고 기대한 줄을 담는다

`npm run build` 후 내보내기 확인: `out/index.html`에 `lang="ko"`, 한국어 본문, 미리보기 태그, 아이콘 링크가 있고, 토큰이 있을 때만 분석 스크립트가 있다.

브라우저 확인은 데스크톱과 모바일 너비, 한국어와 영어에서 한다. 첫 방문은 브라우저 언어를 따른다. 푸터와 문의 페이지에는 입력된 채널만 나온다. `?topic=prayer`는 기도 요청을 미리 고르고 공유 범위를 보여 주며, 메일함에는 “[기도 요청] {이름}”이 도착한다.

## 완료 기준

카카오톡으로 sydneysamil.org를 보내면 교회 사진과 한국어 제목, 설명이 있는 미리보기가 뜬다. 한국어 폰에서 처음 열면 한국어, 영어만 있는 폰에서는 영어로 보인다. 관리자가 입력한 소셜 채널이 푸터와 문의 페이지에 나타난다. 홈의 ‘기도 요청’은 기도 요청이 골라진 폼을 열고, 교회 메일함에는 “[기도 요청] {이름}” 메일이 도착한다. Cloudflare에서 운영 사이트 방문이 보인다.
