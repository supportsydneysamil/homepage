import type { NextPage } from 'next';
import Link from 'next/link';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { directionsUrl, formatFullAddress } from '../lib/churchInfo';
import { localize } from '../lib/siteCopy';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const { churchInfo, siteCopy } = useSiteSettings();
  const worship = siteCopy.worship;

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
            <Link className="site-button site-button--quiet" href="/contact">
              {localize(worship.askVisit, lang)}
            </Link>
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
  title: 'Worship',
  description: 'Service times and location for Sydney Samil Church.',
};

export default Worship;
