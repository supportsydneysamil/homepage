import type { Language } from './homeContent';

const DIRECTIONS_URL =
  'https://maps.google.com/?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120';

const VisitOverview = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';

  return (
    <section className="home-section home-visit" id="visit">
      <div className="home-visit__content">
        <p className="home-kicker">{isKo ? '처음 방문 안내' : 'Your first Sunday'}</p>
        <h2>{isKo ? '부담 없이 오세요' : 'Come just as you are'}</h2>
        <p className="home-visit__intro">
          {isKo
            ? '처음 방문하는 마음을 알기에, 꼭 필요한 정보만 미리 알려드립니다.'
            : 'We know a first visit can feel unfamiliar, so here is everything you need before you arrive.'}
        </p>

        <dl className="home-visit__details">
          <div>
            <dt>{isKo ? '예배 시간' : 'Service times'}</dt>
            <dd>
              {isKo
                ? '주일 오전 9:30 (1부 · 어린이) · 11:00 (2부 · 메인)'
                : 'Sunday 9:30 AM (first · kids) · 11:00 AM (second · main)'}
            </dd>
          </div>
          <div>
            <dt>{isKo ? '예배 분위기' : 'What to expect'}</dt>
            <dd>
              {isKo
                ? '약 75–90분, 편안한 복장, 찬양과 말씀 중심'
                : '75–90 minutes, relaxed dress, worship and a Bible-centred message'}
            </dd>
          </div>
          <div>
            <dt>{isKo ? '어린이와 언어' : 'Children and language'}</dt>
            <dd>
              {isKo
                ? '9시 30분 어린이 예배 · 한국어 중심, 영어 안내 가능'
                : 'Kids worship at 9:30 · Korean service with English welcome support'}
            </dd>
          </div>
          <div>
            <dt>{isKo ? '주소' : 'Address'}</dt>
            <dd>Corner Bellamy St &amp; Boundary Rd, Pennant Hills NSW 2120</dd>
          </div>
        </dl>

        <a
          href={DIRECTIONS_URL}
          className="home-button home-button--primary"
          target="_blank"
          rel="noreferrer"
        >
          {isKo ? 'Google Maps로 길찾기' : 'Open in Google Maps'}
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="home-visit__map">
        <iframe
          title={isKo ? '시드니 삼일교회 위치' : 'Sydney Samil Church location'}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120&output=embed"
        />
        <span className="home-visit__map-label">
          <strong>Sydney Samil Church</strong>
          <small>Pennant Hills, NSW</small>
        </span>
      </div>
    </section>
  );
};

export default VisitOverview;
