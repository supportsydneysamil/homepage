import Link from 'next/link';
import type { NextPage } from 'next';
import { FormEvent, useState } from 'react';
import HomeHero from '../components/home/HomeHero';
import QuickInfo from '../components/home/QuickInfo';
import WeeklyHighlights from '../components/home/WeeklyHighlights';
import type { WeeklyItem } from '../components/home/homeContent';
import weeklyData from '../content/weekly.json';
import { useLanguage } from '../lib/LanguageContext';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const FORM_ENDPOINT = 'https://formsubmit.co/ajax/support@sydneysamil.org';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const pastorImage = '/pastor.jpg';

  const [visitStatus, setVisitStatus] = useState<FormStatus>('idle');
  const [connectStatus, setConnectStatus] = useState<FormStatus>('idle');
  const [matchStatus, setMatchStatus] = useState<FormStatus>('idle');
  const [prayerStatus, setPrayerStatus] = useState<FormStatus>('idle');

  const submitForm = async (
    event: FormEvent<HTMLFormElement>,
    setStatus: (status: FormStatus) => void,
    formType: string,
  ) => {
    event.preventDefault();
    setStatus('submitting');

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.append('formType', formType);
    formData.append('lang', lang);

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
    }
  };

  const items = weeklyData.items as WeeklyItem[];

  return (
    <div className="home-page">
      <HomeHero lang={lang} />
      <QuickInfo lang={lang} />

      <section className="section" id="visit-intro">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '처음 방문 안내' : 'Plan your visit'}</p>
          <h2>{isKo ? '방문 핵심 정보' : 'Visit essentials'}</h2>
          <p className="muted">
            {isKo
              ? '예배 소요시간, 복장, 예배 분위기부터 주차와 아이 체크인까지 한 번에 안내합니다.'
              : 'From service length and dress code to parking and kids check-in, here is what to expect.'}
          </p>
        </div>
        <div className="visit-grid">
          <div className="card visit-card">
            <h3>{isKo ? '예배 요약' : 'Service snapshot'}</h3>
            <ul className="visit-list">
              <li>{isKo ? '소요시간: 약 75~90분' : 'Length: about 75-90 minutes'}</li>
              <li>{isKo ? '복장: 편안한 복장' : 'Dress: come as you are'}</li>
              <li>{isKo ? '분위기: 현대적 찬양과 말씀 중심' : 'Atmosphere: modern worship, Bible-centered'}</li>
            </ul>
          </div>
          <div className="card visit-card" id="visit-map">
            <h3>{isKo ? '주차 및 입구' : 'Parking and entry'}</h3>
            <p className="muted">
              {isKo
                ? '주차 위치와 입구 안내를 확인하세요. 사진 안내는 곧 추가됩니다.'
                : 'Check parking and entry details. Photo guidance will be added soon.'}
            </p>
            <div className="map-embed">
              <iframe
                title="Church location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120&output=embed"
              />
            </div>
            <div className="visit-actions">
              <p className="muted">Corner Bellamy St & Boundary Rd Pennant Hills NSW 2120</p>
              <a className="button text" href="https://maps.google.com/?q=Corner%20Bellamy%20St%20%26%20Boundary%20Rd%20Pennant%20Hills%20NSW%202120" target="_blank" rel="noreferrer">
                {isKo ? '길찾기' : 'Get directions'}
              </a>
            </div>
            <div className="visit-photo-placeholder">{isKo ? '입구 사진 자리' : 'Entry photo placeholder'}</div>
          </div>
          <div className="card visit-card">
            <h3>{isKo ? 'Kids 안내' : 'Kids check-in'}</h3>
            <ul className="visit-list">
              <li>{isKo ? '체크인: 예배 시작 15분 전 권장' : 'Check-in: arrive 15 minutes early'}</li>
              <li>{isKo ? '픽업: 예배 종료 후 안내에 따라' : 'Pick-up: follow host guidance after service'}</li>
              <li>{isKo ? '연령대: 유아~초등 (상세 업데이트 예정)' : 'Ages: toddlers to elementary (details soon)'}</li>
            </ul>
          </div>
          <div className="card visit-card">
            <h3>{isKo ? '언어 안내' : 'Language support'}</h3>
            <ul className="visit-list">
              <li>{isKo ? '예배: 한국어 중심' : 'Service: primarily Korean'}</li>
              <li>{isKo ? '영어 안내: 환영/안내 지원' : 'English help available for hosts'}</li>
              <li>{isKo ? '통역 여부: 추후 업데이트 예정' : 'Interpretation: details coming soon'}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="visit-form">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '방문 등록' : 'Plan a visit'}</p>
          <h2>{isKo ? '30초 방문 등록' : '30-second visit form'}</h2>
          <p className="muted">
            {isKo
              ? '간단히 알려주시면 예배 안내와 체크인을 미리 준비해 둘게요.'
              : 'Let us know you are coming and we will prepare to welcome you.'}
          </p>
        </div>
        <form className="form card" onSubmit={(event) => submitForm(event, setVisitStatus, 'visit')}>
          <label className="form__field">
            <span>{isKo ? '이름' : 'Name'}</span>
            <input type="text" name="name" placeholder={isKo ? '이름을 입력하세요' : 'Your name'} required />
          </label>
          <label className="form__field">
            <span>{isKo ? '연락처' : 'Contact'}</span>
            <input type="text" name="contact" placeholder={isKo ? '전화번호 또는 이메일' : 'Phone or email'} required />
          </label>
          <label className="form__field">
            <span>{isKo ? '방문 예정 예배' : 'Planned service'}</span>
            <select name="service" required>
              <option value="">{isKo ? '선택해주세요' : 'Select one'}</option>
              <option value="9:30">{isKo ? '9:30 예배' : '9:30 service'}</option>
              <option value="11:00">{isKo ? '11:00 예배' : '11:00 service'}</option>
            </select>
          </label>
          <label className="form__field">
            <span>{isKo ? '아이 동반 여부' : 'Bringing kids?'}</span>
            <select name="kids">
              <option value="">{isKo ? '선택해주세요' : 'Select one'}</option>
              <option value="yes">{isKo ? '네' : 'Yes'}</option>
              <option value="no">{isKo ? '아니요' : 'No'}</option>
            </select>
          </label>
          <label className="form__field">
            <span>{isKo ? '문의사항' : 'Questions'}</span>
            <textarea name="message" rows={4} placeholder={isKo ? '궁금한 점을 알려주세요' : 'Let us know how we can help'} />
          </label>
          <button type="submit" className="button" disabled={visitStatus === 'submitting'}>
            {visitStatus === 'submitting' ? (isKo ? '보내는 중...' : 'Sending...') : isKo ? '방문 등록하기' : 'Submit visit' }
          </button>
          {visitStatus === 'success' && (
            <p className="success-text">
              {isKo
                ? '등록이 완료되었습니다. 전화/이메일로 안내드리며, 추후 카톡 안내도 제공 예정입니다.'
                : 'Thanks! We will follow up via phone or email, and KakaoTalk updates will be available soon.'}
            </p>
          )}
          {visitStatus === 'error' && (
            <p className="error-text">{isKo ? '전송에 실패했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.'}</p>
          )}
        </form>
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

      <WeeklyHighlights items={items} lang={lang} />

      <section className="section" id="connect">
        <div className="section__header">
          <p className="eyebrow">{isKo ? '함께 연결' : 'Get connected'}</p>
          <h2>{isKo ? '참여도 안내' : 'Next steps for you'}</h2>
          <p className="muted">
            {isKo
              ? '새가족 안내, 목장/소그룹 연결, 기도 요청까지 바로 신청하세요.'
              : 'Request newcomer info, small group matching, or prayer support in minutes.'}
          </p>
        </div>
        <div className="cta-grid">
          <div className="card cta-card">
            <h3>{isKo ? '새가족 안내 받기' : 'Newcomer info'}</h3>
            <p className="muted">{isKo ? '처음 오신 분들을 위한 안내를 보내드립니다.' : 'We will send you a quick guide to help you feel at home.'}</p>
            <form className="form" onSubmit={(event) => submitForm(event, setConnectStatus, 'connect')}>
              <label className="form__field">
                <span>{isKo ? '이름' : 'Name'}</span>
                <input type="text" name="name" required />
              </label>
              <label className="form__field">
                <span>{isKo ? '연락처' : 'Contact'}</span>
                <input type="text" name="contact" required />
              </label>
              <label className="form__field">
                <span>{isKo ? '궁금한 점' : 'Questions'}</span>
                <textarea name="message" rows={3} />
              </label>
              <button type="submit" className="button" disabled={connectStatus === 'submitting'}>
                {connectStatus === 'submitting' ? (isKo ? '보내는 중...' : 'Sending...') : isKo ? '안내 요청' : 'Request info'}
              </button>
              {connectStatus === 'success' && (
                <p className="success-text">
                  {isKo
                    ? '요청이 접수되었습니다. 전화/이메일로 안내드리며, 추후 카톡 안내도 제공 예정입니다.'
                    : 'Request received. We will follow up by phone or email, with KakaoTalk updates soon.'}
                </p>
              )}
              {connectStatus === 'error' && (
                <p className="error-text">{isKo ? '전송에 실패했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.'}</p>
              )}
            </form>
          </div>

          <div className="card cta-card">
            <h3>{isKo ? '목장/소그룹 연결 요청' : 'Small group matching'}</h3>
            <p className="muted">{isKo ? '지역/연령/관심사에 맞는 모임을 연결합니다.' : 'We will match you by location, age, and interests.'}</p>
            <form className="form" onSubmit={(event) => submitForm(event, setMatchStatus, 'matching')}>
              <label className="form__field">
                <span>{isKo ? '이름' : 'Name'}</span>
                <input type="text" name="name" required />
              </label>
              <label className="form__field">
                <span>{isKo ? '연락처' : 'Contact'}</span>
                <input type="text" name="contact" required />
              </label>
              <label className="form__field">
                <span>{isKo ? '지역' : 'Region'}</span>
                <select name="region" required>
                  <option value="">{isKo ? '선택해주세요' : 'Select one'}</option>
                  <option value="north">{isKo ? '북부' : 'North'}</option>
                  <option value="central">{isKo ? '중부' : 'Central'}</option>
                  <option value="south">{isKo ? '남부' : 'South'}</option>
                  <option value="other">{isKo ? '기타' : 'Other'}</option>
                </select>
              </label>
              <label className="form__field">
                <span>{isKo ? '연령대' : 'Age range'}</span>
                <select name="age" required>
                  <option value="">{isKo ? '선택해주세요' : 'Select one'}</option>
                  <option value="20s">20s</option>
                  <option value="30s">30s</option>
                  <option value="40s">40s</option>
                  <option value="50s">50s+</option>
                </select>
              </label>
              <label className="form__field">
                <span>{isKo ? '관심사' : 'Interests'}</span>
                <input type="text" name="interests" placeholder={isKo ? '예: 육아, 찬양, 청년' : 'e.g., families, worship, youth'} />
              </label>
              <button type="submit" className="button" disabled={matchStatus === 'submitting'}>
                {matchStatus === 'submitting' ? (isKo ? '보내는 중...' : 'Sending...') : isKo ? '연결 요청' : 'Request match'}
              </button>
              {matchStatus === 'success' && (
                <p className="success-text">
                  {isKo
                    ? '요청이 접수되었습니다. 전화/이메일로 안내드리며, 추후 카톡 안내도 제공 예정입니다.'
                    : 'Request received. We will follow up by phone or email, with KakaoTalk updates soon.'}
                </p>
              )}
              {matchStatus === 'error' && (
                <p className="error-text">{isKo ? '전송에 실패했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.'}</p>
              )}
            </form>
          </div>

          <div className="card cta-card">
            <h3>{isKo ? '기도 요청' : 'Prayer request'}</h3>
            <p className="muted">{isKo ? '익명으로도 요청할 수 있습니다.' : 'Anonymous requests are welcome.'}</p>
            <form className="form" onSubmit={(event) => submitForm(event, setPrayerStatus, 'prayer')}>
              <label className="form__field">
                <span>{isKo ? '이름 (선택)' : 'Name (optional)'}</span>
                <input type="text" name="name" />
              </label>
              <label className="form__field">
                <span>{isKo ? '연락처 (선택)' : 'Contact (optional)'}</span>
                <input type="text" name="contact" />
              </label>
              <label className="form__field checkbox">
                <input type="checkbox" name="anonymous" value="yes" />
                <span>{isKo ? '익명으로 요청합니다' : 'Request anonymously'}</span>
              </label>
              <label className="form__field">
                <span>{isKo ? '기도 제목' : 'Prayer request'}</span>
                <textarea name="message" rows={4} required />
              </label>
              <button type="submit" className="button" disabled={prayerStatus === 'submitting'}>
                {prayerStatus === 'submitting' ? (isKo ? '보내는 중...' : 'Sending...') : isKo ? '기도 요청하기' : 'Submit request'}
              </button>
              {prayerStatus === 'success' && (
                <p className="success-text">
                  {isKo
                    ? '요청이 접수되었습니다. 전화/이메일로 안내드리며, 추후 카톡 안내도 제공 예정입니다.'
                    : 'Request received. We will follow up by phone or email, with KakaoTalk updates soon.'}
                </p>
              )}
              {prayerStatus === 'error' && (
                <p className="error-text">{isKo ? '전송에 실패했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.'}</p>
              )}
            </form>
          </div>
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
              <Link href="/#visit-form" className="button">
                {isKo ? '연락하기' : 'Contact'}
              </Link>
              <Link href="/#visit-intro" className="button ghost">
                {isKo ? '방문 안내' : 'Plan a visit'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

Home.meta = {
  title: 'Home',
  description: 'Welcome to Community Church online.',
};

export default Home;
