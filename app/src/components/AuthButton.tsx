import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getLoginUrl, getLogoutUrl, useSwaAuth } from '../lib/swaAuth';

const GRAPH_PHOTO_ENDPOINT = '/api/profile/photo';

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
    if (!isAuthenticated) return;

    const loadAvatar = async () => {
      try {
        const res = await fetch(GRAPH_PHOTO_ENDPOINT, { credentials: 'include' });
        if (!res.ok) {
          setAvatar(null);
          return;
        }
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) {
          setAvatar(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : null;
          setAvatar(result);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        setAvatar(null);
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    void loadAvatar();

    return () => {
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
