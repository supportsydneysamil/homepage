import { useEffect, useState } from 'react';

type DirectoryRolesResponse = {
  roles?: Array<{ displayName?: string }>;
};

const isGlobalAdministrator = (roleName: string) =>
  roleName.trim().toLowerCase() === 'global administrator';

export const useGlobalAdmin = (enabled: boolean) => {
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setIsGlobalAdmin(false);
      setIsChecking(false);
      return;
    }

    const devBypass =
      process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_GLOBAL_ADMIN_BYPASS !== '0';
    if (devBypass) {
      setIsGlobalAdmin(true);
      setIsChecking(false);
      return;
    }

    let isMounted = true;
    setIsChecking(true);

    const loadRoles = async () => {
      try {
        const res = await fetch('/api/profile/directory-roles', { credentials: 'include' });
        if (!res.ok) {
          if (!isMounted) return;
          setIsGlobalAdmin(false);
          setIsChecking(false);
          return;
        }

        const data = (await res.json()) as DirectoryRolesResponse;
        const hasGlobalAdmin =
          data.roles?.some((role) => role.displayName && isGlobalAdministrator(role.displayName)) ?? false;

        if (!isMounted) return;
        setIsGlobalAdmin(hasGlobalAdmin);
        setIsChecking(false);
      } catch (error) {
        if (!isMounted) return;
        setIsGlobalAdmin(false);
        setIsChecking(false);
      }
    };

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return { isGlobalAdmin, isChecking };
};
