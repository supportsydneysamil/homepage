export const MANAGE_TABS = ['resources', 'sermons', 'events'] as const;

export type ManageTab = (typeof MANAGE_TABS)[number];

type QueryValue = string | string[] | undefined;

const firstValue = (value: QueryValue): string => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

const isManageTab = (value: string): value is ManageTab => MANAGE_TABS.includes(value as ManageTab);

export const parseManageQuery = (query: Record<string, QueryValue>) => {
  const tab = firstValue(query.tab);
  const editId = firstValue(query.edit).trim();

  return {
    tab: isManageTab(tab) ? tab : 'resources',
    editId: editId || null,
  };
};

export const buildManageHref = (tab: ManageTab, editId?: string) =>
  editId ? `/manage?tab=${tab}&edit=${encodeURIComponent(editId)}` : `/manage?tab=${tab}`;
