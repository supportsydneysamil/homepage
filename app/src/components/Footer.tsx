import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';

const Footer = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__mark" aria-hidden="true">S</span>
        <div>
          <strong>Sydney Samil Church</strong>
          <p>{isKo ? '믿음이 삶이 되는 공동체' : 'A community where faith becomes life'}</p>
        </div>
      </div>

      <div className="footer__details">
        <div>
          <span>{isKo ? '찾아오시는 길' : 'Find us'}</span>
          <p>Corner Bellamy St &amp; Boundary Rd<br />Pennant Hills NSW 2120</p>
        </div>
        <div>
          <span>{isKo ? '연락처' : 'Contact'}</span>
          <a href="tel:+61433576500">0433 576 500</a>
          <a href="mailto:info@sydneysamil.org">info@sydneysamil.org</a>
        </div>
        <div>
          <span>{isKo ? '둘러보기' : 'Explore'}</span>
          <Link href="/about">{isKo ? '교회 소개' : 'About'}</Link>
          <Link href="/worship">{isKo ? '예배 안내' : 'Worship'}</Link>
          <Link href="/sermons">{isKo ? '설교' : 'Sermons'}</Link>
        </div>
      </div>

      <div className="footer__bottom">
        <small suppressHydrationWarning>
          &copy; {new Date().getFullYear()} Sydney Samil Church
        </small>
        <Link href="/contact" className="footer__visit">
          {isKo ? '이번 주일에 만나요' : 'Meet us this Sunday'}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
