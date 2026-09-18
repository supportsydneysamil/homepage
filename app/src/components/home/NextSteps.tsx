import Link from 'next/link';
import { NEXT_STEPS, localize, type Language } from './homeContent';

const NextSteps = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';

  return (
    <section className="home-section home-next-steps">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{isKo ? '다음 걸음' : 'Your next step'}</p>
          <h2>{isKo ? '어디서부터 시작할까요?' : 'Where would you like to begin?'}</h2>
        </div>
        <p>
          {isKo
            ? '궁금한 점이나 도움이 필요한 부분을 알려주세요. 편안하게 연결해 드리겠습니다.'
            : 'Tell us what you need or what you are curious about. We would love to help you connect.'}
        </p>
      </div>

      <div className="home-next-steps__grid">
        {NEXT_STEPS.map((step, index) => (
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
