import { useSwaAuth, type ClientPrincipal } from './swaAuth';

export type SiteRole = 'member' | 'editor' | 'admin';

export const hasRole = (user: ClientPrincipal | null | undefined, role: SiteRole): boolean =>
  Boolean(user?.userRoles?.includes(role));

export const useRoles = () => {
  const { user, isLoading } = useSwaAuth();
  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_ROLE_BYPASS !== '0';

  if (devBypass) {
    return { isMember: true, isEditor: true, isAdmin: true, isLoading: false };
  }

  return {
    isMember: hasRole(user, 'member'),
    isEditor: hasRole(user, 'editor'),
    isAdmin: hasRole(user, 'admin'),
    isLoading,
  };
};
