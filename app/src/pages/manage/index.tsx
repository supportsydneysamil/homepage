import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PageHero from '../../components/PageHero';
import Pager from '../../components/Pager';
import ContentForm, { type FormField } from '../../components/manage/ContentForm';
import ManageList from '../../components/manage/ManageList';
import ManageToolbar, { type ManageFilterOption } from '../../components/manage/ManageToolbar';
import { useLanguage } from '../../lib/LanguageContext';
import { useRequireAuth } from '../../lib/swaAuth';
import { useRoles } from '../../lib/useRoles';
import { fileNameFromUrl, formatDisplayDate } from '../../lib/presentation';
import { eventImageIdFromUrl, todayStamp } from '../../lib/events';
import { MANAGE_TABS, buildManageHref, parseManageQuery, type ManageTab } from '../../lib/manageNav';
import {
  MANAGE_PAGE_SIZE,
  eventStatusOf,
  filterEvents,
  filterSermons,
  sermonYears,
  viewShowing,
  type EventStatus,
  type ManageView,
} from '../../lib/manageList';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_VISIBILITIES,
  categoryLabel,
  filterResources,
  paginate,
  visibilityLabel,
  type ResourceCategory,
} from '../../lib/library';
import {
  fetchEvent,
  fetchEvents,
  fetchResource,
  fetchResources,
  fetchSermon,
  fetchSermons,
  useContent,
  useLookup,
  type ApiEvent,
  type ApiResource,
  type ApiSermon,
} from '../../lib/contentApi';
import { uploadFile } from '../../lib/uploadFile';

// Layout effects must not run while the page is prerendered for the export.
const useSettleEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Every write returns the saved row, so the caller can highlight it in the list.
const sendContent = async (endpoint: string, method: 'POST' | 'PUT', payload: unknown) => {
  const res = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, { id?: string } | undefined> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const saved = body.resource || body.sermon || body.event;
  return saved && saved.id ? saved.id : null;
};

const deleteContent = async (endpoint: string, id: string) => {
  const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error || `Request failed (${res.status})`);
  }
};

const ManagePage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { isEditor, isLoading: isRoleLoading } = useRoles();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  // Static export serves this page without query params, so wait for the
  // client-side router before choosing a tab or edit target.
  const { tab, editId } = parseManageQuery(router.isReady ? router.query : {});

  const resources = useContent<ApiResource>(fetchResources, tab === 'resources');
  const sermons = useContent<ApiSermon>(fetchSermons, tab === 'sermons');
  const events = useContent<ApiEvent>(fetchEvents, tab === 'events');
  const editingResourceLookup = useLookup(tab === 'resources' ? editId : null, fetchResource);
  const editingSermonLookup = useLookup(tab === 'sermons' ? editId : null, fetchSermon);
  const editingEventLookup = useLookup(tab === 'events' ? editId : null, (id) => fetchEvent({ id }));

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // One status line per outcome, placed beside whatever the editor just acted
  // on. It stays until the next action rather than fading on a timer.
  const [status, setStatus] = useState<{
    scope: 'upload' | 'list' | 'gallery';
    text: string;
    isError: boolean;
  } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The card says what happened; the mark on the row says which one, and keeps
  // the confirmation readable when the list scrolls past the card.
  const flashRow = (id: string | null, message: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setStatus({ scope: 'list', text: message, isError: false });
    if (!id) return;
    setFlashId(id);
    flashTimerRef.current = setTimeout(() => setFlashId(null), 4000);
  };

  // Closing a tall editor drops the page near the top. Land on the saved row
  // before the browser paints, so the editor sees one move instead of a jump
  // followed by a long scroll back down.
  useSettleEffect(() => {
    if (!flashId) return;
    const row = document.querySelector('.manage-list__row--flash');
    if (!row) return;
    const { top, bottom } = row.getBoundingClientRect();
    const margin = 24;
    if (top >= margin && bottom <= window.innerHeight - margin) return;
    row.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [flashId]);

  const failWith = (scope: 'upload' | 'list' | 'gallery', text: string) => {
    setStatus({ scope, text, isError: true });
  };

  const [isAdding, setIsAdding] = useState(false);
  // Each tab remembers where its editor was reading, so saving does not
  // throw them back to the newest page.
  const [views, setViews] = useState<Record<ManageTab, ManageView>>({
    resources: { filter: 'all', search: '', page: 1 },
    sermons: { filter: 'all', search: '', page: 1 },
    events: { filter: 'all', search: '', page: 1 },
  });
  const view = views[tab];
  const setView = (changes: Partial<ManageView>) =>
    setViews((previous) => ({ ...previous, [tab]: { ...previous[tab], ...changes } }));

  // After a write, move the view only as far as it takes to show the saved row.
  const reveal = (which: ManageTab, next: ManageView | null) => {
    if (next) setViews((previous) => ({ ...previous, [which]: next }));
  };

  const revealResource = (fresh: ApiResource[], savedId: string | null) => {
    if (!savedId) return;
    const current = views.resources;
    const matched = filterResources(fresh, current.filter as ResourceCategory | 'all', current.search);
    reveal('resources', viewShowing(savedId, fresh, matched, current, MANAGE_PAGE_SIZE));
  };

  const revealSermon = (fresh: ApiSermon[], savedId: string | null) => {
    if (!savedId) return;
    const current = views.sermons;
    const matched = filterSermons(fresh, current.filter, current.search);
    reveal('sermons', viewShowing(savedId, fresh, matched, current, MANAGE_PAGE_SIZE));
  };

  const revealEvent = (fresh: ApiEvent[], savedId: string | null) => {
    if (!savedId) return;
    const current = views.events;
    const matched = filterEvents(fresh, current.filter, current.search, todayStamp());
    reveal('events', viewShowing(savedId, fresh, matched, current, MANAGE_PAGE_SIZE));
  };
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>(RESOURCE_CATEGORIES[0].id);
  const [uploadVisibility, setUploadVisibility] = useState<string>('member');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFileHandle, setUploadFileHandle] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = RESOURCE_CATEGORIES.map((entry) => ({
    value: entry.id,
    label: categoryLabel(entry.id, lang),
  }));
  const visibilityOptions = RESOURCE_VISIBILITIES.map((entry) => ({
    value: entry.id,
    label: visibilityLabel(entry.id, lang),
  }));

  const labels = useMemo(
    () => ({
      tabs: {
        resources: isKo ? '자료실' : 'Resources',
        sermons: isKo ? '설교' : 'Sermons',
        events: isKo ? '이벤트' : 'Events',
      } as Record<ManageTab, string>,
      edit: isKo ? '편집' : 'Edit',
      remove: isKo ? '삭제' : 'Delete',
      confirm: isKo ? '삭제 확인' : 'Confirm',
      cancel: isKo ? '취소' : 'Cancel',
      saving: isKo ? '저장 중...' : 'Saving...',
      saved: isKo ? '저장되었습니다.' : 'Saved.',
      deleted: isKo ? '삭제되었습니다.' : 'Deleted.',
      deleteFailed: isKo ? '삭제하지 못했습니다.' : 'Delete failed.',
      addResource: isKo ? '자료 추가' : 'Add a resource',
      editResource: isKo ? '자료 이름 변경' : 'Rename resource',
      addSermon: isKo ? '설교 추가' : 'Add a sermon',
      editSermon: isKo ? '설교 수정' : 'Edit sermon',
      addEvent: isKo ? '이벤트 추가' : 'Add an event',
      editEvent: isKo ? '이벤트 수정' : 'Edit event',
      save: isKo ? '저장' : 'Save',
      upload: isKo ? '업로드' : 'Upload',
      uploading: isKo ? '업로드 중...' : 'Uploading...',
      title: isKo ? '제목' : 'Title',
      file: isKo ? '파일' : 'File',
      fileCurrent: (fileName: string) =>
        isKo ? `현재 파일: ${fileName}` : `Current file: ${fileName}`,
      fileUnknown: isKo
        ? '현재 파일 이름을 확인할 수 없습니다. 새 파일을 올리면 정리됩니다.'
        : 'The current file name is unavailable. Uploading a new file will fix it.',
      fileReplaceHint: isKo
        ? '비워두면 기존 파일이 그대로 유지됩니다.'
        : 'Leave empty to keep the current file.',
      category: isKo ? '분류' : 'Category',
      visibility: isKo ? '공개 범위' : 'Who can see it',
      visibilityHint: isKo
        ? '관리자 전용 자료는 편집자에게도 보이지 않습니다.'
        : 'Administrator-only files stay hidden from editors too.',
      resourceDate: isKo ? '자료 날짜' : 'Resource date',
      dateHint: isKo
        ? '주보처럼 발행일이 있는 자료에 입력하세요. 비워두면 등록순으로 정렬됩니다.'
        : 'Use for dated items such as bulletins. Leave empty to sort by upload order.',
      date: isKo ? '날짜' : 'Date',
      speaker: isKo ? '설교자' : 'Speaker',
      youtube: isKo ? '유튜브 주소' : 'YouTube URL',
      recording: isKo ? '설교 음원 · 영상 파일' : 'Sermon recording',
      recordingHint: isKo
        ? 'MP3, M4A, WAV, MP4, WebM 파일을 최대 200MB까지 올릴 수 있습니다. 유튜브만 쓰신다면 비워두세요.'
        : 'MP3, M4A, WAV, MP4, or WebM up to 200 MB. Leave empty when you only use YouTube.',
      recordingCurrent: (fileName: string) =>
        isKo
          ? `현재 파일: ${fileName} · 새 파일을 고르면 교체됩니다.`
          : `Current file: ${fileName} · choosing a new file replaces it.`,
      slug: isKo ? '주소 슬러그' : 'URL slug',
      slugHint: isKo
        ? '비워두면 제목으로 만듭니다. 한글 제목은 날짜 주소가 됩니다.'
        : 'Leave empty to generate from the title. Korean titles fall back to the date.',
      description: isKo ? '설명' : 'Description',
      location: isKo ? '장소' : 'Location',
      startTime: isKo ? '시작 시각' : 'Start time',
      published: isKo ? '공개' : 'Visibility',
      publishedLive: isKo ? '공개' : 'Published',
      publishedDraft: isKo ? '초안' : 'Draft',
      photo: isKo ? '사진' : 'Photo',
      photoHint: isKo
        ? 'JPG, PNG, WebP 파일을 한 번에 여러 장 고를 수 있습니다. 고른 사진은 기존 사진 뒤에 추가됩니다.'
        : 'Pick one or more JPG, PNG, or WebP files. They are added after the existing photos.',
      photoCurrent: (count: number) =>
        isKo ? `등록된 사진 ${count}장` : `${count} photo${count === 1 ? '' : 's'} attached`,
      emptyResources: isKo ? '등록된 자료가 없습니다.' : 'No resources yet.',
      emptySermons: isKo ? '등록된 설교가 없습니다.' : 'No sermons yet.',
      emptyEvents: isKo ? '등록된 이벤트가 없습니다.' : 'No events yet.',
      needFile: isKo ? '제목과 파일을 모두 입력해 주세요.' : 'Provide both a title and a file.',
      uploadFailed: isKo ? '업로드에 실패했습니다.' : 'Upload failed.',
      all: isKo ? '전체' : 'All',
      filterCategory: isKo ? '자료 분류' : 'Resource categories',
      filterYear: isKo ? '설교 연도' : 'Sermon year',
      filterStatus: isKo ? '이벤트 상태' : 'Event status',
      allYears: isKo ? '전체 연도' : 'All years',
      upcoming: isKo ? '다가올' : 'Upcoming',
      past: isKo ? '지난' : 'Past',
      draft: isKo ? '초안' : 'Draft',
      searchByTitle: isKo ? '제목으로 검색' : 'Search by title',
      searchSermons: isKo ? '제목 · 설교자로 검색' : 'Search title or speaker',
      searchEvents: isKo ? '제목 · 장소로 검색' : 'Search title or place',
      clearSearch: isKo ? '검색어 지우기' : 'Clear search',
      countRange: (from: number, to: number, total: number) =>
        total ? (isKo ? `${total}건 중 ${from}–${to}` : `${from}–${to} of ${total}`) : isKo ? '0건' : 'No items',
      noMatch: isKo ? '조건에 맞는 자료가 없습니다.' : 'Nothing matches that filter.',
      savedMark: isKo ? '저장됨' : 'Saved',
      pages: isKo ? '목록 페이지' : 'List pages',
      previous: isKo ? '이전' : 'Previous',
      next: isKo ? '다음' : 'Next',
    }),
    [isKo]
  );

  if (isLoading || isRoleLoading || !router.isReady) {
    return <p className="account-state">{isKo ? '권한 확인 중...' : 'Checking permissions...'}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isEditor) {
    return (
      <section className="site-page settings-page">
        <div className="site-empty-state settings-card">
          <h1>{isKo ? '자료 관리' : 'Content management'}</h1>
          <p className="error-text">{isKo ? '편집 권한이 필요합니다.' : 'Editor role is required.'}</p>
        </div>
      </section>
    );
  }

  const goTo = (nextTab: ManageTab, nextEditId?: string) => {
    setPendingDeleteId(null);
    setIsAdding(false);
    setStatus(null);
    // Next.js jumps to the top on push; the editor stays where it was reading.
    void router.push(buildManageHref(nextTab, nextEditId), undefined, { shallow: true, scroll: false });
  };

  const openAdd = () => {
    setPendingDeleteId(null);
    setStatus(null);
    setIsAdding(true);
    if (editId) {
      void router.push(buildManageHref(tab), undefined, { shallow: true, scroll: false });
    }
  };

  const editingResource = editingResourceLookup.item;
  const editingSermon = editingSermonLookup.item;
  const editingEvent = editingEventLookup.item;

  const today = todayStamp();

  const matchedResources = filterResources(
    resources.items,
    views.resources.filter as ResourceCategory | 'all',
    views.resources.search
  );
  const resourcePage = paginate(matchedResources, views.resources.page, MANAGE_PAGE_SIZE);
  const resourceFilterOptions: ManageFilterOption[] = [
    { value: 'all', label: labels.all, count: resources.items.length },
    ...RESOURCE_CATEGORIES.map((entry) => ({
      value: entry.id as string,
      label: categoryLabel(entry.id, lang),
      count: resources.items.filter((item) => item.category === entry.id).length,
    })).filter((option) => option.count > 0),
  ];

  const matchedSermons = filterSermons(sermons.items, views.sermons.filter, views.sermons.search);
  const sermonPage = paginate(matchedSermons, views.sermons.page, MANAGE_PAGE_SIZE);
  const sermonFilterOptions: ManageFilterOption[] = [
    { value: 'all', label: labels.allYears },
    ...sermonYears(sermons.items).map((year) => ({ value: year, label: year })),
  ];

  const matchedEvents = filterEvents(events.items, views.events.filter, views.events.search, today);
  const eventPage = paginate(matchedEvents, views.events.page, MANAGE_PAGE_SIZE);
  const countByStatus = (status: EventStatus) =>
    events.items.filter((item) => eventStatusOf(item, today) === status).length;
  const eventFilterOptions: ManageFilterOption[] = [
    { value: 'all', label: labels.all, count: events.items.length },
    { value: 'upcoming', label: labels.upcoming, count: countByStatus('upcoming') },
    { value: 'past', label: labels.past, count: countByStatus('past') },
    { value: 'draft', label: labels.draft, count: countByStatus('draft') },
  ];

  const onUpload = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!uploadFileHandle || !uploadTitle.trim()) {
      failWith('upload', labels.needFile);
      return;
    }

    setIsUploading(true);
    setStatus(null);
    try {
      const uploaded = await uploadFile(uploadFileHandle, 'resources');
      const savedId = await sendContent('/api/resources', 'POST', {
        title: uploadTitle.trim(),
        category: uploadCategory,
        visibility: uploadVisibility,
        resourceDate: uploadDate,
        ...uploaded,
      });
      setUploadTitle('');
      setUploadDate('');
      setUploadFileHandle(null);
      revealResource(await resources.reload(), savedId);
      setIsAdding(false);
      flashRow(savedId, labels.saved);
    } catch (error) {
      failWith('upload', labels.uploadFailed);
    }
    setIsUploading(false);
  };

  const onDelete = async (endpoint: string, id: string, reload: () => Promise<unknown>) => {
    setPendingDeleteId(null);
    try {
      await deleteContent(endpoint, id);
      await reload();
      if (editId === id) {
        goTo(tab);
      }
      // The row leaving the list is the confirmation; only announce it.
      flashRow(null, labels.deleted);
    } catch (error) {
      failWith('list', labels.deleteFailed);
    }
  };

  const onRemovePhoto = async (imageUrl: string) => {
    try {
      await deleteContent('/api/events/images', eventImageIdFromUrl(imageUrl));
      await Promise.all([events.reload(), editingEventLookup.reload()]);
      flashRow(null, labels.deleted);
    } catch (error) {
      failWith('gallery', labels.deleteFailed);
    }
  };

  return (
    <article className="site-page manage-page">
      <PageHero
        eyebrow={isKo ? '편집자' : 'Editors'}
        title={isKo ? '자료 관리' : 'Content management'}
        description={
          isKo
            ? '주보와 설교, 이벤트를 한곳에서 등록하고 수정합니다. 파일은 최대 25MB까지 올릴 수 있습니다.'
            : 'Publish and update bulletins, sermons, and events in one place. Files may be up to 25 MB.'
        }
      />

      <nav className="manage-tabs" aria-label={isKo ? '관리 영역' : 'Management sections'}>
        {MANAGE_TABS.map((manageTab) => (
          <button
            key={manageTab}
            type="button"
            className={manageTab === tab ? 'manage-tab manage-tab--active' : 'manage-tab'}
            aria-current={manageTab === tab ? 'page' : undefined}
            onClick={() => goTo(manageTab)}
          >
            {labels.tabs[manageTab]}
          </button>
        ))}
      </nav>


      {tab === 'resources' ? (
        <section className="manage-panel">
          <div className="manage-actions">
            <button type="button" className="manage-button" onClick={openAdd}>
              + {labels.addResource}
            </button>
          </div>

          {editId && editingResourceLookup.isLoading ? null : editingResource ? (
            <div className="manage-editor">
              <h2>{labels.editResource}</h2>
              <ContentForm
                fields={[
                  { name: 'title', label: labels.title, type: 'text', required: true },
                  { name: 'category', label: labels.category, type: 'select', options: categoryOptions },
                  {
                    name: 'visibility',
                    label: labels.visibility,
                    type: 'select',
                    options: visibilityOptions,
                    hint: labels.visibilityHint,
                  },
                  { name: 'resourceDate', label: labels.resourceDate, type: 'date', hint: labels.dateHint },
                ]}
                fileField={{
                  name: 'resource-replacement',
                  label: labels.file,
                  accept: '.pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx',
                  currentLabel: editingResource.fileName
                    ? labels.fileCurrent(editingResource.fileName)
                    : labels.fileUnknown,
                  hint: labels.fileReplaceHint,
                }}
                initialValues={{
                  title: editingResource.title,
                  category: editingResource.category,
                  visibility: editingResource.visibility,
                  resourceDate: editingResource.resourceDate ?? '',
                }}
                submitLabel={labels.save}
                busyLabel={labels.saving}
                cancelLabel={labels.cancel}
                onCancel={() => goTo('resources')}
                onSubmit={async (values, files) => {
                  const [file] = files;
                  const replacement = file ? await uploadFile(file, 'resources') : null;
                  const savedId = await sendContent('/api/resources', 'PUT', {
                    id: editingResource.id,
                    ...values,
                    ...(replacement
                      ? {
                          blobPath: replacement.blobPath,
                          contentType: replacement.contentType,
                          sizeBytes: replacement.sizeBytes,
                        }
                      : {}),
                  });
                  revealResource(await resources.reload(), savedId);
                  goTo('resources');
                  flashRow(savedId, labels.saved);
                }}
              />
            </div>
          ) : isAdding ? (
            <div className="manage-editor">
              <h2>{labels.addResource}</h2>
              <form className="manage-form" onSubmit={onUpload}>
                <div className="manage-form__field">
                  <label htmlFor="resource-title">{labels.title}</label>
                  <input
                    id="resource-title"
                    type="text"
                    value={uploadTitle}
                    onChange={(changeEvent) => setUploadTitle(changeEvent.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="manage-form__field">
                  <label htmlFor="resource-category">{labels.category}</label>
                  <select
                    id="resource-category"
                    value={uploadCategory}
                    onChange={(changeEvent) => setUploadCategory(changeEvent.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="manage-form__field">
                  <label htmlFor="resource-visibility">{labels.visibility}</label>
                  <select
                    id="resource-visibility"
                    value={uploadVisibility}
                    onChange={(changeEvent) => setUploadVisibility(changeEvent.target.value)}
                  >
                    {visibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="muted">{labels.visibilityHint}</span>
                </div>

                <div className="manage-form__field">
                  <label htmlFor="resource-date">{labels.resourceDate}</label>
                  <input
                    id="resource-date"
                    type="date"
                    value={uploadDate}
                    onChange={(changeEvent) => setUploadDate(changeEvent.target.value)}
                  />
                  <span className="muted">{labels.dateHint}</span>
                </div>

                <div className="manage-form__field">
                  <label htmlFor="resource-file">{labels.file}</label>
                  <input
                    id="resource-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
                    onChange={(changeEvent) => setUploadFileHandle(changeEvent.target.files?.[0] ?? null)}
                    required
                  />
                </div>

                {status?.scope === 'upload' ? (
                  <p className="error-text" role="alert">
                    {status.text}
                  </p>
                ) : null}

                <div className="manage-form__actions">
                  <button type="submit" className="manage-button" disabled={isUploading}>
                    {isUploading ? labels.uploading : labels.upload}
                  </button>
                  <button
                    type="button"
                    className="manage-button manage-button--ghost"
                    onClick={() => setIsAdding(false)}
                  >
                    {labels.cancel}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <ManageToolbar
            id="manage-resources"
            filterLabel={labels.filterCategory}
            filterValue={views.resources.filter}
            filterOptions={resourceFilterOptions}
            filterAs="chips"
            onFilterChange={(value) => setView({ filter: value, page: 1 })}
            searchLabel={labels.filterCategory}
            searchPlaceholder={labels.searchByTitle}
            searchValue={views.resources.search}
            clearLabel={labels.clearSearch}
            onSearchChange={(value) => setView({ search: value, page: 1 })}
            countLabel={labels.countRange(resourcePage.from, resourcePage.to, matchedResources.length)}
          />

          {status?.scope === 'list' ? (
            <p
              className={status.isError ? 'manage-status manage-status--error' : 'manage-status'}
              role={status.isError ? 'alert' : 'status'}
              aria-live={status.isError ? 'assertive' : 'polite'}
            >
              {status.text}
            </p>
          ) : null}

          <ManageList
            items={resourcePage.items.map((item) => ({
              id: item.id,
              primary: item.title,
              secondary: [
                categoryLabel(item.category, lang),
                visibilityLabel(item.visibility, lang),
                item.resourceDate ? formatDisplayDate(item.resourceDate, lang) : '',
                item.fileName,
              ]
                .filter(Boolean)
                .join(' · '),
            }))}
            activeId={editId}
            flashId={flashId}
            flashLabel={labels.savedMark}
            emptyLabel={resources.items.length ? labels.noMatch : labels.emptyResources}
            editLabel={labels.edit}
            deleteLabel={labels.remove}
            confirmLabel={labels.confirm}
            cancelLabel={labels.cancel}
            pendingDeleteId={pendingDeleteId}
            onEdit={(id) => goTo('resources', id)}
            onRequestDelete={setPendingDeleteId}
            onConfirmDelete={(id) => onDelete('/api/resources', id, resources.reload)}
            onCancelDelete={() => setPendingDeleteId(null)}
          />

          <Pager
            page={resourcePage.page}
            pageCount={resourcePage.pageCount}
            label={labels.pages}
            previousLabel={labels.previous}
            nextLabel={labels.next}
            onChange={(page) => setView({ page })}
          />
        </section>
      ) : null}

      {tab === 'sermons' ? (
        <section className="manage-panel">
          <div className="manage-actions">
            <button type="button" className="manage-button" onClick={openAdd}>
              + {labels.addSermon}
            </button>
          </div>

          {(editId && editingSermonLookup.isLoading) || !(editId || isAdding) ? null : (
            <div className="manage-editor">
              <h2>{editingSermon ? labels.editSermon : labels.addSermon}</h2>
              <ContentForm
                fields={
                  [
                    { name: 'date', label: labels.date, type: 'date', required: true },
                    { name: 'title', label: labels.title, type: 'text', required: true },
                    { name: 'speaker', label: labels.speaker, type: 'text' },
                    { name: 'youtubeUrl', label: labels.youtube, type: 'url' },
                  ] as FormField[]
                }
                initialValues={
                  editingSermon
                    ? {
                        date: editingSermon.date,
                        title: editingSermon.title,
                        speaker: editingSermon.speaker,
                        youtubeUrl: editingSermon.youtubeUrl,
                      }
                    : undefined
                }
                fileField={{
                  name: 'sermon-media',
                  label: labels.recording,
                  accept: '.mp3,.m4a,.wav,.mp4,.webm',
                  hint: labels.recordingHint,
                  currentLabel: editingSermon?.mediaUrl
                    ? labels.recordingCurrent(fileNameFromUrl(editingSermon.mediaUrl))
                    : undefined,
                }}
                submitLabel={labels.save}
                busyLabel={labels.saving}
                cancelLabel={labels.cancel}
                onCancel={() => goTo('sermons')}
                onSubmit={async (values, files) => {
                  const [file] = files;
                  let media = editingSermon
                    ? { mediaUrl: editingSermon.mediaUrl, mediaContentType: editingSermon.mediaContentType }
                    : { mediaUrl: '', mediaContentType: '' };
                  if (file) {
                    const uploaded = await uploadFile(file, 'media');
                    media = { mediaUrl: uploaded.publicUrl ?? '', mediaContentType: uploaded.contentType };
                  }
                  const payload = { ...values, ...media };
                  const savedId = editingSermon
                    ? await sendContent('/api/sermons', 'PUT', { id: editingSermon.id, ...payload })
                    : await sendContent('/api/sermons', 'POST', payload);
                  revealSermon(await sermons.reload(), savedId);
                  goTo('sermons');
                  flashRow(savedId, labels.saved);
                }}
              />
            </div>
          )}

          <ManageToolbar
            id="manage-sermons"
            filterLabel={labels.filterYear}
            filterValue={views.sermons.filter}
            filterOptions={sermonFilterOptions}
            filterAs="select"
            onFilterChange={(value) => setView({ filter: value, page: 1 })}
            searchLabel={labels.searchSermons}
            searchPlaceholder={labels.searchSermons}
            searchValue={views.sermons.search}
            clearLabel={labels.clearSearch}
            onSearchChange={(value) => setView({ search: value, page: 1 })}
            countLabel={labels.countRange(sermonPage.from, sermonPage.to, matchedSermons.length)}
          />

          {status?.scope === 'list' ? (
            <p
              className={status.isError ? 'manage-status manage-status--error' : 'manage-status'}
              role={status.isError ? 'alert' : 'status'}
              aria-live={status.isError ? 'assertive' : 'polite'}
            >
              {status.text}
            </p>
          ) : null}

          <ManageList
            items={sermonPage.items.map((item) => ({
              id: item.id,
              primary: item.title,
              secondary: [
                formatDisplayDate(item.date, lang),
                item.speaker,
                item.mediaUrl ? fileNameFromUrl(item.mediaUrl) : '',
                item.youtubeUrl ? 'YouTube' : '',
              ]
                .filter(Boolean)
                .join(' · '),
            }))}
            activeId={editId}
            flashId={flashId}
            flashLabel={labels.savedMark}
            emptyLabel={sermons.items.length ? labels.noMatch : labels.emptySermons}
            editLabel={labels.edit}
            deleteLabel={labels.remove}
            confirmLabel={labels.confirm}
            cancelLabel={labels.cancel}
            pendingDeleteId={pendingDeleteId}
            onEdit={(id) => goTo('sermons', id)}
            onRequestDelete={setPendingDeleteId}
            onConfirmDelete={(id) => onDelete('/api/sermons', id, sermons.reload)}
            onCancelDelete={() => setPendingDeleteId(null)}
          />

          <Pager
            page={sermonPage.page}
            pageCount={sermonPage.pageCount}
            label={labels.pages}
            previousLabel={labels.previous}
            nextLabel={labels.next}
            onChange={(page) => setView({ page })}
          />
        </section>
      ) : null}

      {tab === 'events' ? (
        <section className="manage-panel">
          <div className="manage-actions">
            <button type="button" className="manage-button" onClick={openAdd}>
              + {labels.addEvent}
            </button>
          </div>

          {(editId && editingEventLookup.isLoading) || !(editId || isAdding) ? null : (
            <div className="manage-editor">
              <h2>{editingEvent ? labels.editEvent : labels.addEvent}</h2>

            {status?.scope === 'gallery' ? (
              <p className="error-text" role="alert">
                {status.text}
              </p>
            ) : null}

            {editingEvent?.images.length ? (
              <div className="manage-gallery">
                <span className="muted">{labels.photoCurrent(editingEvent.images.length)}</span>
                <ul>
                  {editingEvent.images.map((image) => (
                    <li key={image}>
                      <img src={image} alt="" />
                      <button
                        type="button"
                        className="manage-button manage-button--ghost"
                        onClick={() => onRemovePhoto(image)}
                      >
                        {labels.remove}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ContentForm
              fields={
                [
                  { name: 'title', label: labels.title, type: 'text', required: true },
                  { name: 'date', label: labels.date, type: 'date', required: true },
                  { name: 'startTime', label: labels.startTime, type: 'time' },
                  { name: 'location', label: labels.location, type: 'text' },
                  {
                    name: 'slug',
                    label: labels.slug,
                    type: 'text',
                    hint: labels.slugHint,
                  },
                  { name: 'description', label: labels.description, type: 'textarea' },
                  { name: 'youtubeUrl', label: labels.youtube, type: 'url' },
                  {
                    name: 'published',
                    label: labels.published,
                    type: 'select',
                    options: [
                      { value: 'true', label: labels.publishedLive },
                      { value: 'false', label: labels.publishedDraft },
                    ],
                  },
                ] as FormField[]
              }
              fileField={{
                name: 'event-photo',
                label: labels.photo,
                accept: '.jpg,.jpeg,.png,.webp',
                hint: labels.photoHint,
                multiple: true,
              }}
              initialValues={
                editingEvent
                  ? {
                      slug: editingEvent.slug,
                      date: editingEvent.date,
                      title: editingEvent.title,
                      description: editingEvent.description,
                      location: editingEvent.location,
                      startTime: editingEvent.startTime,
                      youtubeUrl: editingEvent.youtubeUrl,
                      published: editingEvent.published ? 'true' : 'false',
                    }
                  : undefined
              }
              submitLabel={labels.save}
              busyLabel={labels.saving}
              cancelLabel={labels.cancel}
              onCancel={() => goTo('events')}
              onSubmit={async (values, files) => {
                const uploaded = await Promise.all(files.map((file) => uploadFile(file, 'events')));
                const imageBlobPaths = uploaded.map((item) => item.blobPath);
                const payload = {
                  slug: values.slug,
                  date: values.date,
                  title: values.title,
                  description: values.description,
                  location: values.location,
                  startTime: values.startTime,
                  youtubeUrl: values.youtubeUrl,
                  published: values.published !== 'false',
                  imageBlobPaths,
                };
                const savedId = editingEvent
                  ? await sendContent('/api/events', 'PUT', { id: editingEvent.id, ...payload })
                  : await sendContent('/api/events', 'POST', payload);
                revealEvent(await events.reload(), savedId);
                goTo('events');
                flashRow(savedId, labels.saved);
              }}
            />
            </div>
          )}

          <ManageToolbar
            id="manage-events"
            filterLabel={labels.filterStatus}
            filterValue={views.events.filter}
            filterOptions={eventFilterOptions}
            filterAs="chips"
            onFilterChange={(value) => setView({ filter: value, page: 1 })}
            searchLabel={labels.searchEvents}
            searchPlaceholder={labels.searchEvents}
            searchValue={views.events.search}
            clearLabel={labels.clearSearch}
            onSearchChange={(value) => setView({ search: value, page: 1 })}
            countLabel={labels.countRange(eventPage.from, eventPage.to, matchedEvents.length)}
          />

          {status?.scope === 'list' ? (
            <p
              className={status.isError ? 'manage-status manage-status--error' : 'manage-status'}
              role={status.isError ? 'alert' : 'status'}
              aria-live={status.isError ? 'assertive' : 'polite'}
            >
              {status.text}
            </p>
          ) : null}

          <ManageList
            items={eventPage.items.map((item) => ({
              id: item.id,
              primary: item.title,
              secondary: [
                formatDisplayDate(item.date, lang),
                item.location,
                item.published ? '' : labels.draft,
              ]
                .filter(Boolean)
                .join(' · '),
            }))}
            activeId={editId}
            flashId={flashId}
            flashLabel={labels.savedMark}
            emptyLabel={events.items.length ? labels.noMatch : labels.emptyEvents}
            editLabel={labels.edit}
            deleteLabel={labels.remove}
            confirmLabel={labels.confirm}
            cancelLabel={labels.cancel}
            pendingDeleteId={pendingDeleteId}
            onEdit={(id) => goTo('events', id)}
            onRequestDelete={setPendingDeleteId}
            onConfirmDelete={(id) => onDelete('/api/events', id, events.reload)}
            onCancelDelete={() => setPendingDeleteId(null)}
          />

          <Pager
            page={eventPage.page}
            pageCount={eventPage.pageCount}
            label={labels.pages}
            previousLabel={labels.previous}
            nextLabel={labels.next}
            onChange={(page) => setView({ page })}
          />
        </section>
      ) : null}
    </article>
  );
};

ManagePage.meta = {
  title: 'Manage',
  description: 'Content management for Sydney Samil Church editors.',
};

export default ManagePage;
