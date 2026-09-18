import type { NextPage } from 'next';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';

const About: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const values = [
    {
      number: '01',
      title: isKo ? '우리의 이야기' : 'Our story',
      body: isKo
        ? '작은 모임에서 시작해 예수님을 함께 따르는 다세대 공동체로 성장했습니다.'
        : 'We began as a small gathering and grew into a multi-generational community following Jesus together.',
    },
    {
      number: '02',
      title: isKo ? '우리의 비전' : 'Our vision',
      body: isKo
        ? '그리스도를 중심으로 시드니와 열방에 복음의 소망을 비추는 공동체를 꿈꿉니다.'
        : 'We envision a Christ-centred community shining gospel hope across Sydney and beyond.',
    },
    {
      number: '03',
      title: isKo ? '우리의 사명' : 'Our mission',
      body: isKo
        ? '영혼을 구원하고 제자를 세우며, 진실한 관계 속에서 복음을 일상으로 살아냅니다.'
        : 'We make disciples, nurture authentic relationships, and live the gospel in everyday life.',
    },
  ];

  return (
    <article className="site-page about-page">
      <PageHero
        eyebrow={isKo ? '우리는 누구인가' : 'Who we are'}
        title={isKo ? '함께 믿고, 함께 자라는 교회' : 'A church growing in faith, together'}
        description={
          isKo
            ? '예배와 가정교회, 다음 세대를 세우는 일로 시드니를 섬기는 공동체입니다.'
            : 'We serve Sydney through worship, home-church community, and faith for the next generation.'
        }
      />

      <section className="site-editorial-grid" aria-label={isKo ? '교회 가치' : 'Church values'}>
        {values.map((value) => (
          <div className="site-editorial-item" key={value.number}>
            <span>{value.number}</span>
            <h2>{value.title}</h2>
            <p>{value.body}</p>
          </div>
        ))}
      </section>

      <section className="site-quote-panel">
        <p className="site-kicker">{isKo ? '우리의 고백' : 'Our heartbeat'}</p>
        <blockquote>
          {isKo
            ? '주일의 예배가 평일의 삶으로 이어지고, 모든 성도가 삶의 자리에서 사역자로 서기를 소망합니다.'
            : 'We long for Sunday worship to shape everyday life and for every believer to serve where they live.'}
        </blockquote>
      </section>
    </article>
  );
};

About.meta = {
  title: 'About',
  description: 'Meet Sydney Samil Church and discover our story, vision, and mission.',
};

export default About;
