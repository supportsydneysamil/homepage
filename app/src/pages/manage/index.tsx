import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import PageHero from '../../components/PageHero';
import ContentForm, { type FormField } from '../../components/manage/ContentForm';
import ManageList from '../../components/manage/ManageList';
import { useLanguage } from '../../lib/LanguageContext';
import { useRequireAuth } from '../../lib/swaAuth';
import { useRoles } from '../../lib/useRoles';
import { fileNameFromUrl, formatDisplayDate } from '../../lib/presentation';
import { MANAGE_TABS, buildManageHref, parseManageQuery, type ManageTab } from '../../lib/manageNav';
import {
  fetchEvents,
  fetchResources,
  fetchSermons,
  useContent,
  type ApiEvent,
  type ApiResource,
  type ApiSermon,
} from '../../lib/contentApi';
import { uploadFile } from '../../lib/uploadFile';

const sendContent = async (endpoint: string, method: 'POST' | 'PUT', payload: unknown) => {
  const res = await fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error || `Request failed (${res.status})`);
  }
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

  const resources = useContent<ApiResource>(fetchResources);
  const sermons = useContent<ApiSermon>(fetchSermons);
  const events = useContent<ApiEvent>(fetchEvents);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFileHandle, setUploadFileHandle] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      description: isKo ? '설명' : 'Description',
      emptyResources: isKo ? '등록된 자료가 없습니다.' : 'No resources yet.',
      emptySermons: isKo ? '등록된 설교가 없습니다.' : 'No sermons yet.',
      emptyEvents: isKo ? '등록된 이벤트가 없습니다.' : 'No events yet.',
      needFile: isKo ? '제목과 파일을 모두 입력해 주세요.' : 'Provide both a title and a file.',
      uploadFailed: isKo ? '업로드에 실패했습니다.' : 'Upload failed.',
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
    setNotice(null);
    void router.push(buildManageHref(nextTab, nextEditId), undefined, { shallow: true });
  };

  const editingResource = resources.items.find((item) => item.id === editId) ?? null;
  const editingSermon = sermons.items.find((item) => item.id === editId) ?? null;
  const editingEvent = events.items.find((item) => item.id === editId) ?? null;

  const onUpload = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!uploadFileHandle || !uploadTitle.trim()) {
      setNotice(labels.needFile);
      return;
    }

    setIsUploading(true);
    setNotice(null);
    try {
      const uploaded = await uploadFile(uploadFileHandle, 'resources');
      await sendContent('/api/resources', 'POST', { title: uploadTitle.trim(), ...uploaded });
      setUploadTitle('');
      setUploadFileHandle(null);
      await resources.reload();
      setNotice(labels.saved);
    } catch (error) {
      setNotice(labels.uploadFailed);
    }
    setIsUploading(false);
  };

  const onDelete = async (endpoint: string, id: string, reload: () => Promise<void>) => {
    setPendingDeleteId(null);
    try {
      await deleteContent(endpoint, id);
      await reload();
      setNotice(labels.deleted);
      if (editId === id) {
        goTo(tab);
      }
    } catch (error) {
      setNotice(labels.deleteFailed);
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

      {notice ? (
        <p className="account-state" role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}

      {tab === 'resources' ? (
        <section className="manage-panel">
          <ManageList
            items={resources.items.map((item) => ({ id: item.id, primary: item.title }))}
            activeId={editId}
            emptyLabel={labels.emptyResources}
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

          {editingResource ? (
            <div className="manage-editor">
              <h2>{labels.editResource}</h2>
              <ContentForm
                fields={[{ name: 'title', label: labels.title, type: 'text', required: true }]}
                initialValues={{ title: editingResource.title }}
                submitLabel={labels.save}
                busyLabel={labels.saving}
                cancelLabel={labels.cancel}
                onCancel={() => goTo('resources')}
                onSubmit={async (values) => {
                  await sendContent('/api/resources', 'PUT', { id: editingResource.id, title: values.title });
                  await resources.reload();
                  goTo('resources');
                }}
              />
            </div>
          ) : (
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
                  <label htmlFor="resource-file">{labels.file}</label>
                  <input
                    id="resource-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
                    onChange={(changeEvent) => setUploadFileHandle(changeEvent.target.files?.[0] ?? null)}
                    required
                  />
                </div>

                <div className="manage-form__actions">
                  <button type="submit" className="manage-button" disabled={isUploading}>
                    {isUploading ? labels.uploading : labels.upload}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'sermons' ? (
        <section className="manage-panel">
          <ManageList
            items={sermons.items.map((item) => ({
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
            emptyLabel={labels.emptySermons}
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
              cancelLabel={editingSermon ? labels.cancel : undefined}
              onCancel={editingSermon ? () => goTo('sermons') : undefined}
              onSubmit={async (values, file) => {
                let media = editingSermon
                  ? { mediaUrl: editingSermon.mediaUrl, mediaContentType: editingSermon.mediaContentType }
                  : { mediaUrl: '', mediaContentType: '' };
                if (file) {
                  const uploaded = await uploadFile(file, 'media');
                  media = { mediaUrl: uploaded.publicUrl ?? '', mediaContentType: uploaded.contentType };
                }
                const payload = { ...values, ...media };
                if (editingSermon) {
                  await sendContent('/api/sermons', 'PUT', { id: editingSermon.id, ...payload });
                } else {
                  await sendContent('/api/sermons', 'POST', payload);
                }
                await sermons.reload();
                goTo('sermons');
              }}
            />
          </div>
        </section>
      ) : null}

      {tab === 'events' ? (
        <section className="manage-panel">
          <ManageList
            items={events.items.map((item) => ({
              id: item.id,
              primary: item.title,
              secondary: formatDisplayDate(item.date, lang),
            }))}
            activeId={editId}
            emptyLabel={labels.emptyEvents}
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

          <div className="manage-editor">
            <h2>{editingEvent ? labels.editEvent : labels.addEvent}</h2>
            <ContentForm
              fields={
                [
                  { name: 'slug', label: labels.slug, type: 'text', required: true },
                  { name: 'date', label: labels.date, type: 'date', required: true },
                  { name: 'title', label: labels.title, type: 'text', required: true },
                  { name: 'description', label: labels.description, type: 'textarea' },
                  { name: 'youtubeUrl', label: labels.youtube, type: 'url' },
                ] as FormField[]
              }
              initialValues={
                editingEvent
                  ? {
                      slug: editingEvent.slug,
                      date: editingEvent.date,
                      title: editingEvent.title,
                      description: editingEvent.description,
                      youtubeUrl: editingEvent.youtubeUrl,
                    }
                  : undefined
              }
              submitLabel={labels.save}
              busyLabel={labels.saving}
              cancelLabel={editingEvent ? labels.cancel : undefined}
              onCancel={editingEvent ? () => goTo('events') : undefined}
              onSubmit={async (values) => {
                if (editingEvent) {
                  await sendContent('/api/events', 'PUT', { id: editingEvent.id, ...values });
                } else {
                  await sendContent('/api/events', 'POST', values);
                }
                await events.reload();
                goTo('events');
              }}
            />
          </div>
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
