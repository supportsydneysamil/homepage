import Link from 'next/link';
import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <>
      <section className="hero hero--art">
        <div className="hero__bg">
          <img
            src="https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1400&q=80"
            alt={isKo ? '교회 예배 모임' : 'Church gathering'}
          />
          <div className="hero__gradient" />
        </div>
        <div className="hero__content">
          <p className="pill">{isKo ? '웰컴 홈' : 'Welcome Home'}</p>
          <h1 className="hero-title">{isKo ? '도시를 위한 교회' : 'A church for the city'}</h1>
          <p className="lead">
            {isKo
              ? '현대적인 예배와 진짜 공동체, 그리고 시드를 사랑하는 담대한 사명. 예수님을 높이고 이웃을 섬기는 시드니 삼일 교회에 함께하세요.'
              : 'Modern worship, authentic community, and a bold mission to love Sydney. Join us as we lift up Jesus and serve our neighbors with creativity and compassion.'}
          </p>
          <div className="hero__actions">
            <Link href="/worship" className="button">
              {isKo ? '예배 안내' : 'Plan a Visit'}
            </Link>
            <Link href="/events" className="button ghost">
              {isKo ? '일정 보기' : "See What's On"}
            </Link>
          </div>
          <div className="hero__stats">
            <div className="stat">
              <span className="stat__number">2</span>
              <span className="stat__label">{isKo ? '주일 예배' : 'Sunday gatherings'}</span>
            </div>
            <div className="stat">
              <span className="stat__number">20+</span>
              <span className="stat__label">{isKo ? '섬김 팀' : 'Serving teams'}</span>
            </div>
            <div className="stat">
              <span className="stat__number">50+</span>
              <span className="stat__label">{isKo ? '소그룹' : 'Small groups'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '우리의 방향' : "What we're about"}</p>
          <h2>{isKo ? '예배 · 성장 · 사명' : 'Worship. Formation. Mission.'}</h2>
          <p className="muted">
            {isKo ? '예수님과 도시를 사랑하는 세대를 위한 교회' : 'Designed for a generation that loves Jesus and our city.'}
          </p>
        </div>
        <div className="card-grid feature-grid">
          <div className="card feature-card">
            <div className="feature-icon">✦</div>
            <h3>{isKo ? '크리에이티브 예배' : 'Creative worship'}</h3>
            <p>{isKo ? '현대적 음악과 오래된 기도로 하나님을 만나는 공간.' : 'Modern music, ancient prayers, and space to encounter God.'}</p>
            <Link href="/worship" className="button text">
              {isKo ? '예배 시간' : 'Service times'}
            </Link>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">➜</div>
            <h3>{isKo ? '모여서 함께' : 'Events that gather'}</h3>
            <p>{isKo ? '리트릿, 대화, 아웃리치로 함께 성장합니다.' : 'Retreats, conversations, and city outreach that move you forward.'}</p>
            <Link href="/events" className="button text">
              {isKo ? '이벤트 보기' : 'Explore events'}
            </Link>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">☉</div>
            <h3>{isKo ? '언제나 설교' : 'Sermons on demand'}</h3>
            <p>{isKo ? '언제 어디서나 최신 메시지를 시청하세요.' : 'Watch the latest messages anywhere, anytime.'}</p>
            <Link href="/sermons" className="button text">
              {isKo ? '설교 보기' : 'Watch sermons'}
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '이번 주' : 'Stay in the flow'}</p>
          <h2>{isKo ? '주중에도 함께' : 'Resources for your week'}</h2>
          <p className="muted">
            {isKo ? '주보, 가이드, 영상으로 매일을 격려합니다.' : 'Bulletins, guides, and videos to keep you encouraged.'}
          </p>
          <div className="section__actions">
            <Link href="/resources" className="button">
              {isKo ? '자료 보기' : 'Browse Resources'}
            </Link>
            <Link href="/contact" className="button ghost">
              {isKo ? '담임목사에게 문의' : 'Talk to a pastor'}
            </Link>
          </div>
        </div>
        <div className="glass-card">
          <h3 className="muted">{isKo ? '하이라이트' : 'This week'}</h3>
          <ul className="highlight-list">
            <li>
              <span className="dot" />
              <span>{isKo ? '성탄 예배 — 12월 25일' : 'Christmas Service — Dec 25'}</span>
            </li>
            <li>
              <span className="dot" />
              <span>{isKo ? '새 설교: 믿음과 삶' : 'New sermon: Faith and Life'}</span>
            </li>
            <li>
              <span className="dot" />
              <span>{isKo ? '주보 다운로드' : 'Download the weekly bulletin'}</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
};

Home.meta = {
  title: 'Home',
  description: 'Welcome to Community Church online.',
};

export default Home;
