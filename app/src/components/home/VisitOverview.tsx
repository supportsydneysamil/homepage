import type { Language } from './homeContent';
import { useSiteSettings } from '../../lib/ThemeContext';
import {
  directionsUrl,
  formatFullAddress,
  formatSundayServices,
  mapsEmbedUrl,
} from '../../lib/churchInfo';
import { localize } from '../../lib/siteCopy';

const VisitOverview = ({ lang }: { lang: Language }) => {
  const { churchInfo, siteCopy } = useSiteSettings();
  const visit = siteCopy.home.visit;

  return (
    <section className="home-section home-visit" id="visit">
      <div className="home-visit__content">
        <p className="home-kicker">{localize(visit.kicker, lang)}</p>
        <h2>{localize(visit.title, lang)}</h2>
        <p className="home-visit__intro">{localize(visit.intro, lang)}</p>

        <dl className="home-visit__details">
          <div>
            <dt>{localize(visit.serviceTimes, lang)}</dt>
            <dd>{formatSundayServices(churchInfo.services, lang)}</dd>
          </div>
          <div>
            <dt>{localize(visit.whatToExpectLabel, lang)}</dt>
            <dd>{localize(visit.whatToExpect, lang)}</dd>
          </div>
          <div>
            <dt>{localize(visit.childrenLabel, lang)}</dt>
            <dd>{localize(visit.children, lang)}</dd>
          </div>
          <div>
            <dt>{localize(visit.addressLabel, lang)}</dt>
            <dd>{formatFullAddress(churchInfo)}</dd>
          </div>
        </dl>

        <a
          href={directionsUrl(churchInfo.mapsQuery)}
          className="home-button home-button--primary"
          target="_blank"
          rel="noreferrer"
        >
          {localize(visit.mapsCta, lang)}
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="home-visit__map">
        <iframe
          title={churchInfo.churchNameEn}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapsEmbedUrl(churchInfo.mapsQuery)}
        />
        <span className="home-visit__map-label">
          <strong>{churchInfo.churchNameEn}</strong>
          <small>{churchInfo.suburb}</small>
        </span>
      </div>
    </section>
  );
};

export default VisitOverview;
