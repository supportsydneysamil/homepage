import type { NextPage } from 'next';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { formatDisplayDate, toYouTubeEmbedUrl } from '../lib/presentation';
import { fetchSermons, useContent, type ApiSermon } from '../lib/contentApi';

const Sermons: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: sermons, isLoading } = useContent<ApiSermon>(fetchSermons);

  return (
    <article className="site-page sermons-page">
      <PageHero
        eyebrow={isKo ? '말씀 듣기' : 'Listen in'}
        title={isKo ? '일상을 위한 말씀' : 'Messages for everyday faith'}
        description={
          isKo
            ? '한 주의 삶을 격려하고 믿음의 방향을 세워주는 말씀을 만나보세요.'
            : 'Listen to messages that encourage your week and help shape a faith you can live.'
        }
      />

      {isLoading ? <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p> : null}

      {!isLoading && sermons.length ? (
        <section className="sermon-editorial-list">
          {sermons.map((sermon, index) => {
            const embedUrl = toYouTubeEmbedUrl(sermon.youtubeUrl);
            return (
              <article className="sermon-editorial-card" key={`${sermon.date}-${sermon.title}`}>
                <div className="sermon-editorial-card__copy">
                  <span>0{index + 1}</span>
                  <time dateTime={sermon.date}>{formatDisplayDate(sermon.date, lang)}</time>
                  <h2>{sermon.title}</h2>
                  <p>{isKo ? `설교자 · ${sermon.speaker}` : `Speaker · ${sermon.speaker}`}</p>
                </div>
                {embedUrl ? (
                  <div className="site-video">
                    <iframe
                      src={embedUrl}
                      title={sermon.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="media-unavailable">
                    <span aria-hidden="true" />
                    <p>{isKo ? '영상 준비 중' : 'Video coming soon'}</p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : null}

      {!isLoading && !sermons.length ? (
        <EmptyState
          title={isKo ? '설교를 준비 중입니다' : 'Messages are on the way'}
          description={isKo ? '새로운 말씀으로 곧 찾아뵙겠습니다.' : 'New messages will be available soon.'}
        />
      ) : null}
    </article>
  );
};

Sermons.meta = {
  title: 'Sermons',
  description: 'Recent messages from Sydney Samil Church.',
};

export default Sermons;
