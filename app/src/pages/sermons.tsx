import type { GetStaticProps, NextPage } from 'next';
import sermonsData from '../content/sermons.json';
import { useLanguage } from '../lib/LanguageContext';

type Sermon = {
  date: string;
  title: string;
  speaker: string;
  youtubeUrl: string;
};

type SermonsPageProps = {
  sermons: Sermon[];
};

const toEmbedUrl = (url: string) => url.replace('watch?v=', 'embed/');

const Sermons: NextPage<SermonsPageProps> & { meta?: { title?: string; description?: string } } = ({ sermons }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '설교' : 'Listen in'}</p>
        <h1>{isKo ? '최근 설교' : 'Sermons'}</h1>
        <p className="muted">
          {isKo ? '당신을 격려하고 도전하는 설교를 만나보세요.' : 'Messages from our pastors to encourage and challenge you.'}
        </p>
      </div>
      <div className="sermon-list">
        {sermons.map((sermon) => (
          <article key={`${sermon.date}-${sermon.title}`} className="sermon-card">
            <div>
              <p className="muted">{new Date(sermon.date).toLocaleDateString()}</p>
              <h3>{sermon.title}</h3>
              <p className="muted">{isKo ? `설교자: ${sermon.speaker}` : `Speaker: ${sermon.speaker}`}</p>
            </div>
            <div className="video-wrapper">
              <iframe
                src={toEmbedUrl(sermon.youtubeUrl)}
                title={sermon.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

Sermons.meta = {
  title: 'Sermons',
  description: 'Watch recent sermons from Community Church.',
};

export const getStaticProps: GetStaticProps<SermonsPageProps> = async () => {
  return {
    props: {
      sermons: sermonsData,
    },
  };
};

export default Sermons;
