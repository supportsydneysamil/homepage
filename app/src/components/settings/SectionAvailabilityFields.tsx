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
