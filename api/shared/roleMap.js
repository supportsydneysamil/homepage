const ROLES = { MEMBER: 'member', EDITOR: 'editor', ADMIN: 'admin' };

const normalize = (value) => String(value || '').trim().toLowerCase();

const resolveRoles = (groupIds, config) => {
  const ids = new Set((groupIds || []).map(normalize).filter(Boolean));
  const memberId = normalize(config.memberGroupId);
  const editorId = normalize(config.editorGroupId);
  const adminId = normalize(config.adminGroupId);

  const roles = new Set();
  if (adminId && ids.has(adminId)) {
    roles.add(ROLES.ADMIN);
    roles.add(ROLES.EDITOR);
    roles.add(ROLES.MEMBER);
  }
  if (editorId && ids.has(editorId)) {
    roles.add(ROLES.EDITOR);
    roles.add(ROLES.MEMBER);
  }
  if (memberId && ids.has(memberId)) {
    roles.add(ROLES.MEMBER);
  }

  return Array.from(roles);
};

module.exports = { ROLES, resolveRoles };
