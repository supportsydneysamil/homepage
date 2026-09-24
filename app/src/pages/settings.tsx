import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { buildSettingsHref, parseSettingsQuery } from '../lib/settingsNav';

// Site settings moved under the operations area. Keep this path working for
// links and bookmarks made before the move.
const SettingsPage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    void router.replace(buildSettingsHref(parseSettingsQuery(router.query)));
  }, [router]);

  return (
    <p className="account-state">{isKo ? '사이트 설정으로 이동 중...' : 'Opening site settings...'}</p>
  );
};

SettingsPage.meta = {
  title: 'Site settings',
  description: 'Global website settings for administrators.',
};

export default SettingsPage;
