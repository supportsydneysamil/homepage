import type { NextPage } from 'next';
import Link from 'next/link';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';

const DIRECTIONS_URL =
  'https://maps.google.com/?q=Corner+Bellamy+St+%26+Boundary+Rd+Pennant+Hills+NSW+2120';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <article className="site-page worship-page">
      <PageHero
        eyebrow={isKo ? '예배 안내' : 'Worship with us'}
        title={isKo ? '이번 주일, 함께 예배해요' : 'There is a place for you this Sunday'}
        description={
          isKo
            ? '말씀과 찬양 안에서 하나님을 만나고, 따뜻한 공동체와 새로운 한 주를 시작하세요.'
            : 'Encounter God through Scripture and worship, and begin a new week with a welcoming community.'
        }
        actions={
          <>
            <a className="site-button site-button--primary" href={DIRECTIONS_URL} target="_blank" rel="noreferrer">
              {isKo ? '길찾기' : 'Get directions'} <span aria-hidden="true">→</span>
            </a>
            <Link className="site-button site-button--quiet" href="/contact">
              {isKo ? '방문 문의' : 'Ask about your visit'}
            </Link>
          </>
        }
      />

      <section className="worship-times">
        <div className="worship-times__intro">
          <p className="site-kicker">{isKo ? '주일 예배' : 'Sunday gatherings'}</p>
          <h2>{isKo ? '두 번의 예배, 하나의 공동체' : 'Two services, one community'}</h2>
          <p>{isKo ? '편안한 복장으로 부담 없이 오세요.' : 'Come as you are. You will be warmly welcomed.'}</p>
        </div>
        <div className="worship-time"><span>01</span><strong>9:30</strong><small>AM</small></div>
        <div className="worship-time"><span>02</span><strong>11:00</strong><small>AM · KIDS</small></div>
      </section>

      <section className="worship-details">
        <article>
          <span>WED</span>
          <h3>{isKo ? '수요 기도회' : 'Wednesday prayer'}</h3>
          <p>{isKo ? '수요일 저녁 8:00 · 온라인' : 'Wednesday 8:00 PM · Online'}</p>
        </article>
        <article>
          <span>SUN</span>
          <h3>{isKo ? '생명의 삶 공부' : 'Life Bible study'}</h3>
          <p>{isKo ? '주일 오후 2:30' : 'Sunday 2:30 PM'}</p>
        </article>
        <article>
          <span>HERE</span>
          <h3>{isKo ? '오시는 곳' : 'Where we meet'}</h3>
          <p>Corner Bellamy St &amp; Boundary Rd, Pennant Hills NSW 2120</p>
        </article>
      </section>
    </article>
  );
};

Worship.meta = {
  title: 'Worship',
  description: 'Service times and location for Sydney Samil Church.',
};

export default Worship;
