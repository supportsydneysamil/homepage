import Link from 'next/link';
import type { Language } from './homeContent';
import SitePhoto from '../SitePhoto';
import { useSiteSettings } from '../../lib/ThemeContext';
import { DEFAULT_PASTOR_IMAGE } from '../../lib/siteSettings';

const PastorFeature = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';
  const { pastorImageUrl } = useSiteSettings();

  return (
    <section className="home-section home-pastor">
      <div className="home-pastor__portrait">
        <span aria-hidden="true">SAMIL</span>
        <SitePhoto
          src={pastorImageUrl}
          fallback={DEFAULT_PASTOR_IMAGE}
          alt={isKo ? '기도하는 안상헌 담임목사' : 'Lead Pastor Sangheon Ahn praying'}
        />
      </div>

      <div className="home-pastor__content">
        <p className="home-kicker">{isKo ? '담임목사 소개' : 'Meet our pastor'}</p>
        <h2>{isKo ? '안상헌 담임목사' : 'Lead Pastor Sangheon Ahn'}</h2>
        <blockquote>
          {isKo
            ? '모든 성도가 삶의 자리에서 사역자로 서고, 다음 세대가 아름다운 믿음을 이어가도록 함께 걷겠습니다.'
            : 'We want every believer to serve where they live and the next generation to inherit a living, beautiful faith.'}
        </blockquote>
        <p>
          {isKo
            ? '가정교회 목장 사역을 통해 영혼을 구원하고 제자를 세우며, 가정과 시드니 지역사회를 섬기고 있습니다.'
            : 'Through home-church ministry, we make disciples, strengthen families, and serve the wider Sydney community.'}
        </p>
        <div className="home-pastor__contact">
          <a href="tel:+61433576500">0433 576 500</a>
          <a href="mailto:info@sydneysamil.org">info@sydneysamil.org</a>
        </div>
        <Link href="/contact" className="home-button home-button--quiet">
          {isKo ? '교회에 문의하기' : 'Contact the church'}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
};

export default PastorFeature;
