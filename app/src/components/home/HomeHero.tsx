import Link from 'next/link';
import type { Language } from './homeContent';

const DIRECTIONS_URL =
  'https://maps.google.com/?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120';

const HomeHero = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';

  return (
    <section className="home-hero">
      <div className="home-hero__copy">
        <p className="home-kicker">Sydney · Community · Faith</p>
        <h1>
          {isKo ? (
            <>
              처음 오셔도,
              <br />
              편안한 교회
            </>
          ) : (
            <>
              A place to belong,
              <br />
              a faith to live
            </>
          )}
        </h1>
        <p className="home-hero__lead">
          {isKo
            ? '함께 예배하고, 삶을 나누며, 믿음 안에서 자라는 시드니 삼일교회입니다.'
            : 'Sydney Samil Church is a community where we worship, share life, and grow in faith together.'}
        </p>
        <div className="home-hero__actions">
          <Link href="#visit" className="home-button home-button--primary">
            {isKo ? '방문 안내 보기' : 'Plan your visit'}
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href={DIRECTIONS_URL}
            className="home-button home-button--quiet"
            target="_blank"
            rel="noreferrer"
          >
            {isKo ? '오시는 길' : 'Get directions'}
          </a>
        </div>
      </div>

      <div className="home-hero__visual">
        <span className="home-hero__shape home-hero__shape--round" aria-hidden="true" />
        <span className="home-hero__shape home-hero__shape--gold" aria-hidden="true" />
        <div className="home-hero__photo">
          <img
            src="/church-bg.png"
            alt={
              isKo
                ? '푸른 하늘과 잔디가 보이는 시드니 삼일교회 외관'
                : 'Sydney Samil Church building beneath a blue sky'
            }
          />
        </div>
        <div className="home-hero__service-note">
          <span>{isKo ? '이번 주일' : 'This Sunday'}</span>
          <strong>9:30 · 11:00 AM</strong>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
