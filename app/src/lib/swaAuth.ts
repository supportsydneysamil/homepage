import { useEffect, useState } from 'react';

export interface ClientPrincipal {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}

interface AuthMeResponse {
  clientPrincipal: ClientPrincipal | null;
}

const fetchAuthMe = async (): Promise<ClientPrincipal | null> => {
  try {
    const res = await fetch('/.auth/me', { credentials: 'include' });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as AuthMeResponse;
    return data?.clientPrincipal ?? null;
  } catch (error) {
    return null;
  }
};

export const getLoginUrl = (returnTo?: string) => {
  const redirect = encodeURIComponent(returnTo || window.location.href);
  return `/.auth/login/aad?post_login_redirect_uri=${redirect}`;
};

export const getLogoutUrl = (returnTo?: string) => {
  const fallback = typeof window !== 'undefined' ? window.location.origin : '/';
  const target = returnTo || fallback;
  const redirectUrl =
    typeof window !== 'undefined' && target.startsWith('/') ? `${window.location.origin}${target}` : target;
  const redirect = encodeURIComponent(redirectUrl);
  return `/.auth/logout?post_logout_redirect_uri=${redirect}`;
};

export const useSwaAuth = () => {
  const [user, setUser] = useState<ClientPrincipal | null | undefined>(undefined);

  useEffect(() => {
    const devBypass =
      process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== '0';
    if (devBypass) {
      setUser({
        userId: 'dev-user',
        userDetails: 'dev@local',
        identityProvider: 'dev',
        userRoles: ['authenticated'],
      });
      return;
    }

    let isMounted = true;
    fetchAuthMe()
      .then((principal) => {
        if (isMounted) {
          setUser(principal);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading: user === undefined,
  };
};

export const useRequireAuth = () => {
  const { user, isAuthenticated, isLoading } = useSwaAuth();
  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== '0';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !devBypass && typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, isLoading, devBypass]);

  if (devBypass) {
    return { user, isAuthenticated: true, isLoading: false };
  }

  return { user, isAuthenticated, isLoading };
};
