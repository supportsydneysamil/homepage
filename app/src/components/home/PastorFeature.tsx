import Link from 'next/link';
import type { Language } from './homeContent';
import SitePhoto from '../SitePhoto';
import { useSiteSettings } from '../../lib/ThemeContext';
import { DEFAULT_PASTOR_IMAGE } from '../../lib/siteSettings';
import { phoneHref } from '../../lib/churchInfo';
import { localize } from '../../lib/siteCopy';

const PastorFeature = ({ lang }: { lang: Language }) => {
  const { pastorImageUrl, churchInfo, siteCopy } = useSiteSettings();
  const pastor = siteCopy.home.pastor;
  const name = lang === 'ko' ? churchInfo.pastorNameKo : churchInfo.pastorNameEn;

  return (
    <section className="home-section home-pastor">
      <div className="home-pastor__portrait">
        <span aria-hidden="true">SAMIL</span>
        <SitePhoto
          src={pastorImageUrl}
          fallback={DEFAULT_PASTOR_IMAGE}
          alt={localize(pastor.photoAlt, lang)}
        />
      </div>

      <div className="home-pastor__content">
        <p className="home-kicker">{localize(pastor.kicker, lang)}</p>
        <h2>{name}</h2>
        <blockquote>{localize(pastor.quote, lang)}</blockquote>
        <p>{localize(pastor.body, lang)}</p>
        <div className="home-pastor__contact">
          <a href={phoneHref(churchInfo.phone)}>{churchInfo.phone}</a>
          <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
        </div>
        <Link href="/contact" className="home-button home-button--quiet">
          {localize(pastor.contactCta, lang)}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
};

export default PastorFeature;
