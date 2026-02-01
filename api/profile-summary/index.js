const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_SELECT =
  'displayName,jobTitle,department,officeLocation,mobilePhone,mail,userPrincipalName';

const getEnv = (name) => process.env[name] || '';

const getClientPrincipal = (req) => {
  const encoded = req.headers['x-ms-client-principal'];
  if (!encoded) return null;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const getGraphToken = async (tenantId, clientId, clientSecret) => {
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: GRAPH_SCOPE,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return { error: { status: tokenRes.status, detail: text.slice(0, 200) } };
  }

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return { error: { status: 500, detail: 'Missing access token from client credentials.' } };
  }

  return { token: tokenJson.access_token };
};

const fetchJson = async (url, token) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    return { error: { status: res.status, detail: text.slice(0, 200) } };
  }
  return { data: await res.json() };
};

module.exports = async function (context, req) {
  const principal = getClientPrincipal(req);
  if (!principal?.userDetails && !principal?.userId) {
    context.res = { status: 401, body: { error: 'Missing authenticated user context.' } };
    return;
  }

  const tenantId = getEnv('AZURE_TENANT_ID');
  const clientId = getEnv('AZURE_CLIENT_ID');
  const clientSecret = getEnv('AZURE_CLIENT_SECRET');

  if (!tenantId || !clientId || !clientSecret) {
    context.res = {
      status: 500,
      body: { error: 'Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET in app settings.' },
    };
    return;
  }

  const tokenResult = await getGraphToken(tenantId, clientId, clientSecret);
  if (tokenResult.error) {
    context.res = {
      status: tokenResult.error.status || 500,
      body: { error: 'Graph token exchange failed.', detail: tokenResult.error.detail },
    };
    return;
  }

  const graphToken = tokenResult.token;
  const userKey = encodeURIComponent(principal.userDetails || principal.userId);

  const profileUrl = `https://graph.microsoft.com/v1.0/users/${userKey}?$select=${GRAPH_SELECT}`;
  const groupsUrl = `https://graph.microsoft.com/v1.0/users/${userKey}/memberOf?$select=id,displayName,description`;
  const rolesUrl = `https://graph.microsoft.com/v1.0/users/${userKey}/appRoleAssignments?$select=id,appRoleId,resourceDisplayName`;

  const [profileRes, groupsRes, rolesRes] = await Promise.all([
    fetchJson(profileUrl, graphToken),
    fetchJson(groupsUrl, graphToken),
    fetchJson(rolesUrl, graphToken),
  ]);

  if (profileRes.error) {
    context.res = {
      status: profileRes.error.status || 500,
      body: { error: 'Graph request failed.', detail: profileRes.error.detail },
    };
    return;
  }

  const groups =
    groupsRes.data?.value?.filter((item) => item['@odata.type'] === '#microsoft.graph.group') ?? [];
  const directoryRoles =
    groupsRes.data?.value?.filter((item) => item['@odata.type'] === '#microsoft.graph.directoryRole') ??
    [];
  const roles = rolesRes.data?.value ?? [];

  context.res = {
    status: 200,
    body: {
      profile: {
        displayName: profileRes.data.displayName || '',
        jobTitle: profileRes.data.jobTitle || '',
        department: profileRes.data.department || '',
        officeLocation: profileRes.data.officeLocation || '',
        mobilePhone: profileRes.data.mobilePhone || '',
        mail: profileRes.data.mail || '',
        userPrincipalName: profileRes.data.userPrincipalName || '',
      },
      groups: groups.map((group) => ({
        id: group.id,
        displayName: group.displayName || 'Unnamed group',
        description: group.description || '',
      })),
      appRoles: roles.map((role) => ({
        id: role.id,
        appRoleId: role.appRoleId,
        resourceDisplayName: role.resourceDisplayName || 'Unknown app',
      })),
      directoryRoles: directoryRoles.map((role) => ({
        id: role.id,
        displayName: role.displayName || 'Unnamed role',
        description: role.description || '',
      })),
    },
  };
};
