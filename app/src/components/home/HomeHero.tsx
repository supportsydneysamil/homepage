import Link from 'next/link';
import type { Language } from './homeContent';
import CopyLines from '../CopyLines';
import SitePhoto from '../SitePhoto';
import { useSiteSettings } from '../../lib/ThemeContext';
import { DEFAULT_HERO_IMAGE } from '../../lib/siteSettings';
import { directionsUrl, formatServiceTimesShort } from '../../lib/churchInfo';
import { localize } from '../../lib/siteCopy';

const HomeHero = ({ lang }: { lang: Language }) => {
  const { heroImageUrl, imagePresentation, churchInfo, siteCopy } = useSiteSettings();
  const hero = siteCopy.home.hero;

  return (
    <section className="home-hero">
      <div className="home-hero__copy">
        <p className="home-kicker">{localize(hero.kicker, lang)}</p>
        <h1>
          <CopyLines text={localize(hero.title, lang)} />
        </h1>
        <p className="home-hero__lead">{localize(hero.lead, lang)}</p>
        <div className="home-hero__actions">
          <Link href="#visit" className="home-button home-button--primary">
            {localize(hero.ctaVisit, lang)}
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href={directionsUrl(churchInfo.mapsQuery)}
            className="home-button home-button--quiet"
            target="_blank"
            rel="noreferrer"
          >
            {localize(hero.ctaDirections, lang)}
          </a>
        </div>
      </div>

      <div className="home-hero__visual">
        <span className="home-hero__shape home-hero__shape--round" aria-hidden="true" />
        <span className="home-hero__shape home-hero__shape--gold" aria-hidden="true" />
        <div className="home-hero__photo">
          <SitePhoto
            src={heroImageUrl}
            fallback={DEFAULT_HERO_IMAGE}
            alt={localize(hero.photoAlt, lang)}
            presentation={imagePresentation.hero}
          />
        </div>
        <div className="home-hero__service-note">
          <span>{localize(hero.thisSunday, lang)}</span>
          <strong>{formatServiceTimesShort(churchInfo.services)}</strong>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
