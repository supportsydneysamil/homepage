import type { Language } from './homeContent';
import { useSiteSettings } from '../../lib/ThemeContext';
import { localize } from '../../lib/siteCopy';

const ChurchPillars = ({ lang }: { lang: Language }) => {
  const { siteCopy } = useSiteSettings();
  const pillars = siteCopy.home.pillars;

  return (
    <section className="home-section home-pillars">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{localize(pillars.kicker, lang)}</p>
          <h2>{localize(pillars.title, lang)}</h2>
        </div>
        <p>{localize(pillars.intro, lang)}</p>
      </div>

      <div className="home-pillars__grid">
        {pillars.items.map((pillar, index) => (
          <article className="home-pillar" key={`${index}-${pillar.title.en}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{localize(pillar.title, lang)}</h3>
            <p>{localize(pillar.body, lang)}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ChurchPillars;
