import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { phoneHref } from '../lib/churchInfo';
import { localize } from '../lib/siteCopy';
import BrandMark from './BrandMark';

const Footer = () => {
  const { lang } = useLanguage();
  const { logoImageUrl, churchInfo, siteCopy } = useSiteSettings();
  const footer = siteCopy.footer;

  return (
    <footer className="footer">
      <div className="footer__brand">
        <BrandMark src={logoImageUrl} className="footer__mark" />
        <div>
          <strong>{churchInfo.churchNameEn}</strong>
          <p>{localize(footer.tagline, lang)}</p>
        </div>
      </div>

      <div className="footer__details">
        <div>
          <span>{localize(footer.findUs, lang)}</span>
          <p>
            {churchInfo.addressLine1}
            <br />
            {churchInfo.addressLine2}
          </p>
        </div>
        <div>
          <span>{localize(footer.contact, lang)}</span>
          <a href={phoneHref(churchInfo.phone)}>{churchInfo.phone}</a>
          <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
        </div>
        <div>
          <span>{localize(footer.explore, lang)}</span>
          <Link href="/about">{localize(footer.about, lang)}</Link>
          <Link href="/worship">{localize(footer.worship, lang)}</Link>
          <Link href="/sermons">{localize(footer.sermons, lang)}</Link>
        </div>
      </div>

      <div className="footer__bottom">
        <small suppressHydrationWarning>
          &copy; {new Date().getFullYear()} {churchInfo.churchNameEn}
        </small>
        <Link href="/contact" className="footer__visit">
          {localize(footer.meetUs, lang)}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
