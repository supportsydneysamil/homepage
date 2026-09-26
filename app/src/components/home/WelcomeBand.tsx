import { localize, welcomeFormUrl } from '../../lib/siteCopy';
import { useSiteSettings } from '../../lib/ThemeContext';
import type { Language } from './homeContent';

const WelcomeBand = ({ lang }: { lang: Language }) => {
  const { siteCopy } = useSiteSettings();
  const welcome = siteCopy.home.welcome;
  const formUrl = welcomeFormUrl(welcome);
  if (!formUrl) return null;

  return (
    <section className="home-welcome" aria-labelledby="home-welcome-title">
      <div className="home-welcome__copy">
        <p className="home-kicker">{localize(welcome.kicker, lang)}</p>
        <h2 id="home-welcome-title">{localize(welcome.title, lang)}</h2>
        <p>{localize(welcome.intro, lang)}</p>
      </div>
      <a className="home-button home-button--primary" href={formUrl} target="_blank" rel="noopener noreferrer">
        {localize(welcome.buttonLabel, lang)}
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
};

export default WelcomeBand;
