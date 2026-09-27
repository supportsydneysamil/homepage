import Link from 'next/link';
import type { Language } from './homeContent';
import { useSiteSettings } from '../../lib/ThemeContext';
import { localize } from '../../lib/siteCopy';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const QuickInfo = ({ lang }: { lang: Language }) => {
  const isKo = lang === 'ko';
  const { siteCopy } = useSiteSettings();
  const quick = siteCopy.home.quick;
  const links = [
    { href: '/sermons', title: quick.sermons, hint: quick.sermonsHint },
    { href: '/events', title: quick.events, hint: quick.eventsHint },
    { href: '/resources', title: quick.resources, hint: quick.resourcesHint },
  ];

  return (
    <nav className="home-quick-info" aria-label={isKo ? '바로가기' : 'Shortcuts'}>
      {links.map((link, index) => (
        <Link href={link.href} className="home-quick-card" key={link.href}>
          <span className="home-quick-card__number">0{index + 1}</span>
          <span>
            <strong>{localize(link.title, lang)}</strong>
            <small>{localize(link.hint, lang)}</small>
          </span>
          <ArrowIcon />
        </Link>
      ))}
    </nav>
  );
};

export default QuickInfo;
