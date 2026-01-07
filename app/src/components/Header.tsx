import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/worship', label: 'Worship' },
  { href: '/events', label: 'Events' },
  { href: '/sermons', label: 'Sermons' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
];

const Header = () => (
  <header className="header">
    <div className="header__brand">Community Church</div>
    <nav>
      <ul className="nav">
        {navItems.map((item) => (
          <li key={item.href} className="nav__item">
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  </header>
);

export default Header;
