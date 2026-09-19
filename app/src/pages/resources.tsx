import type { NextPage } from 'next';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { fetchResources, useContent, type ApiResource } from '../lib/contentApi';

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const Resources: NextPage & {
  meta?: { title?: string; description?: string };
} = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: resources, isLoading, error } = useContent<ApiResource>(fetchResources);

  return (
    <article className="site-page resources-page">
      <PageHero
        eyebrow={isKo ? '이번 주 자료' : 'For your week'}
        title={isKo ? '필요한 자료를 한곳에서' : 'Helpful resources, all in one place'}
        description={
          isKo
            ? '주보와 신앙생활에 도움이 되는 자료를 편하게 확인하세요.'
            : 'Find weekly bulletins and practical resources to support your life of faith.'
        }
      />

      {isLoading ? <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p> : null}

      {error ? (
        <p className="error-text" role="alert">
          {isKo ? '자료를 불러오지 못했습니다.' : 'Resources could not be loaded.'}
        </p>
      ) : null}

      {!isLoading && !error && resources.length ? (
        <ol className="resource-list">
          {resources.map((resource, index) => (
            <li key={resource.id}>
              <span>0{index + 1}</span>
              <strong>{resource.title}</strong>
              <span className="resource-list__meta">{formatSize(resource.sizeBytes)}</span>
              <a href={resource.downloadUrl} rel="noreferrer">
                {isKo ? '다운로드' : 'Download'} <span aria-hidden="true">↓</span>
              </a>
            </li>
          ))}
        </ol>
      ) : null}

      {!isLoading && !error && !resources.length ? (
        <EmptyState
          title={isKo ? '자료를 정리하고 있습니다' : 'Resources are being prepared'}
          description={
            isKo
              ? '확인된 주보와 자료가 준비되는 대로 이곳에 추가하겠습니다.'
              : 'Verified bulletins and resources will appear here as soon as they are ready.'
          }
          href="/contact"
          linkLabel={isKo ? '자료 문의하기' : 'Ask about a resource'}
        />
      ) : null}
    </article>
  );
};

Resources.meta = {
  title: 'Resources',
  description: 'Bulletins and helpful resources from Sydney Samil Church.',
};

export default Resources;
