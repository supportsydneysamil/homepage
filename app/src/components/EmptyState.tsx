import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
};

const EmptyState = ({
  title,
  description,
  href,
  linkLabel,
}: EmptyStateProps) => (
  <div className="site-empty-state">
    <span className="site-empty-state__mark" aria-hidden="true" />
    <h2>{title}</h2>
    <p>{description}</p>
    {href && linkLabel ? (
      <Link href={href} className="site-text-link">
        {linkLabel}
        <span aria-hidden="true">→</span>
      </Link>
    ) : null}
  </div>
);

export default EmptyState;
