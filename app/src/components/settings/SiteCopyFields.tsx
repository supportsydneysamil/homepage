import type { SiteCopy } from '../../lib/siteCopy';
import BilingualField from './BilingualField';
import { CopySection, FieldGroup, PageAccordion } from './SiteCopyEditorParts';
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
  const primary = isKo ? '주요 문구' : 'Primary copy';
  const supporting = isKo ? '버튼과 보조 문구' : 'Buttons and supporting copy';

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
        count={5 + value.about.values.length * 2}
      >
        <CopySection title={isKo ? '페이지 머리말' : 'Page header'} count={3} open>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="about.title"
              label={isKo ? '제목' : 'Title'}
              value={value.about.title}
              onChange={(title) => setAbout({ title })}
            />
            <BilingualField
              fieldPath="about.description"
              label={isKo ? '소개' : 'Description'}
              value={value.about.description}
              onChange={(description) => setAbout({ description })}
              multiline
            />
          </FieldGroup>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="about.eyebrow"
              label={isKo ? '페이지 작은 제목' : 'Page eyebrow'}
              value={value.about.eyebrow}
              onChange={(eyebrow) => setAbout({ eyebrow })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection
          title={isKo ? '우리의 가치' : 'Our values'}
          description={isKo ? '소개 페이지의 핵심 가치 카드' : 'Core value cards on the About page'}
          count={value.about.values.length * 2}
        >
          {value.about.values.map((item, index) => (
            <article className="settings-item" key={`about-${index}`}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '가치' : 'Value'} {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <BilingualField
                fieldPath="about.values[].title"
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) => setAbout({ values: replaceAt(value.about.values, index, { title }) })}
              />
              <BilingualField
                fieldPath="about.values[].body"
                label={isKo ? '본문' : 'Body'}
                value={item.body}
                onChange={(body) => setAbout({ values: replaceAt(value.about.values, index, { body }) })}
                multiline
              />
            </article>
          ))}
        </CopySection>

        <CopySection title={isKo ? '우리의 고백' : 'Our heartbeat'} count={2}>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="about.quote"
              label={isKo ? '인용문' : 'Quote'}
              value={value.about.quote}
              onChange={(quote) => setAbout({ quote })}
              multiline
            />
          </FieldGroup>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="about.quoteKicker"
              label={isKo ? '인용문 작은 제목' : 'Quote kicker'}
              value={value.about.quoteKicker}
              onChange={(quoteKicker) => setAbout({ quoteKicker })}
            />
          </FieldGroup>
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '예배' : 'Worship'}
        meta={isKo ? '페이지 머리말 · 행동 버튼 · 예배와 위치 안내' : 'Page header, actions, service and location'}
        count={9}
      >
        <CopySection title={isKo ? '페이지 머리말' : 'Page header'} count={3} open>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="worship.title"
              label={isKo ? '제목' : 'Title'}
              value={value.worship.title}
              onChange={(title) => setWorship({ title })}
            />
            <BilingualField
              fieldPath="worship.description"
              label={isKo ? '소개' : 'Description'}
              value={value.worship.description}
              onChange={(description) => setWorship({ description })}
              multiline
            />
          </FieldGroup>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="worship.eyebrow"
              label={isKo ? '페이지 작은 제목' : 'Page eyebrow'}
              value={value.worship.eyebrow}
              onChange={(eyebrow) => setWorship({ eyebrow })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '페이지 행동 버튼' : 'Page actions'} count={2}>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="worship.directions"
              label={isKo ? '길찾기 버튼' : 'Directions button'}
              value={value.worship.directions}
              onChange={(directions) => setWorship({ directions })}
            />
            <BilingualField
              fieldPath="worship.askVisit"
              label={isKo ? '방문 문의 버튼' : 'Visit enquiry button'}
              value={value.worship.askVisit}
              onChange={(askVisit) => setWorship({ askVisit })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '예배 안내' : 'Service intro'} count={3}>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="worship.timesTitle"
              label={isKo ? '제목' : 'Title'}
              value={value.worship.timesTitle}
              onChange={(timesTitle) => setWorship({ timesTitle })}
            />
            <BilingualField
              fieldPath="worship.timesIntro"
              label={isKo ? '안내 문장' : 'Intro'}
              value={value.worship.timesIntro}
              onChange={(timesIntro) => setWorship({ timesIntro })}
              multiline
            />
          </FieldGroup>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="worship.timesKicker"
              label={isKo ? '작은 제목' : 'Kicker'}
              value={value.worship.timesKicker}
              onChange={(timesKicker) => setWorship({ timesKicker })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '위치 안내' : 'Location'} count={1}>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="worship.locationTitle"
              label={isKo ? '위치 제목' : 'Location title'}
              value={value.worship.locationTitle}
              onChange={(locationTitle) => setWorship({ locationTitle })}
            />
          </FieldGroup>
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '문의' : 'Contact'}
        meta={isKo ? '페이지 머리말 · 연락처 안내' : 'Page header and contact details'}
        count={5}
      >
        <CopySection title={isKo ? '페이지 머리말' : 'Page header'} count={3} open>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="contact.title"
              label={isKo ? '제목' : 'Title'}
              value={value.contact.title}
              onChange={(title) => setContact({ title })}
            />
            <BilingualField
              fieldPath="contact.description"
              label={isKo ? '소개' : 'Description'}
              value={value.contact.description}
              onChange={(description) => setContact({ description })}
              multiline
            />
          </FieldGroup>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="contact.eyebrow"
              label={isKo ? '페이지 작은 제목' : 'Page eyebrow'}
              value={value.contact.eyebrow}
              onChange={(eyebrow) => setContact({ eyebrow })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '연락처 안내' : 'Contact details'} count={2}>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="contact.detailsKicker"
              label={isKo ? '연락처 작은 제목' : 'Details kicker'}
              value={value.contact.detailsKicker}
              onChange={(detailsKicker) => setContact({ detailsKicker })}
            />
            <BilingualField
              fieldPath="contact.note"
              label={isKo ? '문의 안내 문장' : 'Contact note'}
              value={value.contact.note}
              onChange={(note) => setContact({ note })}
              multiline
            />
          </FieldGroup>
        </CopySection>
      </PageAccordion>

      <PageAccordion
        title={isKo ? '푸터' : 'Footer'}
        meta={isKo ? '소개 문구 · 열 제목 · 메뉴명' : 'Tagline, column headings, and menu labels'}
        count={8}
      >
        <CopySection title={isKo ? '소개 문구' : 'Tagline'} count={1} open>
          <FieldGroup title={primary}>
            <BilingualField
              fieldPath="footer.tagline"
              label={isKo ? '푸터 문구' : 'Tagline'}
              value={value.footer.tagline}
              onChange={(tagline) => setFooter({ tagline })}
              multiline
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '열 제목' : 'Column headings'} count={3}>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="footer.findUs"
              label={isKo ? '위치 열' : 'Find us column'}
              value={value.footer.findUs}
              onChange={(findUs) => setFooter({ findUs })}
            />
            <BilingualField
              fieldPath="footer.contact"
              label={isKo ? '연락처 열' : 'Contact column'}
              value={value.footer.contact}
              onChange={(contact) => setFooter({ contact })}
            />
            <BilingualField
              fieldPath="footer.explore"
              label={isKo ? '메뉴 열' : 'Explore column'}
              value={value.footer.explore}
              onChange={(explore) => setFooter({ explore })}
            />
          </FieldGroup>
        </CopySection>

        <CopySection title={isKo ? '메뉴명' : 'Menu labels'} count={4}>
          <FieldGroup title={supporting}>
            <BilingualField
              fieldPath="footer.about"
              label={isKo ? '소개' : 'About'}
              value={value.footer.about}
              onChange={(about) => setFooter({ about })}
            />
            <BilingualField
              fieldPath="footer.worship"
              label={isKo ? '예배' : 'Worship'}
              value={value.footer.worship}
              onChange={(worship) => setFooter({ worship })}
            />
            <BilingualField
              fieldPath="footer.sermons"
              label={isKo ? '설교' : 'Sermons'}
              value={value.footer.sermons}
              onChange={(sermons) => setFooter({ sermons })}
            />
            <BilingualField
              fieldPath="footer.meetUs"
              label={isKo ? '문의' : 'Meet us'}
              value={value.footer.meetUs}
              onChange={(meetUs) => setFooter({ meetUs })}
            />
          </FieldGroup>
        </CopySection>
      </PageAccordion>
    </div>
  );
};

export default SiteCopyFields;
