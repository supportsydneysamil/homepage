const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

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

  try {
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
      context.res = {
        status: tokenRes.status,
        body: { error: 'Graph token exchange failed.', detail: text.slice(0, 200) },
      };
      return;
    }

    const tokenJson = await tokenRes.json();
    const graphToken = tokenJson.access_token;
    if (!graphToken) {
      context.res = { status: 500, body: { error: 'Missing access token from client credentials.' } };
      return;
    }

    const userKey = encodeURIComponent(principal.userDetails || principal.userId);
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userKey}/memberOf?$select=id,displayName,description`,
      { headers: { Authorization: `Bearer ${graphToken}` } }
    );

    if (!response.ok) {
      const text = await response.text();
      context.res = {
        status: response.status,
        body: { error: 'Graph request failed.', detail: text.slice(0, 200) },
      };
      return;
    }

    const data = await response.json();
    const groups =
      data.value?.filter((item) => item['@odata.type'] === '#microsoft.graph.group') ?? [];

    context.res = {
      status: 200,
      body: {
        count: groups.length,
        groups: groups.map((group) => ({
          id: group.id,
          displayName: group.displayName || 'Unnamed group',
          description: group.description || '',
        })),
      },
    };
  } catch (error) {
    context.res = { status: 500, body: { error: 'Unable to reach Microsoft Graph.' } };
  }
};
