import { HOME_PILLARS, localize, type Language } from './homeContent';

const ChurchPillars = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';

  return (
    <section className="home-section home-pillars">
      <div className="home-section__heading home-section__heading--split">
        <div>
          <p className="home-kicker">{isKo ? '우리가 꿈꾸는 교회' : 'The church we hope to be'}</p>
          <h2>{isKo ? '믿음이 삶이 되는 공동체' : 'A community where faith becomes life'}</h2>
        </div>
        <p>
          {isKo
            ? '주일의 예배가 평일의 삶으로 이어지고, 모든 세대가 함께 자라기를 소망합니다.'
            : 'We long for Sunday worship to shape everyday life and for every generation to grow together.'}
        </p>
      </div>

      <div className="home-pillars__grid">
        {HOME_PILLARS.map((pillar) => (
          <article className="home-pillar" key={pillar.number}>
            <span>{pillar.number}</span>
            <h3>{localize(pillar.title, lang)}</h3>
            <p>{localize(pillar.description, lang)}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ChurchPillars;
