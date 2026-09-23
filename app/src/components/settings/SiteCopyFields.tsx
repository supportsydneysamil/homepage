import type { SiteCopy } from '../../lib/siteCopy';
import BilingualField from './BilingualField';
import { CopySection, PageAccordion } from './SiteCopyEditorParts';

const replaceAt = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((item, i) => (i === index ? { ...item, ...patch } : item));

const SiteCopyFields = ({
  value,
  onChange,
  isKo,
}: {
  value: SiteCopy;
  onChange: (next: SiteCopy) => void;
  isKo: boolean;
}) => {
  const home = value.home;
  const setHero = (patch: Partial<SiteCopy['home']['hero']>) =>
    onChange({ ...value, home: { ...home, hero: { ...home.hero, ...patch } } });
  const setPillars = (patch: Partial<SiteCopy['home']['pillars']>) =>
    onChange({ ...value, home: { ...home, pillars: { ...home.pillars, ...patch } } });
  const setVisit = (patch: Partial<SiteCopy['home']['visit']>) =>
    onChange({ ...value, home: { ...home, visit: { ...home.visit, ...patch } } });
  const setPastor = (patch: Partial<SiteCopy['home']['pastor']>) =>
    onChange({ ...value, home: { ...home, pastor: { ...home.pastor, ...patch } } });
  const setNextSteps = (patch: Partial<SiteCopy['home']['nextSteps']>) =>
    onChange({ ...value, home: { ...home, nextSteps: { ...home.nextSteps, ...patch } } });
  const setAbout = (patch: Partial<SiteCopy['about']>) =>
    onChange({ ...value, about: { ...value.about, ...patch } });
  const setWorship = (patch: Partial<SiteCopy['worship']>) =>
    onChange({ ...value, worship: { ...value.worship, ...patch } });
  const setContact = (patch: Partial<SiteCopy['contact']>) =>
    onChange({ ...value, contact: { ...value.contact, ...patch } });
  const setFooter = (patch: Partial<SiteCopy['footer']>) =>
    onChange({ ...value, footer: { ...value.footer, ...patch } });

  return (
    <div className="settings-accordions">
      <PageAccordion
        title={isKo ? '홈' : 'Home'}
        meta={isKo ? '첫 화면 · 기둥 · 방문 안내 · 담임목사 · 다음 걸음' : 'Hero, pillars, visit, pastor, next steps'}
        count={24}
        open
      >
        <CopySection title={isKo ? '첫 화면' : 'Hero'} count={4} open>
          <BilingualField
            label={isKo ? '큰 제목' : 'Headline'}
            hint={isKo ? '줄바꿈이 그대로 반영됩니다' : 'Line breaks are kept'}
            value={home.hero.title}
            onChange={(title) => setHero({ title })}
            multiline
            full
          />
          <BilingualField
            label={isKo ? '소개 문장' : 'Lead'}
            value={home.hero.lead}
            onChange={(lead) => setHero({ lead })}
            multiline
            full
          />
          <BilingualField
            label={isKo ? '방문 버튼' : 'Visit button'}
            value={home.hero.ctaVisit}
            onChange={(ctaVisit) => setHero({ ctaVisit })}
          />
          <BilingualField
            label={isKo ? '길찾기 버튼' : 'Directions button'}
            value={home.hero.ctaDirections}
            onChange={(ctaDirections) => setHero({ ctaDirections })}
          />
        </CopySection>

        <CopySection title={isKo ? '교회의 세 기둥' : 'Church pillars'} count={8}>
          <BilingualField
            label={isKo ? '섹션 제목' : 'Section title'}
            value={home.pillars.title}
            onChange={(title) => setPillars({ title })}
          />
          <BilingualField
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={home.pillars.intro}
            onChange={(intro) => setPillars({ intro })}
            multiline
            full
          />
          {home.pillars.items.map((item, index) => (
            <div className="settings-item" key={`pillar-${index}`}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '기둥' : 'Pillar'} {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <BilingualField
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) => setPillars({ items: replaceAt(home.pillars.items, index, { title }) })}
              />
              <BilingualField
                label={isKo ? '설명' : 'Description'}
                value={item.body}
                onChange={(body) => setPillars({ items: replaceAt(home.pillars.items, index, { body }) })}
                multiline
                full
              />
            </div>
          ))}
        </CopySection>

        <CopySection title={isKo ? '처음 방문 안내' : 'First visit'} count={4}>
          <BilingualField
            label={isKo ? '섹션 제목' : 'Section title'}
            value={home.visit.title}
            onChange={(title) => setVisit({ title })}
          />
          <BilingualField
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={home.visit.intro}
            onChange={(intro) => setVisit({ intro })}
            multiline
            full
          />
          <BilingualField
            label={isKo ? '예배 분위기' : 'What to expect'}
            value={home.visit.whatToExpect}
            onChange={(whatToExpect) => setVisit({ whatToExpect })}
            multiline
            full
          />
          <BilingualField
            label={isKo ? '어린이와 언어' : 'Children and language'}
            value={home.visit.children}
            onChange={(children) => setVisit({ children })}
            multiline
            full
          />
        </CopySection>

        <CopySection title={isKo ? '담임목사 소개' : 'Pastor feature'} count={2}>
          <BilingualField
            label={isKo ? '인용문' : 'Quote'}
            value={home.pastor.quote}
            onChange={(quote) => setPastor({ quote })}
            multiline
            full
          />
          <BilingualField
            label={isKo ? '본문' : 'Body'}
            value={home.pastor.body}
            onChange={(body) => setPastor({ body })}
            multiline
            full
          />
        </CopySection>

        <CopySection title={isKo ? '다음 걸음' : 'Next steps'} count={6}>
          {home.nextSteps.items.map((item, index) => (
            <div className="settings-item" key={`step-${index}`}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '카드' : 'Card'} {String(index + 1).padStart(2, '0')}
                </span>
                <span className="settings-item__note">{item.href}</span>
              </div>
              <BilingualField
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) => setNextSteps({ items: replaceAt(home.nextSteps.items, index, { title }) })}
              />
              <BilingualField
                label={isKo ? '설명' : 'Description'}
                value={item.description}
                onChange={(description) =>
                  setNextSteps({ items: replaceAt(home.nextSteps.items, index, { description }) })
                }
                multiline
                full
              />
            </div>
          ))}
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '소개' : 'About'}
        meta={isKo ? '페이지 머리말 · 가치 · 고백' : 'Page header, values, quote'}
        count={9}
      >
        <CopySection title={isKo ? '페이지 머리말' : 'Page header'} count={2} open>
          <BilingualField
            label={isKo ? '제목' : 'Title'}
            value={value.about.title}
            onChange={(title) => setAbout({ title })}
          />
          <BilingualField
            label={isKo ? '소개' : 'Description'}
            value={value.about.description}
            onChange={(description) => setAbout({ description })}
            multiline
            full
          />
        </CopySection>

        <CopySection title={isKo ? '우리의 가치' : 'Our values'} count={6}>
          {value.about.values.map((item, index) => (
            <div className="settings-item" key={`about-${index}`}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '가치' : 'Value'} {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <BilingualField
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) => setAbout({ values: replaceAt(value.about.values, index, { title }) })}
              />
              <BilingualField
                label={isKo ? '본문' : 'Body'}
                value={item.body}
                onChange={(body) => setAbout({ values: replaceAt(value.about.values, index, { body }) })}
                multiline
                full
              />
            </div>
          ))}
        </CopySection>

        <CopySection title={isKo ? '우리의 고백' : 'Our heartbeat'} count={1}>
          <BilingualField
            label={isKo ? '인용문' : 'Quote'}
            value={value.about.quote}
            onChange={(quote) => setAbout({ quote })}
            multiline
            full
          />
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '예배' : 'Worship'}
        meta={isKo ? '페이지 머리말 · 예배 안내 문구' : 'Page header and service intro'}
        count={4}
      >
        <CopySection title={isKo ? '페이지 머리말' : 'Page header'} count={2} open>
          <BilingualField
            label={isKo ? '제목' : 'Title'}
            value={value.worship.title}
            onChange={(title) => setWorship({ title })}
          />
          <BilingualField
            label={isKo ? '소개' : 'Description'}
            value={value.worship.description}
            onChange={(description) => setWorship({ description })}
            multiline
            full
          />
        </CopySection>

        <CopySection title={isKo ? '예배 안내' : 'Service intro'} count={2}>
          <BilingualField
            label={isKo ? '제목' : 'Title'}
            value={value.worship.timesTitle}
            onChange={(timesTitle) => setWorship({ timesTitle })}
          />
          <BilingualField
            label={isKo ? '안내 문장' : 'Intro'}
            value={value.worship.timesIntro}
            onChange={(timesIntro) => setWorship({ timesIntro })}
            multiline
            full
          />
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '문의와 푸터' : 'Contact and footer'}
        meta={isKo ? '문의 머리말 · 푸터 문구' : 'Contact header and footer tagline'}
        count={3}
      >
        <CopySection title={isKo ? '문의' : 'Contact'} count={2} open>
          <BilingualField
            label={isKo ? '제목' : 'Title'}
            value={value.contact.title}
            onChange={(title) => setContact({ title })}
          />
          <BilingualField
            label={isKo ? '소개' : 'Description'}
            value={value.contact.description}
            onChange={(description) => setContact({ description })}
            multiline
            full
          />
        </CopySection>

        <CopySection title={isKo ? '푸터' : 'Footer'} count={1}>
          <BilingualField
            label={isKo ? '푸터 문구' : 'Tagline'}
            value={value.footer.tagline}
            onChange={(tagline) => setFooter({ tagline })}
          />
        </CopySection>
      </PageAccordion>
    </div>
  );
};

export default SiteCopyFields;
