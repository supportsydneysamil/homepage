import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

const PageHero = ({ eyebrow, title, description, actions }: PageHeroProps) => (
  <header className="site-page-hero">
    <p className="site-kicker">{eyebrow}</p>
    <h1>{title}</h1>
    <p className="site-page-hero__description">{description}</p>
    {actions ? <div className="site-page-hero__actions">{actions}</div> : null}
  </header>
);

export default PageHero;
