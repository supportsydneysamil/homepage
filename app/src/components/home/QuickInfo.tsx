import Link from 'next/link';
import type { Language } from './homeContent';

const DIRECTIONS_URL =
  'https://maps.google.com/?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const QuickInfo = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';

  return (
    <section className="home-quick-info" aria-label={isKo ? '빠른 안내' : 'Quick information'}>
      <Link href="/worship" className="home-quick-card">
        <span className="home-quick-card__number">01</span>
        <span>
          <strong>{isKo ? '주일 예배' : 'Sunday worship'}</strong>
          <small>9:30 AM · 11:00 AM</small>
        </span>
        <ArrowIcon />
      </Link>
      <Link href="#visit" className="home-quick-card">
        <span className="home-quick-card__number">02</span>
        <span>
          <strong>{isKo ? '처음 방문' : 'First time here'}</strong>
          <small>{isKo ? '미리 알아두면 좋은 안내' : 'Everything you need to know'}</small>
        </span>
        <ArrowIcon />
      </Link>
      <a
        href={DIRECTIONS_URL}
        className="home-quick-card"
        target="_blank"
        rel="noreferrer"
      >
        <span className="home-quick-card__number">03</span>
        <span>
          <strong>{isKo ? '오시는 길' : 'Find us'}</strong>
          <small>Pennant Hills, NSW</small>
        </span>
        <ArrowIcon />
      </a>
    </section>
  );
};

export default QuickInfo;
