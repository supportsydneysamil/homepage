export type ManageFilterOption = {
  value: string;
  label: string;
  count?: number;
};

type ManageToolbarProps = {
  id: string;
  filterLabel: string;
  filterValue: string;
  filterOptions: ManageFilterOption[];
  // Years keep growing, so they get a select while the fixed sets stay as chips.
  filterAs: 'chips' | 'select';
  onFilterChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  clearLabel: string;
  onSearchChange: (value: string) => void;
  countLabel: string;
};

const optionLabel = (option: ManageFilterOption) =>
  option.count === undefined ? option.label : `${option.label} (${option.count})`;

const ManageToolbar = ({
  id,
  filterLabel,
  filterValue,
  filterOptions,
  filterAs,
  onFilterChange,
  searchLabel,
  searchPlaceholder,
  searchValue,
  clearLabel,
  onSearchChange,
  countLabel,
}: ManageToolbarProps) => (
  <div className="manage-toolbar">
    <div className="library-controls">
      {filterAs === 'chips' ? (
        <nav className="library-tabs" aria-label={filterLabel}>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === filterValue ? 'library-tab library-tab--active' : 'library-tab'}
              aria-current={option.value === filterValue ? 'true' : undefined}
              onClick={() => onFilterChange(option.value)}
            >
              {optionLabel(option)}
            </button>
          ))}
        </nav>
      ) : (
        <div className="manage-filter">
          <label className="visually-hidden" htmlFor={`${id}-filter`}>
            {filterLabel}
          </label>
          <select
            id={`${id}-filter`}
            value={filterValue}
            onChange={(changeEvent) => onFilterChange(changeEvent.target.value)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="library-search">
        <label className="visually-hidden" htmlFor={`${id}-search`}>
          {searchLabel}
        </label>
        <input
          id={`${id}-search`}
          type="search"
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(changeEvent) => onSearchChange(changeEvent.target.value)}
        />
        {searchValue ? (
          <button
            type="button"
            className="library-search__clear"
            onClick={() => onSearchChange('')}
            aria-label={clearLabel}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
    </div>

    <p className="library-count" role="status" aria-live="polite">
      {countLabel}
    </p>
  </div>
);

export default ManageToolbar;
