import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';

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
  const isKo = lang === 'ko';

  return (
    <header className="header">
      <div className="header__brand">
        <Link href="/" className="brand-link">
          <span className="brand-mark">SC</span>
          <span className="brand-text">
            <span className="brand-title">Sydney Samil Church</span>
            <span className="brand-subtitle">시드니 삼일 교회</span>
          </span>
        </Link>
      </div>
      <nav>
        <ul className="nav">
          {navItems.map((item) => (
            <li key={item.href} className="nav__item">
              <Link href={item.href}>{isKo ? item.labelKo : item.labelEn}</Link>
            </li>
          ))}
          <li className="nav__item">
            <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
              {isKo ? 'EN' : '한/영'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
