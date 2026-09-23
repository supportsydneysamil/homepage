import type { LocalizedText } from '../../lib/churchInfo';
import type { SiteCopy } from '../../lib/siteCopy';
import BilingualField from './BilingualField';

const field = (
  label: string,
  value: LocalizedText,
  onChange: (next: LocalizedText) => void,
  multiline?: boolean
) => <BilingualField label={label} value={value} onChange={onChange} multiline={multiline} />;

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
  const setHome = (patch: Partial<SiteCopy['home']>) => onChange({ ...value, home: { ...home, ...patch } });

  return (
    <div className="settings-copy-groups">
      <details className="settings-copy-group" open>
        <summary>{isKo ? '홈' : 'Home'}</summary>
        {field(isKo ? '히어로 제목' : 'Hero title', home.hero.title, (title) =>
          setHome({ hero: { ...home.hero, title } }), true
        )}
        {field(isKo ? '히어로 소개' : 'Hero lead', home.hero.lead, (lead) =>
          setHome({ hero: { ...home.hero, lead } }), true
        )}
        {field(isKo ? '방문 버튼' : 'Visit button', home.hero.ctaVisit, (ctaVisit) =>
          setHome({ hero: { ...home.hero, ctaVisit } })
        )}
        {field(isKo ? '길찾기 버튼' : 'Directions button', home.hero.ctaDirections, (ctaDirections) =>
          setHome({ hero: { ...home.hero, ctaDirections } })
        )}
        {field(isKo ? '기둥 제목' : 'Pillars title', home.pillars.title, (title) =>
          setHome({ pillars: { ...home.pillars, title } })
        )}
        {field(isKo ? '기둥 소개' : 'Pillars intro', home.pillars.intro, (intro) =>
          setHome({ pillars: { ...home.pillars, intro } }), true
        )}
        {home.pillars.items.map((item, index) => (
          <div key={`pillar-${index}`}>
            {field(`${isKo ? '기둥' : 'Pillar'} ${index + 1}`, item.title, (title) =>
              setHome({
                pillars: {
                  ...home.pillars,
                  items: home.pillars.items.map((current, i) => (i === index ? { ...current, title } : current)),
                },
              })
            )}
            {field(isKo ? '설명' : 'Description', item.body, (body) =>
              setHome({
                pillars: {
                  ...home.pillars,
                  items: home.pillars.items.map((current, i) => (i === index ? { ...current, body } : current)),
                },
              }),
              true
            )}
          </div>
        ))}
        {field(isKo ? '방문 안내 제목' : 'Visit title', home.visit.title, (title) =>
          setHome({ visit: { ...home.visit, title } })
        )}
        {field(isKo ? '방문 안내 소개' : 'Visit intro', home.visit.intro, (intro) =>
          setHome({ visit: { ...home.visit, intro } }), true
        )}
        {field(isKo ? '예배 분위기' : 'What to expect', home.visit.whatToExpect, (whatToExpect) =>
          setHome({ visit: { ...home.visit, whatToExpect } }), true
        )}
        {field(isKo ? '어린이 · 언어' : 'Children and language', home.visit.children, (children) =>
          setHome({ visit: { ...home.visit, children } }), true
        )}
        {field(isKo ? '목사 인용' : 'Pastor quote', home.pastor.quote, (quote) =>
          setHome({ pastor: { ...home.pastor, quote } }), true
        )}
        {field(isKo ? '목사 소개' : 'Pastor body', home.pastor.body, (body) =>
          setHome({ pastor: { ...home.pastor, body } }), true
        )}
        {home.nextSteps.items.map((item, index) => (
          <div key={`step-${index}`}>
            {field(`${isKo ? '다음 걸음' : 'Next step'} ${index + 1}`, item.title, (title) =>
              setHome({
                nextSteps: {
                  ...home.nextSteps,
                  items: home.nextSteps.items.map((current, i) => (i === index ? { ...current, title } : current)),
                },
              })
            )}
            {field(isKo ? '설명' : 'Description', item.description, (description) =>
              setHome({
                nextSteps: {
                  ...home.nextSteps,
                  items: home.nextSteps.items.map((current, i) =>
                    i === index ? { ...current, description } : current
                  ),
                },
              }),
              true
            )}
          </div>
        ))}
      </details>

      <details className="settings-copy-group">
        <summary>{isKo ? '소개' : 'About'}</summary>
        {field(isKo ? '제목' : 'Title', value.about.title, (title) => onChange({ ...value, about: { ...value.about, title } }))}
        {field(
          isKo ? '소개' : 'Description',
          value.about.description,
          (description) => onChange({ ...value, about: { ...value.about, description } }),
          true
        )}
        {value.about.values.map((item, index) => (
          <div key={`about-${index}`}>
            {field(item.title.en || `${isKo ? '가치' : 'Value'} ${index + 1}`, item.title, (title) =>
              onChange({
                ...value,
                about: {
                  ...value.about,
                  values: value.about.values.map((current, i) => (i === index ? { ...current, title } : current)),
                },
              })
            )}
            {field(isKo ? '본문' : 'Body', item.body, (body) =>
              onChange({
                ...value,
                about: {
                  ...value.about,
                  values: value.about.values.map((current, i) => (i === index ? { ...current, body } : current)),
                },
              }),
              true
            )}
          </div>
        ))}
        {field(isKo ? '인용' : 'Quote', value.about.quote, (quote) =>
          onChange({ ...value, about: { ...value.about, quote } }), true
        )}
      </details>

      <details className="settings-copy-group">
        <summary>{isKo ? '예배' : 'Worship'}</summary>
        {field(isKo ? '제목' : 'Title', value.worship.title, (title) =>
          onChange({ ...value, worship: { ...value.worship, title } })
        )}
        {field(
          isKo ? '소개' : 'Description',
          value.worship.description,
          (description) => onChange({ ...value, worship: { ...value.worship, description } }),
          true
        )}
        {field(isKo ? '예배 안내 제목' : 'Times title', value.worship.timesTitle, (timesTitle) =>
          onChange({ ...value, worship: { ...value.worship, timesTitle } })
        )}
        {field(isKo ? '예배 안내 소개' : 'Times intro', value.worship.timesIntro, (timesIntro) =>
          onChange({ ...value, worship: { ...value.worship, timesIntro } }), true
        )}
      </details>

      <details className="settings-copy-group">
        <summary>{isKo ? '문의 · 푸터' : 'Contact and footer'}</summary>
        {field(isKo ? '문의 제목' : 'Contact title', value.contact.title, (title) =>
          onChange({ ...value, contact: { ...value.contact, title } })
        )}
        {field(
          isKo ? '문의 소개' : 'Contact description',
          value.contact.description,
          (description) => onChange({ ...value, contact: { ...value.contact, description } }),
          true
        )}
        {field(isKo ? '푸터 문구' : 'Footer tagline', value.footer.tagline, (tagline) =>
          onChange({ ...value, footer: { ...value.footer, tagline } })
        )}
      </details>
    </div>
  );
};

export default SiteCopyFields;
