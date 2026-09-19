const { resolveRoles } = require('../shared/roleMap');
const defaultGraph = require('../shared/graph');

const getEnv = (name) => process.env[name] || '';

module.exports = async function (context, req, graph = defaultGraph) {
  const body = req.body || {};
  const userKey = body.userDetails || body.userId;

  if (!userKey) {
    context.res = { status: 400, body: { error: 'Missing user identity in rolesSource request.' } };
    return;
  }

  const config = {
    memberGroupId: getEnv('SAMIL_GROUP_MEMBER_ID'),
    editorGroupId: getEnv('SAMIL_GROUP_EDITOR_ID'),
    adminGroupId: getEnv('SAMIL_GROUP_ADMIN_ID'),
  };

  // A Graph outage must not lock everyone out of the public site, so fall back
  // to no roles rather than an error.
  const tokenResult = await graph.getGraphToken();
  if (tokenResult.error) {
    context.log.error('roles: graph token failed', tokenResult.error.detail);
    context.res = { status: 200, body: { roles: [] } };
    return;
  }

  const groupResult = await graph.getUserGroupIds(userKey, tokenResult.token);
  if (groupResult.error) {
    context.log.error('roles: group lookup failed', groupResult.error.detail);
    context.res = { status: 200, body: { roles: [] } };
    return;
  }

  context.res = { status: 200, body: { roles: resolveRoles(groupResult.groupIds, config) } };
};
