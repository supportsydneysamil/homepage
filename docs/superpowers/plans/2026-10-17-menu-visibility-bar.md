# 메뉴 공개 메뉴 막대형 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트 설정의 `메뉴 공개` 탭을 같은 문장이 반복되는 체크박스 카드 목록에서, 방문자 헤더와 같은 메뉴 막대를 눌러 공개와 숨김을 바꾸는 화면으로 바꾼다.

**Architecture:** 저장 데이터, API, 공개 화면 동작은 그대로 두고 설정 탭의 표시 계층만 바꾼다. 숨긴 메뉴와 저장 전 변경 메뉴는 `sectionAvailability.ts`의 순수 함수로 계산하고, `SectionAvailabilityFields`는 초안 값과 게시된 값을 받아 메뉴 막대와 숨긴 메뉴 요약을 그린다.

**Tech Stack:** Next.js Pages Router 정적 export, React 18, TypeScript, `tsx --test`, 전역 CSS `app/src/styles/globals.css`

## Global Constraints

- 설계 기준은 `docs/superpowers/specs/2026-10-17-section-availability-design.ko.md`의 "사이트 설정 화면" 절이다.
- 홈은 누를 수 없는 잠금 버튼이며 "항상" 표시를 붙인다.
- 일곱 섹션 버튼은 각각 네이티브 체크박스 하나로 동작하고 키보드 포커스 테두리를 보여 준다.
- 버튼의 접근 가능한 이름은 메뉴 이름이고, 아이콘과 상태 글자는 장식으로 처리한다.
- 숨긴 메뉴는 점선 테두리·취소선·숨김 아이콘·"숨김" 글자로 표시한다.
- 게시된 값과 다른 메뉴에는 금색 점을 붙이고, "저장 전 변경" 범례는 바뀐 메뉴가 있을 때만 보인다.
- 숨긴 메뉴 요약은 메뉴 순서를 따르고, 새로 숨겨 아직 저장하지 않은 메뉴에 "저장 전" 표시를 붙인다.
- 숨긴 메뉴가 없으면 "모든 메뉴가 공개되어 있습니다." 한 줄만 표시한다.
- 탭 설명: "메뉴를 눌러 공개하거나 숨깁니다. 숨긴 메뉴는 사이트의 메뉴와 링크에서 사라지고, 주소로 들어와도 비공개 안내가 보입니다. 운영 화면에서는 계속 작성·수정할 수 있습니다."
- 스타일은 테마 색 변수만 사용한다.
- 새 의존성을 추가하지 않는다.

---

### Task 1: 숨긴 메뉴와 바뀐 메뉴 계산

**Files:**
- Modify: `app/src/lib/sectionAvailability.ts`
- Test: `app/src/lib/sectionAvailability.test.ts`

**Interfaces:**
- Consumes: `PUBLIC_SECTION_KEYS`, `PublicSection`, `SectionAvailability`
- Produces:
  - `hiddenSections(availability: SectionAvailability): PublicSection[]`
  - `changedSections(draft: SectionAvailability, published: SectionAvailability): PublicSection[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`sectionAvailability.test.ts`의 import 목록에 `changedSections`, `hiddenSections`를 추가하고 파일 끝에 다음을 추가한다.

```ts
test('hidden sections follow the menu order', () => {
  assert.deepEqual(hiddenSections(all(true)), []);
  assert.deepEqual(
    hiddenSections({ ...all(true), contact: false, mokjang: false }),
    ['mokjang', 'contact']
  );
});

test('changed sections compare the draft with the published value in menu order', () => {
  const published = { ...all(true), mokjang: false };
  assert.deepEqual(changedSections(published, published), []);
  assert.deepEqual(
    changedSections({ ...published, sermons: false, mokjang: true }, published),
    ['mokjang', 'sermons']
  );
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd app && npx tsx --test src/lib/sectionAvailability.test.ts`
Expected: FAIL. `hiddenSections`와 `changedSections`가 아직 export되지 않았다.

- [ ] **Step 3: 최소 구현**

`sectionAvailability.ts` 끝에 추가한다.

```ts
export const hiddenSections = (availability: SectionAvailability): PublicSection[] =>
  PUBLIC_SECTION_KEYS.filter((section) => !availability[section]);

export const changedSections = (
  draft: SectionAvailability,
  published: SectionAvailability
): PublicSection[] =>
  PUBLIC_SECTION_KEYS.filter((section) => draft[section] !== published[section]);
```

- [ ] **Step 4: 통과 확인**

Run: `cd app && npx tsx --test src/lib/sectionAvailability.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add app/src/lib/sectionAvailability.ts app/src/lib/sectionAvailability.test.ts
git commit -m "숨긴 메뉴와 저장 전 변경 메뉴를 계산한다"
```

### Task 2: 메뉴 막대 화면

**Files:**
- Modify: `app/src/components/settings/SectionAvailabilityFields.tsx`
- Modify: `app/src/components/settings/SettingsWorkspace.tsx`
- Modify: `app/src/styles/globals.css`

**Interfaces:**
- Consumes: Task 1의 `hiddenSections`, `changedSections`, 기존 `PUBLIC_SECTION_NAV`
- Produces: `SectionAvailabilityFields({ value, published, onChange, isKo })`

DOM 테스트 환경이 없으므로 화면은 타입 검사, 정적 빌드, 실제 렌더링 스크린샷으로 검증한다.

- [ ] **Step 1: `SectionAvailabilityFields.tsx`를 다음 내용으로 교체**

```tsx
import {
  PUBLIC_SECTION_NAV,
  changedSections,
  hiddenSections,
  type PublicSection,
  type SectionAvailability,
} from '../../lib/sectionAvailability';

const CLOSES_WITH: Record<PublicSection, { ko: string; en: string }> = {
  about: { ko: '소개 페이지', en: 'About page' },
  worship: {
    ko: '예배 안내 페이지 · 예배 시간은 홈과 푸터에 계속 표시',
    en: 'Worship page · service times stay on Home and in the footer',
  },
  mokjang: { ko: '목장 목록·상세 페이지', en: 'House church list and detail pages' },
  events: {
    ko: '이벤트 목록·상세 페이지, 홈의 행사 카드',
    en: 'Event list and detail pages, the event card on Home',
  },
  sermons: { ko: '설교 페이지, 홈의 설교 카드', en: 'Sermons page, the sermon card on Home' },
  resources: {
    ko: '자료실·신청 페이지, 홈의 신청 카드, 파일 다운로드',
    en: 'Resources and applications, application cards on Home, file downloads',
  },
  contact: {
    ko: '문의 페이지와 문의 버튼 · 전화와 이메일은 계속 표시',
    en: 'Contact page and contact buttons · phone and email stay visible',
  },
};

const ICONS = {
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  hidden: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c5 0 8.6 4.4 9.6 7-.4 1-1.2 2.4-2.4 3.7M6.6 6.6C4.5 8 3 10.1 2.4 12c1 2.6 4.6 7 9.6 7 1.6 0 3.1-.4 4.4-1.1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
};

const MenuIcon = ({ kind }: { kind: keyof typeof ICONS }) => (
  <svg className="settings-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[kind]}
  </svg>
);

const SectionAvailabilityFields = ({
  value,
  published,
  onChange,
  isKo,
}: {
  value: SectionAvailability;
  published: SectionAvailability;
  onChange: (next: SectionAvailability) => void;
  isKo: boolean;
}) => {
  const hidden = hiddenSections(value);
  const changed = changedSections(value, published);
  const caption = isKo ? '방문자에게 보이는 메뉴' : 'Menu visitors see';

  return (
    <div className="settings-menu">
      <div className="settings-menu__caption">
        <span>{caption}</span>
        {changed.length ? (
          <span className="settings-menu__legend">
            <span className="settings-menu__dot" aria-hidden="true" />
            {isKo ? '저장 전 변경' : 'Unsaved changes'}
          </span>
        ) : null}
      </div>

      <div className="settings-menu__bar" role="group" aria-label={caption}>
        <span className="settings-menu__item settings-menu__item--locked">
          <MenuIcon kind="lock" />
          <span>{isKo ? '홈' : 'Home'}</span>
          <span className="settings-menu__state" aria-hidden="true">
            {isKo ? '항상' : 'Always'}
          </span>
        </span>
        {PUBLIC_SECTION_NAV.map((item) => {
          const isVisible = value[item.section];
          const className = [
            'settings-menu__item',
            isVisible ? 'settings-menu__item--on' : 'settings-menu__item--off',
            changed.includes(item.section) ? 'settings-menu__item--changed' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <label className={className} key={item.section}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(event) =>
                  onChange({ ...value, [item.section]: event.currentTarget.checked })
                }
              />
              <MenuIcon kind={isVisible ? 'check' : 'hidden'} />
              <span className="settings-menu__label">{isKo ? item.labelKo : item.labelEn}</span>
              {isVisible ? null : (
                <span className="settings-menu__state" aria-hidden="true">
                  {isKo ? '숨김' : 'Hidden'}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="settings-menu__summary">
        {hidden.length ? (
          <>
            <p className="settings-menu__summary-title">
              {isKo
                ? `숨긴 메뉴 ${hidden.length}개 · 함께 닫히는 곳`
                : `Hidden menus (${hidden.length}) · also closed`}
            </p>
            <ul>
              {PUBLIC_SECTION_NAV.filter((item) => hidden.includes(item.section)).map((item) => (
                <li key={item.section}>
                  <strong>{isKo ? item.labelKo : item.labelEn}</strong>
                  <span>{isKo ? CLOSES_WITH[item.section].ko : CLOSES_WITH[item.section].en}</span>
                  {published[item.section] ? (
                    <span className="settings-menu__badge">{isKo ? '저장 전' : 'Unsaved'}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="settings-menu__summary-empty">
            {isKo ? '모든 메뉴가 공개되어 있습니다.' : 'Every menu is visible.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default SectionAvailabilityFields;
```

- [ ] **Step 2: `SettingsWorkspace.tsx`에서 탭 설명과 게시된 값 전달 변경**

`labels.sectionsDescription`을 다음으로 바꾼다.

```tsx
      sectionsDescription: isKo
        ? '메뉴를 눌러 공개하거나 숨깁니다. 숨긴 메뉴는 사이트의 메뉴와 링크에서 사라지고, 주소로 들어와도 비공개 안내가 보입니다. 운영 화면에서는 계속 작성·수정할 수 있습니다.'
        : 'Select a menu to show or hide it. Hidden menus disappear from the site navigation and links, and their addresses show an unavailable notice. You can keep editing their content in Operations.',
```

`SectionAvailabilityFields`에 게시된 값을 넘긴다.

```tsx
          <SectionAvailabilityFields
            value={draftSectionAvailability}
            published={sectionAvailability}
            onChange={(next) => {
              setDraftSectionAvailability(next);
              setStatus(null);
            }}
            isKo={isKo}
          />
```

- [ ] **Step 3: `globals.css`의 `.settings-toggle input` 규칙 바로 뒤에 메뉴 막대 스타일 추가**

```css
.settings-menu {
  display: grid;
  gap: 1.15rem;
  padding: 1.3rem 1.4rem 1.4rem;
  border: 1px solid var(--site-line);
  border-radius: 1.2rem;
  background: var(--site-surface);
}

.settings-menu__caption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--site-muted);
}

.settings-menu__legend {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}

.settings-menu__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--site-gold);
}

.settings-menu__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.6rem;
  border: 1px solid var(--site-line);
  border-radius: 1.1rem;
  background: var(--site-canvas);
}

.settings-menu__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.6rem;
  padding: 0.45rem 0.95rem;
  border: 1px solid var(--site-line);
  border-radius: 999px;
  background: var(--site-surface);
  color: var(--site-ink);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}

.settings-menu__item--on:hover,
.settings-menu__item--off:hover {
  border-color: var(--site-accent);
}

.settings-menu__item:has(input:focus-visible) {
  outline: 2px solid var(--site-accent);
  outline-offset: 2px;
}

.settings-menu__item input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.settings-menu__icon {
  width: 1rem;
  height: 1rem;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.settings-menu__item--on .settings-menu__icon {
  color: var(--site-accent);
}

.settings-menu__item--off {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--site-muted) 55%, transparent);
  background: transparent;
  color: var(--site-muted);
}

.settings-menu__item--off .settings-menu__label {
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}

.settings-menu__item--locked {
  border-color: transparent;
  background: var(--site-surface-soft);
  cursor: default;
}

.settings-menu__item--changed::after {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: var(--site-gold);
  box-shadow: 0 0 0 2px var(--site-surface);
}

.settings-menu__state {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--site-surface-soft);
  color: var(--site-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.settings-menu__summary {
  display: grid;
  gap: 0.55rem;
  padding-top: 1rem;
  border-top: 1px solid var(--site-line);
}

.settings-menu__summary p {
  margin: 0;
  font-size: 0.85rem;
}

.settings-menu__summary-title {
  font-weight: 700;
  color: var(--site-ink);
}

.settings-menu__summary-empty {
  color: var(--site-muted);
}

.settings-menu__summary ul {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.settings-menu__summary li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.7rem;
  font-size: 0.85rem;
  color: var(--site-muted);
}

.settings-menu__summary li strong {
  min-width: 4.5rem;
  color: var(--site-ink);
}

.settings-menu__badge {
  padding: 0.08rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--site-gold) 22%, transparent);
  color: var(--site-ink);
  font-size: 0.7rem;
  font-weight: 700;
}
```

- [ ] **Step 4: 타입 검사와 단위 테스트**

Run: `cd app && npm run typecheck && npm run test:lib`
Expected: PASS

- [ ] **Step 5: 실제 화면 확인**

Run: `cd app && npm run build`

빌드한 정적 사이트를 관리자 권한과 설정 응답을 흉내 내는 임시 서버로 띄우고 `/manage/settings?tab=sections`를 캡처한다. 다음 상태를 확인한다.

- 한국어 데스크톱: 목장이 이미 숨겨진 상태에서 설교를 새로 숨긴 초안. 금색 점, "저장 전 변경" 범례, 요약의 "저장 전" 표시, 하단 저장 요약
- 한국어 모바일 같은 상태: 버튼 줄바꿈
- 영어 데스크톱, 모두 공개: 범례 없음, "Every menu is visible."
- 다크 테마: 같은 규칙으로 보이는지
- 키보드 포커스: 첫 메뉴 버튼의 포커스 테두리

- [ ] **Step 6: 커밋**

```bash
git add app/src/components/settings/SectionAvailabilityFields.tsx app/src/components/settings/SettingsWorkspace.tsx app/src/styles/globals.css
git commit -m "메뉴 공개 설정을 메뉴 막대로 바꾼다"
```

### Task 3: 전체 검증

**Files:** 없음

- [ ] **Step 1: 전체 검증 실행**

Run: `git diff --check && cd app && npm test && npm run typecheck && npm run build && npm run test:export`
Expected: 모든 테스트 통과, 타입 검사·빌드 성공

- [ ] **Step 2: 남은 변경 확인**

Run: `git status --short --branch`
Expected: 작업 트리 깨끗함
