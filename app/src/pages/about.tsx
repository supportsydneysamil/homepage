import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const About: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '우리는 누구인가' : 'Who we are'}</p>
        <h1>{isKo ? '교회 소개' : 'About Our Church'}</h1>
        <p className="muted">
          {isKo
            ? '예배와 제자도, 그리고 시드니를 섬기는 마음으로 함께 자라나는 다세대 공동체입니다.'
            : 'A multi-generational church with a heart for worship, discipleship, and serving Sydney.'}
        </p>
      </div>
      <div className="card-grid three-col">
        <div className="card">
          <div className="card__eyebrow">{isKo ? '스토리' : 'Our story'}</div>
          <p>
            {isKo
              ? '작은 모임에서 시작해 예수님을 따르는 활기찬 가족으로 성장했습니다. 매주 하나님이 쓰시는 이야기에 새로운 친구들을 맞이합니다.'
              : 'We began as a small gathering and have grown into a vibrant family following Jesus together. Every week we welcome new friends into the story God is writing here.'}
          </p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '비전' : 'Vision'}</div>
          <p>
            {isKo
              ? '그리스도를 중심으로 희망을 지역과 열방에 비추는 공동체가 되는 것.'
              : 'To be a Christ-centered community that shines hope locally and globally.'}
          </p>
        </div>
        <div className="card">
          <div className="card__eyebrow">{isKo ? '미션' : 'Mission'}</div>
          <p>
            {isKo
              ? '제자를 세우고, 진정한 관계를 가꾸며, 복음을 일상에서 살아내기.'
              : 'To make disciples, cultivate authentic relationships, and live out the gospel daily.'}
          </p>
        </div>
      </div>
    </section>
  );
};

About.meta = {
  title: 'About',
  description: 'Learn about our church vision and mission.',
};

export default About;
