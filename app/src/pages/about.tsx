import type { NextPage } from 'next';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { localize } from '../lib/siteCopy';

const About: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const { siteCopy } = useSiteSettings();
  const about = siteCopy.about;

  return (
    <article className="site-page about-page">
      <PageHero
        eyebrow={localize(about.eyebrow, lang)}
        title={localize(about.title, lang)}
        description={localize(about.description, lang)}
      />

      <section className="site-editorial-grid" aria-label={lang === 'ko' ? '교회 가치' : 'Church values'}>
        {about.values.map((value, index) => (
          <div className="site-editorial-item" key={`${index}-${value.title.en}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{localize(value.title, lang)}</h2>
            <p>{localize(value.body, lang)}</p>
          </div>
        ))}
      </section>

      <section className="site-quote-panel">
        <p className="site-kicker">{localize(about.quoteKicker, lang)}</p>
        <blockquote>{localize(about.quote, lang)}</blockquote>
      </section>
    </article>
  );
};

About.meta = {
  title: 'About',
  description: 'Meet Sydney Samil Church and discover our story, vision, and mission.',
};

export default About;
