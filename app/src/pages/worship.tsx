import type { NextPage } from 'next';
import Link from 'next/link';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { directionsUrl, formatFullAddress } from '../lib/churchInfo';
import type { PageMeta } from '../lib/pageMeta';
import { isPublicHrefEnabled } from '../lib/sectionAvailability';
import { localize } from '../lib/siteCopy';

const Worship: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const { churchInfo, siteCopy, sectionAvailability } = useSiteSettings();
  const worship = siteCopy.worship;
  const contactEnabled = isPublicHrefEnabled('/contact', sectionAvailability);

  return (
    <article className="site-page worship-page">
      <PageHero
        eyebrow={localize(worship.eyebrow, lang)}
        title={localize(worship.title, lang)}
        description={localize(worship.description, lang)}
        actions={
          <>
            <a
              className="site-button site-button--primary"
              href={directionsUrl(churchInfo.mapsQuery)}
              target="_blank"
              rel="noreferrer"
            >
              {localize(worship.directions, lang)} <span aria-hidden="true">→</span>
            </a>
            {contactEnabled ? (
              <Link className="site-button site-button--quiet" href="/contact">
                {localize(worship.askVisit, lang)}
              </Link>
            ) : null}
          </>
        }
      />

      <section className="worship-times">
        <div className="worship-times__intro">
          <p className="site-kicker">{localize(worship.timesKicker, lang)}</p>
          <h2>{localize(worship.timesTitle, lang)}</h2>
          <p>{localize(worship.timesIntro, lang)}</p>
        </div>
        {churchInfo.services.map((service) => (
          <div className="worship-time" key={service.id}>
            <span>{localize(service.label, lang)}</span>
            <strong>{service.time}</strong>
            <small>
              {service.period} · {localize(service.note, lang)}
            </small>
          </div>
        ))}
      </section>

      <section className="worship-details">
        {churchInfo.gatherings.map((gathering) => (
          <article key={gathering.id}>
            <span>{gathering.badge}</span>
            <h3>{localize(gathering.title, lang)}</h3>
            <p>{localize(gathering.detail, lang)}</p>
          </article>
        ))}
        <article>
          <span>HERE</span>
          <h3>{localize(worship.locationTitle, lang)}</h3>
          <p>{formatFullAddress(churchInfo)}</p>
        </article>
      </section>
    </article>
  );
};

Worship.meta = {
  title: { ko: '예배', en: 'Worship' },
  description: {
    ko: '시드니 삼일교회 주일예배 시간과 오시는 길 안내입니다. 처음 오셔도 편안하게 함께 예배해요.',
    en: 'Service times and location for Sydney Samil Church.',
  },
};

export default Worship;
