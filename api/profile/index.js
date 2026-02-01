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

const getBearerToken = (req) => {
  const headerToken =
    req.headers['x-ms-token-aad-access-token'] ||
    req.headers['X-MS-TOKEN-AAD-ACCESS-TOKEN'] ||
    req.headers.authorization ||
    req.headers.Authorization;
  if (!headerToken) return null;
  if (headerToken.startsWith('Bearer ')) return headerToken.slice(7);
  return headerToken;
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

module.exports = async function (context, req) {
  const principal = getClientPrincipal(req);
  if (!principal?.userDetails && !principal?.userId) {
    context.res = {
      status: 401,
      body: { error: 'Missing authenticated user context.' },
    };
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
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userKey}?$select=${GRAPH_SELECT}`, {
      headers: { Authorization: `Bearer ${graphToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      context.res = {
        status: response.status,
        body: { error: 'Graph request failed.', detail: text.slice(0, 200) },
      };
      return;
    }

    const data = await response.json();
    context.res = {
      status: 200,
      body: {
        displayName: data.displayName || '',
        jobTitle: data.jobTitle || '',
        department: data.department || '',
        officeLocation: data.officeLocation || '',
        mobilePhone: data.mobilePhone || '',
        mail: data.mail || '',
        userPrincipalName: data.userPrincipalName || '',
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: 'Unable to reach Microsoft Graph.' },
    };
  }
};

module.exports.getGraphToken = getGraphToken;
