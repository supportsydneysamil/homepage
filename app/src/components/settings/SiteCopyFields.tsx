import type { SiteCopy } from '../../lib/siteCopy';
import BilingualField from './BilingualField';
import { CopySection, PageAccordion } from './SiteCopyEditorParts';
import HomeCopyFields from './HomeCopyFields';

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
        meta={isKo ? '첫 화면부터 담임목사 소개까지' : 'From hero to pastor feature'}
        count={
          37 +
          value.home.pillars.items.length * 2 +
          value.home.nextSteps.items.length * 3
        }
        open
      >
        <HomeCopyFields
          value={value.home}
          onChange={(home) => onChange({ ...value, home })}
          isKo={isKo}
        />
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
