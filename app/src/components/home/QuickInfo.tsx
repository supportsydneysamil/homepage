import Link from 'next/link';
import type { Language } from './homeContent';
import { useSiteSettings } from '../../lib/ThemeContext';
import { directionsUrl, formatServiceTimesQuick } from '../../lib/churchInfo';
import { localize } from '../../lib/siteCopy';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const QuickInfo = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';
  const { churchInfo, siteCopy } = useSiteSettings();
  const quick = siteCopy.home.quick;

  return (
    <section className="home-quick-info" aria-label={isKo ? '빠른 안내' : 'Quick information'}>
      <Link href="/worship" className="home-quick-card">
        <span className="home-quick-card__number">01</span>
        <span>
          <strong>{localize(quick.worship, lang)}</strong>
          <small>{formatServiceTimesQuick(churchInfo.services)}</small>
        </span>
        <ArrowIcon />
      </Link>
      <Link href="#visit" className="home-quick-card">
        <span className="home-quick-card__number">02</span>
        <span>
          <strong>{localize(quick.firstVisit, lang)}</strong>
          <small>{localize(quick.firstVisitHint, lang)}</small>
        </span>
        <ArrowIcon />
      </Link>
      <a
        href={directionsUrl(churchInfo.mapsQuery)}
        className="home-quick-card"
        target="_blank"
        rel="noreferrer"
      >
        <span className="home-quick-card__number">03</span>
        <span>
          <strong>{localize(quick.findUs, lang)}</strong>
          <small>{churchInfo.suburb}</small>
        </span>
        <ArrowIcon />
      </a>
    </section>
  );
};

export default QuickInfo;
