import type { NextPage } from 'next';
import PageHero from '../../components/PageHero';
import SettingsWorkspace from '../../components/settings/SettingsWorkspace';
import { useLanguage } from '../../lib/LanguageContext';
import { useRequireAuth } from '../../lib/swaAuth';
import { useRoles } from '../../lib/useRoles';

const SiteSettingsPage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { isAdmin, isLoading: isRoleLoading } = useRoles();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const title = isKo ? '사이트 설정' : 'Site settings';

  if (isLoading || isRoleLoading) {
    return <p className="account-state">{isKo ? '권한 확인 중...' : 'Checking permissions...'}</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <section className="site-page settings-page">
        <div className="site-empty-state settings-card">
          <h1>{title}</h1>
          <p className="error-text">
            {isKo ? '관리자 권한이 필요합니다.' : 'Administrator role is required.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <article className="site-page manage-page">
      <PageHero
        eyebrow={isKo ? '운영' : 'Operations'}
        title={title}
        description={
          isKo
            ? '테마, 사진, 교회 정보, 페이지 문구를 한 곳에서 바꾸고 사이트 전체에 적용합니다.'
            : 'Update theme, photos, church facts, and page copy, then apply them across the site.'
        }
      />
      <SettingsWorkspace />
    </article>
  );
};

SiteSettingsPage.meta = {
  title: 'Site settings',
  description: 'Global website settings for administrators.',
};

export default SiteSettingsPage;
