const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const getEnv = (name) => process.env[name] || '';

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

module.exports = async function (context, req) {
  const token = getBearerToken(req);
  if (!token) {
    context.res = {
      status: 401,
      body: { error: 'Missing access token. Configure Entra ID + Graph permissions.' },
    };
    return;
  }

  try {
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

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        requested_token_use: 'on_behalf_of',
        scope: GRAPH_SCOPE,
        assertion: token,
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
      context.res = { status: 500, body: { error: 'Missing access token from OBO exchange.' } };
      return;
    }

    if (req.method && req.method.toUpperCase() === 'PUT') {
      const contentType = req.headers['content-type'] || req.headers['Content-Type'] || 'image/jpeg';
      const body =
        req.rawBody ||
        (Buffer.isBuffer(req.body)
          ? req.body
          : typeof req.body === 'string'
          ? Buffer.from(req.body, 'binary')
          : req.body && req.body.type === 'Buffer'
          ? Buffer.from(req.body.data)
          : null);

      if (!body) {
        context.res = { status: 400, body: { error: 'Missing photo bytes in request body.' } };
        return;
      }

      const putRes = await fetch(GRAPH_PHOTO_ENDPOINT, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${graphToken}`,
          'Content-Type': contentType,
        },
        body,
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        context.res = {
          status: putRes.status,
          body: { error: 'Graph photo update failed.', detail: text.slice(0, 200) },
        };
        return;
      }

      context.res = { status: 204 };
      return;
    }

    const response = await fetch(GRAPH_PHOTO_ENDPOINT, {
      headers: { Authorization: `Bearer ${graphToken}` },
    });

    if (response.status === 404) {
      context.res = { status: 204 };
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      context.res = {
        status: response.status,
        body: { error: 'Graph photo request failed.', detail: text.slice(0, 200) },
      };
      return;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    context.res = {
      status: 200,
      headers: { 'Content-Type': contentType },
      body: Buffer.from(buffer),
      isRaw: true,
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: 'Unable to reach Microsoft Graph.' },
    };
  }
};
