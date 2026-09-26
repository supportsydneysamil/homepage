import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import Pager from '../components/Pager';
import {
  APPLICATION_CATEGORIES,
  applicationCategoryLabel,
  applicationStatus,
  filterApplications,
  statusLabel,
  type ApplicationCategory,
} from '../lib/applications';
import { useLanguage } from '../lib/LanguageContext';
import { formatDisplayDate } from '../lib/presentation';
import { todayStamp } from '../lib/events';
import { fetchApplications, fetchResources, useContent, type ApiApplication, type ApiResource } from '../lib/contentApi';
import {
  RESOURCE_CATEGORIES,
  categoryLabel,
  fileTypeLabel,
  filterResources,
  paginate,
  visibilityLabel,
  RESOURCES_PER_PAGE,
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
  const router = useRouter();
  const { items: resources, isLoading, error } = useContent<ApiResource>(fetchResources);
  const applications = useContent<ApiApplication>(fetchApplications);
  const [section, setSection] = useState<'files' | 'apply'>('files');
  const [category, setCategory] = useState<ResourceCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [applicationCategory, setApplicationCategory] = useState<ApplicationCategory | 'all'>('all');
  const [applicationSearch, setApplicationSearch] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    setSection(router.query.view === 'apply' ? 'apply' : 'files');
  }, [router.isReady, router.query.view]);

  const showSection = (next: 'files' | 'apply') => {
    setSection(next);
    void router.replace(
      { pathname: '/resources', query: next === 'apply' ? { view: 'apply' } : {} },
      undefined,
      { shallow: true }
    );
  };

  const matched = filterResources(resources, category, search);
  const current = paginate(matched, page, RESOURCES_PER_PAGE);
  const visible = current.items;
  const today = todayStamp();
  const publishedApplications = applications.items.filter((item) => item.published);
  const matchedApplications = filterApplications(publishedApplications, applicationCategory, applicationSearch);

  const showFrom = (nextCategory: ResourceCategory | 'all', nextSearch: string) => {
    setCategory(nextCategory);
    setSearch(nextSearch);
    setPage(1);
  };
  const countFor = (id: ResourceCategory) =>
    resources.filter((resource) => resource.category === id).length;
  const applicationCountFor = (id: ApplicationCategory) =>
    publishedApplications.filter((item) => item.category === id).length;

  return (
    <article className="site-page resources-page">
      <PageHero
        eyebrow={isKo ? '자료와 신청' : 'Library and applications'}
        title={isKo ? '자료와 신청을 한곳에서' : 'Files and applications, together'}
        description={
          isKo
            ? '주보와 자료를 받거나, 계정·양육·행사 신청을 작성하세요. 일부 항목은 로그인 후에 보입니다.'
            : 'Download church resources, or complete an application. Some items appear once you sign in.'
        }
      />

      <nav className="library-tabs library-switch" aria-label={isKo ? '자료실 구분' : 'Library sections'}>
        <button
          type="button"
          className={section === 'files' ? 'library-tab library-tab--active' : 'library-tab'}
          aria-current={section === 'files' ? 'true' : undefined}
          onClick={() => showSection('files')}
        >
          {isKo ? '자료' : 'Files'}
        </button>
        <button
          type="button"
          className={section === 'apply' ? 'library-tab library-tab--active' : 'library-tab'}
          aria-current={section === 'apply' ? 'true' : undefined}
          onClick={() => showSection('apply')}
        >
          {isKo ? '온라인 신청' : 'Applications'}
        </button>
      </nav>

      {section === 'files' && isLoading ? (
        <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>
      ) : null}
      {section === 'apply' && applications.isLoading ? (
        <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>
      ) : null}

      {section === 'files' && error ? (
        <p className="error-text" role="alert">
          {isKo ? '자료를 불러오지 못했습니다.' : 'Resources could not be loaded.'}
        </p>
      ) : null}
      {section === 'apply' && applications.error ? (
        <p className="error-text" role="alert">
          {isKo ? '신청을 불러오지 못했습니다.' : 'Applications could not be loaded.'}
        </p>
      ) : null}

      {section === 'files' && !isLoading && !error && resources.length ? (
        <>
          <div className="library-controls">
            <nav className="library-tabs" aria-label={isKo ? '자료 분류' : 'Resource categories'}>
              <button
                type="button"
                className={category === 'all' ? 'library-tab library-tab--active' : 'library-tab'}
                aria-current={category === 'all' ? 'true' : undefined}
                onClick={() => showFrom('all', search)}
              >
                {isKo ? '전체' : 'All'} ({resources.length})
              </button>
              {RESOURCE_CATEGORIES.filter((entry) => countFor(entry.id)).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={category === entry.id ? 'library-tab library-tab--active' : 'library-tab'}
                  aria-current={category === entry.id ? 'true' : undefined}
                  onClick={() => showFrom(entry.id, search)}
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
                onChange={(changeEvent) => showFrom(category, changeEvent.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  className="library-search__clear"
                  onClick={() => showFrom(category, '')}
                  aria-label={isKo ? '검색어 지우기' : 'Clear search'}
                >
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
            </div>
          </div>

          <p className="library-count" role="status" aria-live="polite">
            {matched.length
              ? isKo
                ? `${matched.length}건 중 ${current.from}–${current.to}`
                : `${current.from}–${current.to} of ${matched.length}`
              : isKo
                ? '0건'
                : 'No items'}
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
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={isKo ? `${resource.title} 다운로드` : `Download ${resource.title}`}
                    >
                      <span aria-hidden="true">↓</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <Pager
            page={current.page}
            pageCount={current.pageCount}
            label={isKo ? '자료 페이지' : 'Resource pages'}
            previousLabel={isKo ? '이전' : 'Previous'}
            nextLabel={isKo ? '다음' : 'Next'}
            onChange={setPage}
          />

          {!visible.length ? (
            <p className="muted library-no-match">
              {isKo ? '조건에 맞는 자료가 없습니다.' : 'No resources match that filter.'}
            </p>
          ) : null}
        </>
      ) : null}

      {section === 'files' && !isLoading && !error && !resources.length ? (
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

      {section === 'apply' && !applications.isLoading && !applications.error && publishedApplications.length ? (
        <>
          <div className="library-controls">
            <nav className="library-tabs" aria-label={isKo ? '신청 분류' : 'Application categories'}>
              <button
                type="button"
                className={applicationCategory === 'all' ? 'library-tab library-tab--active' : 'library-tab'}
                aria-current={applicationCategory === 'all' ? 'true' : undefined}
                onClick={() => setApplicationCategory('all')}
              >
                {isKo ? '전체' : 'All'} ({publishedApplications.length})
              </button>
              {APPLICATION_CATEGORIES.filter((entry) => applicationCountFor(entry.id)).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={applicationCategory === entry.id ? 'library-tab library-tab--active' : 'library-tab'}
                  aria-current={applicationCategory === entry.id ? 'true' : undefined}
                  onClick={() => setApplicationCategory(entry.id)}
                >
                  {applicationCategoryLabel(entry.id, lang)} ({applicationCountFor(entry.id)})
                </button>
              ))}
            </nav>
            <div className="library-search">
              <label className="visually-hidden" htmlFor="application-search-input">
                {isKo ? '신청 검색' : 'Search applications'}
              </label>
              <input
                id="application-search-input"
                type="search"
                value={applicationSearch}
                placeholder={isKo ? '제목으로 검색' : 'Search by title'}
                onChange={(changeEvent) => setApplicationSearch(changeEvent.target.value)}
              />
            </div>
          </div>

          {matchedApplications.length ? (
            <ul className="resource-list">
              {matchedApplications.map((item) => {
                const status = applicationStatus(item, today);
                const open = status === 'open';
                const when = [
                  item.opensOn ? (isKo ? `${formatDisplayDate(item.opensOn, lang)} 시작` : `Opens ${formatDisplayDate(item.opensOn, lang)}`) : '',
                  item.closesOn ? (isKo ? `${formatDisplayDate(item.closesOn, lang)} 마감` : `Closes ${formatDisplayDate(item.closesOn, lang)}`) : '',
                ].filter(Boolean);

                return (
                  <li key={item.id} className="resource-row">
                    <span className="resource-chip">{applicationCategoryLabel(item.category, lang)}</span>
                    <span className="resource-row__main">
                      <strong>{item.title}</strong>
                      <span className="resource-badge">{statusLabel(status, lang)}</span>
                    </span>
                    {when.length ? <span className="resource-row__meta">{when.join(' · ')}</span> : null}
                    {item.description ? <p className="application-note">{item.description}</p> : null}
                    {open ? (
                      <a
                        className="site-text-link application-action"
                        href={item.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isKo ? '신청하기' : 'Apply'}
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <span className="muted application-action">{statusLabel(status, lang)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted library-no-match">
              {isKo ? '조건에 맞는 신청이 없습니다.' : 'No applications match that filter.'}
            </p>
          )}
        </>
      ) : null}

      {section === 'apply' && !applications.isLoading && !applications.error && !publishedApplications.length ? (
        <EmptyState
          title={isKo ? '열린 신청이 없습니다' : 'No applications are open'}
          description={
            isKo
              ? '새 신청이 열리면 이곳에 안내합니다. 로그인하시면 회원 신청이 더 보일 수 있습니다.'
              : 'New applications will appear here. Signing in may reveal member applications.'
          }
          href="/login"
          linkLabel={isKo ? '로그인' : 'Sign in'}
        />
      ) : null}
    </article>
  );
};

Resources.meta = {
  title: 'Resources',
  description: 'Bulletins, resources, and applications from Sydney Samil Church.',
};

export default Resources;
