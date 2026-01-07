import { useLanguage } from '../lib/LanguageContext';

const Footer = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <footer className="footer">
      <div>
        <p className="muted">Sydney Samil Church | 시드니 삼일 교회</p>
        <p className="muted">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
      <div className="footer__cta">
        <p className="muted">{isKo ? '이번 주 함께 예배드려요.' : 'We would love to meet you this weekend.'}</p>
        <a className="button ghost" href="/contact">
          {isKo ? '방문 예약' : 'Plan a Visit'}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
