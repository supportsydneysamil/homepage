type PagerProps = {
  page: number;
  pageCount: number;
  label: string;
  previousLabel: string;
  nextLabel: string;
  onChange: (page: number) => void;
};

const Pager = ({ page, pageCount, label, previousLabel, nextLabel, onChange }: PagerProps) => {
  if (pageCount <= 1) return null;

  return (
    <nav className="library-pager" aria-label={label}>
      <button
        type="button"
        className="library-pager__step"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        {previousLabel}
      </button>

      <span className="library-pager__pages">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            className={
              number === page ? 'library-pager__page library-pager__page--active' : 'library-pager__page'
            }
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
      </span>

      <button
        type="button"
        className="library-pager__step"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
      >
        {nextLabel}
      </button>
    </nav>
  );
};

export default Pager;
