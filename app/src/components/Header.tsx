import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  const { isEditor } = useRoles();
  const { logoImageUrl } = useSiteSettings();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isKo = lang === 'ko';

  useEffect(() => {
    setIsOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  return (
    <header className="header">
      <Link href="/" className="brand-link" aria-label={isKo ? '홈으로' : 'Home'}>
        <BrandMark src={logoImageUrl} />
        <span className="brand-text">
          <span className="brand-title">Sydney Samil</span>
          <span className="brand-subtitle">시드니 삼일교회</span>
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
            <li className="nav__item">
              <Link
                href="/manage"
                className={isActive('/manage') ? 'nav__link nav__link--active' : 'nav__link'}
              >
                {isKo ? '자료 관리' : 'Manage'}
              </Link>
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
