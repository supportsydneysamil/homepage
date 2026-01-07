import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '예배 안내' : 'Worship with us'}</p>
        <h1>{isKo ? '매주 함께 모입니다' : 'Gather every week'}</h1>
        <p className="muted">
          {isKo ? '커피 한 잔과 함께 일찍 오세요. 모두 환영합니다.' : 'Come early for coffee, stay to connect. Everyone is welcome.'}
        </p>
      </div>
      <div className="info-list">
        <div className="card">
          <div className="card__eyebrow">{isKo ? '주일 예배' : 'Sunday Services'}</div>
          <h3>9:00 AM | 11:00 AM</h3>
          <p className="muted">{isKo ? '두 예배 모두 유초등부 운영' : 'Kids ministry available at both gatherings.'}</p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '수요 기도회' : 'Midweek Prayer'}</div>
          <h3>{isKo ? '수요일 7:00 PM' : 'Wednesdays 7:00 PM'}</h3>
          <p className="muted">{isKo ? '예배와 기도로 함께 하나님을 구합니다.' : 'Seek God together with worship and prayer.'}</p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '주소' : 'Location'}</div>
          <h3>123 Main Street, Your City, ST 00000</h3>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="link">
            {isKo ? '구글 지도 열기' : 'Open in Google Maps'}
          </a>
        </div>
      </div>
    </section>
  );
};

Worship.meta = {
  title: 'Worship',
  description: 'Service times and location for Community Church.',
};

export default Worship;
