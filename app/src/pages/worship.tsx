import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '예배 안내' : 'Worship Guide'}</p>
        <h1>{isKo ? '시드니 삼일교회 예배 시간' : 'Sydney SAMIL Church Service Times'}</h1>
        <p className="muted">
          {isKo
            ? '밝고 건전하고 서로 사랑하는 공동체로 여러분을 환영합니다.'
            : 'A bright, healthy, and loving church community welcomes you.'}
        </p>
      </div>
      <div className="info-list">
        <div className="card">
          <div className="card__eyebrow">{isKo ? '주일 예배' : 'Sunday Worship'}</div>
          <h3>{isKo ? '1부 오전 9:30 / 2부 오전 11:00' : '1st 9:30 AM / 2nd 11:00 AM'}</h3>
          <p className="muted">{isKo ? '주일 어린이예배: 오전 11:00' : 'Children Worship: 11:00 AM'}</p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '주중 모임' : 'Midweek Gathering'}</div>
          <h3>{isKo ? '수요 기도회: 수요일 저녁 8:00 (온라인)' : 'Wednesday Prayer: 8:00 PM (Online)'}</h3>
          <p className="muted">
            {isKo
              ? '생명의 삶 공부: 주일 오후 2:30'
              : 'Life Bible Study: Sundays 2:30 PM'}
          </p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '오시는 길' : 'Location & Contact'}</div>
          <h3>Corner Bellamy St &amp; Boundary Rd, Pennant Hills NSW 2120</h3>
          <p className="muted">
            {isKo ? '문의: 0433 576 500 / info@sydneysamil.org' : 'Contact: 0433 576 500 / info@sydneysamil.org'}
          </p>
          <a
            href="https://maps.google.com/?q=Corner+Bellamy+St+%26+Boundary+Rd+Pennant+Hills+NSW+2120"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            {isKo ? '구글 지도에서 보기' : 'View on Google Maps'}
          </a>
        </div>
      </div>
      <div className="section" style={{ marginTop: '1.5rem' }}>
        <p className="muted">
          {isKo
            ? '온라인 주일예배 참석은 교회 연락처로 문의해 주세요.'
            : 'For online Sunday worship participation, please contact the church.'}
        </p>
      </div>
    </section>
  );
};

Worship.meta = {
  title: 'Worship | Sydney SAMIL Church',
  description: 'Service times, location, and contact details for Sydney SAMIL Church.',
};

export default Worship;
