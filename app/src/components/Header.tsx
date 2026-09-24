import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useRoles } from '../lib/useRoles';
import { useSiteSettings } from '../lib/ThemeContext';
import AuthButton from './AuthButton';
import BrandMark from './BrandMark';

const navItems = [
  { href: '/', labelEn: 'Home', labelKo: '홈' },
  { href: '/about', labelEn: 'About', labelKo: '소개' },
  { href: '/worship', labelEn: 'Worship', labelKo: '예배' },
  { href: '/events', labelEn: 'Events', labelKo: '이벤트' },
  { href: '/sermons', labelEn: 'Sermons', labelKo: '설교' },
  { href: '/resources', labelEn: 'Resources', labelKo: '자료실' },
  { href: '/contact', labelEn: 'Contact', labelKo: '문의' },
];

const Header = () => {
  const { lang, toggleLang } = useLanguage();
  const { isEditor, isAdmin } = useRoles();
  const { logoImageUrl, churchInfo } = useSiteSettings();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpsOpen, setIsOpsOpen] = useState(false);
  const opsMenuRef = useRef<HTMLLIElement | null>(null);
  const isKo = lang === 'ko';

  useEffect(() => {
    setIsOpen(false);
    setIsOpsOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpsOpen(false);
    };
    const handleOutsideClick = (event: MouseEvent) => {
      if (!opsMenuRef.current?.contains(event.target as Node)) setIsOpsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpsOpen]);

  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  const opsLinks = [
    { href: '/manage', labelEn: 'Content management', labelKo: '자료 관리', exact: true },
    ...(isAdmin
      ? [{ href: '/manage/settings', labelEn: 'Site settings', labelKo: '사이트 설정', exact: false }]
      : []),
  ];

  return (
    <header className="header">
      <Link href="/" className="brand-link" aria-label={isKo ? '홈으로' : 'Home'}>
        <BrandMark src={logoImageUrl} />
        <span className="brand-text">
          <span className="brand-title">{churchInfo.brandTitle}</span>
          <span className="brand-subtitle">{churchInfo.churchNameKo}</span>
        </span>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={isOpen}
        aria-controls="site-navigation"
        aria-label={
          isOpen
            ? (isKo ? '메뉴 닫기' : 'Close menu')
            : (isKo ? '메뉴 열기' : 'Open menu')
        }
        onClick={() => setIsOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <nav id="site-navigation" className={isOpen ? 'site-nav site-nav--open' : 'site-nav'}>
        <ul className="nav">
          {navItems.map((item) => (
            <li key={item.href} className="nav__item">
              <Link
                href={item.href}
                className={isActive(item.href) ? 'nav__link nav__link--active' : 'nav__link'}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {isKo ? item.labelKo : item.labelEn}
              </Link>
            </li>
          ))}
          {isEditor ? (
            <li className="nav__item nav__item--menu" ref={opsMenuRef}>
              <button
                type="button"
                className={
                  isActive('/manage')
                    ? 'nav__link nav__menu-trigger nav__link--active'
                    : 'nav__link nav__menu-trigger'
                }
                aria-expanded={isOpsOpen}
                aria-haspopup="true"
                onClick={() => setIsOpsOpen((value) => !value)}
              >
                {isKo ? '운영' : 'Operations'}
                <span className="nav__menu-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
              {isOpsOpen ? (
                <ul className="nav__submenu" aria-label={isKo ? '운영 영역' : 'Operations areas'}>
                  {opsLinks.map((link) => {
                    const current = link.exact
                      ? router.pathname === link.href
                      : router.pathname.startsWith(link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={
                            current ? 'nav__submenu-link nav__submenu-link--active' : 'nav__submenu-link'
                          }
                          aria-current={current ? 'page' : undefined}
                        >
                          {isKo ? link.labelKo : link.labelEn}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
        <div className="site-nav__controls">
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label={isKo ? '영어로 보기' : '한국어로 보기'}
          >
            {isKo ? 'EN' : '한'}
          </button>
          <AuthButton />
        </div>
      </nav>
    </header>
  );
};

export default Header;
