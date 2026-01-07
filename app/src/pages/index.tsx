import Link from 'next/link';
import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const pastorImage =
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80';

  return (
    <>
      <section className="hero hero--art">
        <div className="hero__bg motion-bg">
          <div className="blob blob--one" />
          <div className="blob blob--two" />
          <div className="blob blob--three" />
          <div className="hero__bg-image">
            <img
              src="https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1400&q=80"
              alt={isKo ? '교회 예배 모임' : 'Church gathering'}
            />
          </div>
          <div className="hero__gradient" />
        </div>
        <div className="hero__content">
          <p className="pill">{isKo ? '시드니 삼일 교회' : 'Sydney Samil Church'}</p>
          <h1 className="hero-title">{isKo ? '도시를 위한 따뜻한 교회' : 'A church for the city'}</h1>
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
          <p className="eyebrow">{isKo ? '교회 소개' : 'Our heartbeat'}</p>
          <h2>{isKo ? '평신도 사역자를 키우는 교회' : 'Raising everyday ministers'}</h2>
          <p className="muted">
            {isKo
              ? '가정교회 목장 사역을 통해 평신도 사역자를 키우고 자녀에게 아름다운 신앙을 전수하며 영혼 구원하여 제자 삼는 교회입니다.'
              : 'Through home church ministry, we raise lay leaders, pass on faith to the next generation, and make disciples with a heart for the city.'}
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
          <div className="card feature-card">
            <div className="feature-icon">♥</div>
            <h3>{isKo ? '자녀 교육 책임' : 'Raising the next generation'}</h3>
            <p>
              {isKo
                ? '어린이·청소년에게 복음과 사랑을 전하며 가정을 세우는 교육.'
                : 'Forming kids and youth with the gospel, partnering with families to flourish.'}
            </p>
            <Link href="/about" className="button text">
              {isKo ? '교회 소개' : 'About us'}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '예배 및 모임' : 'Gatherings'}</p>
          <h2>{isKo ? '함께 드리는 시간' : 'When we gather'}</h2>
          <p className="muted">
            {isKo
              ? '주일과 주중에 다양한 예배와 모임이 준비되어 있습니다.'
              : 'Join us on Sundays and throughout the week for worship and prayer.'}
          </p>
        </div>
        <div className="service-grid">
          <div className="card service-card">
            <div className="badge">{isKo ? '주일 1부' : 'Sunday 1st'}</div>
            <h3>9:30 AM</h3>
            <p className="muted">{isKo ? '주일 예배' : 'Sunday Worship'}</p>
          </div>
          <div className="card service-card">
            <div className="badge">{isKo ? '주일 2부' : 'Sunday 2nd'}</div>
            <h3>11:00 AM</h3>
            <p className="muted">{isKo ? '주일 예배 & 어린이예배' : 'Sunday Worship + Kids'}</p>
          </div>
          <div className="card service-card">
            <div className="badge">{isKo ? '어린이 예배' : 'Kids'}</div>
            <h3>11:00 AM</h3>
            <p className="muted">{isKo ? '주일 어린이예배' : 'Kids Worship'}</p>
          </div>
          <div className="card service-card">
            <div className="badge">{isKo ? '생명의 삶' : 'Life Class'}</div>
            <h3>2:30 PM</h3>
            <p className="muted">{isKo ? '주일' : 'Sundays'}</p>
          </div>
          <div className="card service-card">
            <div className="badge">{isKo ? '자녀 기도회' : 'Parents Prayer'}</div>
            <h3>{isKo ? '월요일 9:00 PM' : 'Mondays 9:00 PM'}</h3>
            <p className="muted">{isKo ? '온라인' : 'Online'}</p>
          </div>
          <div className="card service-card">
            <div className="badge">{isKo ? '수요 기도회' : 'Midweek Prayer'}</div>
            <h3>{isKo ? '수요일 8:00 PM' : 'Wednesdays 8:00 PM'}</h3>
            <p className="muted">{isKo ? '온라인' : 'Online'}</p>
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

      <section className="section">
        <div className="section__header">
          <p className="pill">{isKo ? '담임목사 소개' : 'Meet our pastor'}</p>
          <h2>{isKo ? '안상헌 담임목사' : 'Lead Pastor Sangheon Ahn'}</h2>
          <p className="muted">
            {isKo
              ? '평신도 사역자를 세우고 가정을 세우는 목회로 시드니를 섬기고 있습니다.'
              : 'Serving Sydney by equipping everyday ministers and strengthening families.'}
          </p>
        </div>
        <div className="pastor-card">
          <div className="pastor-card__image">
            <img src={pastorImage} alt={isKo ? '안상헌 담임목사' : 'Pastor Sangheon Ahn'} />
          </div>
          <div className="pastor-card__body">
            <p className="muted">
              {isKo
                ? '가정교회 목장 사역을 통해 모든 성도가 사역자로 서고, 다음 세대가 복음 안에서 자라도록 헌신하고 있습니다.'
                : 'Through home church ministry, he empowers every believer to minister and helps the next generation grow in the gospel.'}
            </p>
            <div className="contact-grid">
              <div>
                <p className="card__eyebrow">{isKo ? '주소' : 'Address'}</p>
                <p>Corner Bellamy St & Boundary Rd Pennant Hills NSW 2120</p>
              </div>
              <div>
                <p className="card__eyebrow">{isKo ? '전화' : 'Phone'}</p>
                <p>0433 576 500</p>
              </div>
              <div>
                <p className="card__eyebrow">Email</p>
                <p>info@sydneysamil.org</p>
              </div>
            </div>
            <div className="pastor-card__links">
              <Link href="/contact" className="button">
                {isKo ? '문의하기' : 'Contact us'}
              </Link>
              <Link href="/worship" className="button ghost">
                {isKo ? '예배 안내' : 'Visit us'}
              </Link>
            </div>
          </div>
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
