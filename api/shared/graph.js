const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const getEnv = (name) => process.env[name] || '';

const getGraphToken = async () => {
  const tenantId = getEnv('AZURE_TENANT_ID');
  const clientId = getEnv('AZURE_CLIENT_ID');
  const clientSecret = getEnv('AZURE_CLIENT_SECRET');

  if (!tenantId || !clientId || !clientSecret) {
    return { error: { status: 500, detail: 'Missing AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET.' } };
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: GRAPH_SCOPE,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { error: { status: res.status, detail: detail.slice(0, 200) } };
  }

  const json = await res.json();
  if (!json.access_token) {
    return { error: { status: 500, detail: 'Missing access token from client credentials.' } };
  }
  return { token: json.access_token };
};

const getUserGroupIds = async (userKey, token) => {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userKey)}/memberOf?$select=id&$top=999`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const detail = await res.text();
    return { error: { status: res.status, detail: detail.slice(0, 200) } };
  }

  const json = await res.json();
  return { groupIds: (json.value || []).map((item) => item.id).filter(Boolean) };
};

module.exports = { getGraphToken, getUserGroupIds };
