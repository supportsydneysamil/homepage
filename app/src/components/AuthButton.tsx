import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getLoginUrl, getLogoutUrl, useSwaAuth } from '../lib/swaAuth';

const AVATAR_STORAGE_KEY = 'swa:avatar';
const AVATAR_CHECK_KEY = 'swa:avatar:checked';
const GRAPH_PHOTO_ENDPOINT = '/api/profile/photo';

const clearProfileCache = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AVATAR_STORAGE_KEY);
  window.localStorage.removeItem(AVATAR_CHECK_KEY);
  window.localStorage.removeItem('swa:profile');
};

const getInitials = (label: string) => {
  const trimmed = label.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/[\\s@._-]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'U';
};

const AuthButton = () => {
  const { user, isAuthenticated, isLoading } = useSwaAuth();
  const devBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== '0';
  const userLabel = user?.userDetails || 'Account';
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    setAvatar(window.localStorage.getItem(AVATAR_STORAGE_KEY));

    const maybeLoadRemoteAvatar = async () => {
      const alreadyChecked = window.localStorage.getItem(AVATAR_CHECK_KEY);
      if (alreadyChecked || window.localStorage.getItem(AVATAR_STORAGE_KEY)) {
        return;
      }
      try {
        const res = await fetch(GRAPH_PHOTO_ENDPOINT, { credentials: 'include' });
        if (!res.ok) return;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : null;
          if (result) {
            window.localStorage.setItem(AVATAR_STORAGE_KEY, result);
            window.dispatchEvent(new Event('swa-avatar-updated'));
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        // Ignore missing backend in local dev.
      } finally {
        window.localStorage.setItem(AVATAR_CHECK_KEY, '1');
      }
    };

    const handleAvatarUpdate = () => {
      setAvatar(window.localStorage.getItem(AVATAR_STORAGE_KEY));
    };
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('swa-avatar-updated', handleAvatarUpdate as EventListener);
    document.addEventListener('mousedown', handleOutsideClick);
    void maybeLoadRemoteAvatar();

    return () => {
      window.removeEventListener('swa-avatar-updated', handleAvatarUpdate as EventListener);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <button type="button" className="auth-button" disabled>
        Checking...
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <button type="button" className="auth-button" onClick={() => (window.location.href = getLoginUrl())}>
        Login
      </button>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button type="button" className="auth-button user-trigger" onClick={() => setOpen((prev) => !prev)}>
        {avatar ? (
          <img className="avatar" src={avatar} alt={`${userLabel} avatar`} />
        ) : (
          <span className="avatar avatar--placeholder" aria-hidden="true">
            {getInitials(userLabel)}
          </span>
        )}
        <span className="user-name">{userLabel}</span>
        <span className="chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="user-dropdown" role="menu" aria-label="Account menu">
          <Link className="dropdown-link" href="/profile" role="menuitem" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <button
            type="button"
            className="dropdown-link"
            onClick={() => {
              clearProfileCache();
              if (devBypass) {
                window.location.href = '/';
                return;
              }
              window.location.href = getLogoutUrl();
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AuthButton;
