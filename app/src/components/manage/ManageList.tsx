export type ManageListItem = {
  id: string;
  primary: string;
  secondary?: string;
};

type ManageListProps = {
  items: ManageListItem[];
  activeId: string | null;
  emptyLabel: string;
  editLabel: string;
  deleteLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingDeleteId: string | null;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

const ManageList = ({
  items,
  activeId,
  emptyLabel,
  editLabel,
  deleteLabel,
  confirmLabel,
  cancelLabel,
  pendingDeleteId,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: ManageListProps) => {
  if (!items.length) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <ul className="manage-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={item.id === activeId ? 'manage-list__row manage-list__row--active' : 'manage-list__row'}
        >
          <div className="manage-list__text">
            <strong>{item.primary}</strong>
            {item.secondary ? <span className="muted">{item.secondary}</span> : null}
          </div>

          {pendingDeleteId === item.id ? (
            <div className="manage-list__actions">
              <button
                type="button"
                className="manage-button manage-button--danger"
                onClick={() => onConfirmDelete(item.id)}
              >
                {confirmLabel}
              </button>
              <button type="button" className="manage-button manage-button--ghost" onClick={onCancelDelete}>
                {cancelLabel}
              </button>
            </div>
          ) : (
            <div className="manage-list__actions">
              <button type="button" className="manage-button manage-button--ghost" onClick={() => onEdit(item.id)}>
                {editLabel}
              </button>
              <button
                type="button"
                className="manage-button manage-button--ghost"
                onClick={() => onRequestDelete(item.id)}
              >
                {deleteLabel}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default ManageList;
