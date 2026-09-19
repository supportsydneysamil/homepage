import type { NextPage } from 'next';
import { useState } from 'react';
import PageHero from '../../components/PageHero';
import { useLanguage } from '../../lib/LanguageContext';
import { useRequireAuth } from '../../lib/swaAuth';
import { useRoles } from '../../lib/useRoles';
import { fetchResources, useContent, type ApiResource } from '../../lib/contentApi';
import { uploadFile } from '../../lib/uploadFile';

const ManagePage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { isEditor, isLoading: isRoleLoading } = useRoles();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { items: resources } = useContent<ApiResource>(fetchResources);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (isLoading || isRoleLoading) {
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

  const onSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!file || !title.trim()) {
      setStatus(isKo ? '제목과 파일을 모두 입력해 주세요.' : 'Provide both a title and a file.');
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      const uploaded = await uploadFile(file, 'resources');
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), ...uploaded }),
      });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      setStatus(
        isKo ? '자료가 등록되었습니다. 새로고침하면 목록에 보입니다.' : 'Resource uploaded. Refresh to see it listed.'
      );
      setTitle('');
      setFile(null);
    } catch (error) {
      setStatus(isKo ? '업로드에 실패했습니다.' : 'Upload failed.');
    }
    setIsBusy(false);
  };

  return (
    <article className="site-page settings-page">
      <PageHero
        eyebrow={isKo ? '편집자' : 'Editors'}
        title={isKo ? '자료 관리' : 'Content management'}
        description={
          isKo
            ? '주보와 자료를 올리고 목록을 관리합니다. 파일은 최대 25MB까지 등록할 수 있습니다.'
            : 'Upload bulletins and resources. Files may be up to 25 MB.'
        }
      />

      <form className="settings-card" onSubmit={onSubmit}>
        <label htmlFor="resource-title">{isKo ? '자료 제목' : 'Resource title'}</label>
        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={200}
          required
        />

        <label htmlFor="resource-file">{isKo ? '파일' : 'File'}</label>
        <input
          id="resource-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
          onChange={(changeEvent) => setFile(changeEvent.target.files?.[0] ?? null)}
          required
        />

        <button type="submit" disabled={isBusy}>
          {isBusy ? (isKo ? '업로드 중...' : 'Uploading...') : isKo ? '업로드' : 'Upload'}
        </button>

        {status ? (
          <p className="account-state" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
      </form>

      <section className="settings-card">
        <h2>{isKo ? '등록된 자료' : 'Uploaded resources'}</h2>
        {resources.length ? (
          <ul>
            {resources.map((resource) => (
              <li key={resource.id}>{resource.title}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">{isKo ? '등록된 자료가 없습니다.' : 'No resources yet.'}</p>
        )}
      </section>
    </article>
  );
};

ManagePage.meta = {
  title: 'Manage',
  description: 'Content management for Sydney Samil Church editors.',
};

export default ManagePage;
