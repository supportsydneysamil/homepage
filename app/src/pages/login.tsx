import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getLoginUrl, useSwaAuth } from '../lib/swaAuth';

const LoginPage = () => {
  const { user, isAuthenticated, isLoading } = useSwaAuth();
  const router = useRouter();
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
      } catch (error) {
        // Ignore invalid return URLs.
      }
    }
    const referrer = document.referrer;
    if (referrer && referrer.startsWith(window.location.origin)) {
      return referrer;
    }
    return '/';
  }, [router.query.returnTo]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = returnTo || '/';
    }
  }, [isAuthenticated, isLoading, returnTo]);

  return (
    <section>
      <h1>Login</h1>
      <p>Sign in to access protected areas of the site.</p>
      {devBypass ? <p className="muted">Dev auth bypass is enabled.</p> : null}
      <button type="button" className="button" onClick={() => (window.location.href = getLoginUrl(returnTo))}>
        Login with Microsoft
      </button>
      {user?.userDetails ? <p className="muted">Signed in as {user.userDetails}</p> : null}
    </section>
  );
};

export default LoginPage;
