import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { getLoginUrl, useSwaAuth } from '../lib/swaAuth';

const LoginPage = () => {
  const { user, isAuthenticated, isLoading } = useSwaAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const isKo = lang === 'ko';
  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== '0';

  const returnTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const queryReturn = typeof router.query.returnTo === 'string' ? router.query.returnTo : '';
    if (queryReturn) {
      if (queryReturn.startsWith('/')) return queryReturn;
      try {
        const url = new URL(queryReturn, window.location.origin);
        if (url.origin === window.location.origin) return url.toString();
      } catch {
        // Invalid return URLs safely fall back to the homepage.
      }
    }
    return document.referrer.startsWith(window.location.origin) ? document.referrer : '/';
  }, [router.query.returnTo]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) window.location.href = returnTo || '/';
  }, [isAuthenticated, isLoading, returnTo]);

  return (
    <article className="site-page login-page">
      <PageHero
        eyebrow={isKo ? '교회 계정' : 'Church account'}
        title={isKo ? '다시 만나 반갑습니다' : 'Welcome back'}
        description={
          isKo
            ? '교회 계정으로 로그인해 프로필과 관리 기능을 이용하세요.'
            : 'Sign in with your church account to access your profile and administration tools.'
        }
      />
      <section className="login-card">
        <div className="login-card__mark" aria-hidden="true">S</div>
        {isLoading ? (
          <p>{isKo ? '로그인 상태를 확인하고 있습니다…' : 'Checking your sign-in status…'}</p>
        ) : (
          <>
            <h2>{isKo ? 'Microsoft 계정으로 로그인' : 'Continue with Microsoft'}</h2>
            <p>{isKo ? '승인된 시드니 삼일교회 계정을 사용해 주세요.' : 'Use an approved Sydney Samil Church account.'}</p>
            <button
              type="button"
              className="site-button site-button--primary"
              onClick={() => (window.location.href = getLoginUrl(returnTo))}
            >
              {isKo ? '로그인' : 'Sign in'} <span aria-hidden="true">→</span>
            </button>
          </>
        )}
        {devBypass ? <p className="login-card__notice">{isKo ? '개발용 인증 우회가 활성화되어 있습니다.' : 'Development auth bypass is enabled.'}</p> : null}
        {user?.userDetails ? <p className="login-card__notice">{isKo ? '로그인 계정' : 'Signed in as'}: {user.userDetails}</p> : null}
      </section>
    </article>
  );
};

export default LoginPage;
