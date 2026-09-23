import Link from 'next/link';
import type { Language } from './homeContent';
import { useSiteSettings } from '../../lib/ThemeContext';
import { localize } from '../../lib/siteCopy';

const NextSteps = ({ lang }: { lang: Language }) => {
  const { siteCopy } = useSiteSettings();
  const nextSteps = siteCopy.home.nextSteps;

  return (
    <section className="home-section home-next-steps">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{localize(nextSteps.kicker, lang)}</p>
          <h2>{localize(nextSteps.title, lang)}</h2>
        </div>
        <p>{localize(nextSteps.intro, lang)}</p>
      </div>

      <div className="home-next-steps__grid">
        {nextSteps.items.map((step, index) => (
          <article className="home-next-step" key={step.href}>
            <span className="home-next-step__number">0{index + 1}</span>
            <h3>{localize(step.title, lang)}</h3>
            <p>{localize(step.description, lang)}</p>
            <Link href={step.href}>
              {localize(step.label, lang)}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NextSteps;
