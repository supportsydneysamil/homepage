import type { NextPage } from 'next';
import { useState } from 'react';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { formatDisplayDate } from '../lib/presentation';
import { fetchResources, useContent, type ApiResource } from '../lib/contentApi';
import {
  RESOURCE_CATEGORIES,
  categoryLabel,
  fileTypeLabel,
  filterResources,
  visibilityLabel,
  type ResourceCategory,
} from '../lib/library';
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
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const visible = filterResources(resources, category, search);
  const countFor = (id: ResourceCategory) =>
    resources.filter((resource) => resource.category === id).length;

  return (
    <article className="site-page resources-page">
      <PageHero
        eyebrow={isKo ? '이번 주 자료' : 'For your week'}
        title={isKo ? '필요한 자료를 한곳에서' : 'Helpful resources, all in one place'}
        description={
          isKo
            ? '주보와 신앙생활에 도움이 되는 자료를 편하게 확인하세요. 일부 자료는 로그인 후에 보입니다.'
            : 'Find bulletins and practical resources for your life of faith. Some items appear once you sign in.'
        }
      />

      {isLoading ? <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p> : null}

      {error ? (
        <p className="error-text" role="alert">
          {isKo ? '자료를 불러오지 못했습니다.' : 'Resources could not be loaded.'}
        </p>
      ) : null}

      {!isLoading && !error && resources.length ? (
        <>
          <div className="library-controls">
            <nav className="library-tabs" aria-label={isKo ? '자료 분류' : 'Resource categories'}>
              <button
                type="button"
                className={category === 'all' ? 'library-tab library-tab--active' : 'library-tab'}
                aria-current={category === 'all' ? 'true' : undefined}
                onClick={() => setCategory('all')}
              >
                {isKo ? '전체' : 'All'} ({resources.length})
              </button>
              {RESOURCE_CATEGORIES.filter((entry) => countFor(entry.id)).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={category === entry.id ? 'library-tab library-tab--active' : 'library-tab'}
                  aria-current={category === entry.id ? 'true' : undefined}
                  onClick={() => setCategory(entry.id)}
                >
                  {categoryLabel(entry.id, lang)} ({countFor(entry.id)})
                </button>
              ))}
            </nav>

            <div className="library-search">
              <label className="visually-hidden" htmlFor="library-search-input">
                {isKo ? '자료 검색' : 'Search resources'}
              </label>
              <input
                id="library-search-input"
                type="search"
                value={search}
                placeholder={isKo ? '제목으로 검색' : 'Search by title'}
                onChange={(changeEvent) => setSearch(changeEvent.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  className="library-search__clear"
                  onClick={() => setSearch('')}
                  aria-label={isKo ? '검색어 지우기' : 'Clear search'}
                >
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
            </div>
          </div>

          <p className="library-count" role="status" aria-live="polite">
            {isKo ? `${visible.length}건` : `${visible.length} item${visible.length === 1 ? '' : 's'}`}
          </p>

          {visible.length ? (
            <ul className="resource-list">
              {visible.map((resource) => {
                const meta = [
                  fileTypeLabel(resource.contentType, lang),
                  formatSize(resource.sizeBytes),
                  resource.resourceDate ? formatDisplayDate(resource.resourceDate, lang) : '',
                ].filter(Boolean);

                return (
                  <li key={resource.id} className="resource-row">
                    <span className="resource-chip">{categoryLabel(resource.category, lang)}</span>

                    <span className="resource-row__main">
                      <strong>{resource.title}</strong>
                      {resource.visibility !== 'public' ? (
                        <span className="resource-badge">{visibilityLabel(resource.visibility, lang)}</span>
                      ) : null}
                    </span>

                    {meta.length ? <span className="resource-row__meta">{meta.join(' · ')}</span> : null}

                    <a
                      className="resource-download"
                      href={resource.downloadUrl}
                      rel="noreferrer"
                      aria-label={
                        isKo ? `${resource.title} 다운로드` : `Download ${resource.title}`
                      }
                    >
                      <span aria-hidden="true">↓</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted library-no-match">
              {isKo ? '조건에 맞는 자료가 없습니다.' : 'No resources match that filter.'}
            </p>
          )}
        </>
      ) : null}

      {!isLoading && !error && !resources.length ? (
        <EmptyState
          title={isKo ? '자료를 정리하고 있습니다' : 'Resources are being prepared'}
          description={
            isKo
              ? '확인된 주보와 자료가 준비되는 대로 이곳에 추가하겠습니다. 로그인하시면 더 많은 자료가 보일 수 있습니다.'
              : 'Verified bulletins and resources will appear here soon. Signing in may reveal more.'
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
