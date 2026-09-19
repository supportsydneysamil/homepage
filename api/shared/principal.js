const { ROLES } = require('./roleMap');

const toSingleHeader = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const getClientPrincipal = (req) => {
  const encoded = toSingleHeader((req.headers || {})['x-ms-client-principal']);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (!parsed || (!parsed.userId && !parsed.userDetails)) return null;
    return {
      userId: parsed.userId || '',
      userDetails: parsed.userDetails || '',
      identityProvider: parsed.identityProvider || '',
      userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : [],
    };
  } catch (error) {
    return null;
  }
};

// The rolesSource endpoint already expands admin into editor and member, so an
// exact match is enough here.
const requireRole = (req, role) => {
  const principal = getClientPrincipal(req);
  if (!principal) {
    return { error: { status: 401, body: { error: 'Sign-in required.', errorKo: '로그인이 필요합니다.' } } };
  }
  if (!principal.userRoles.includes(role)) {
    return {
      error: {
        status: 403,
        body: { error: `Role '${role}' is required.`, errorKo: `'${role}' 권한이 필요합니다.` },
      },
    };
  }
  return { principal };
};

const actorOf = (principal) => principal.userDetails || principal.userId || 'unknown';

module.exports = { ROLES, getClientPrincipal, requireRole, actorOf };
