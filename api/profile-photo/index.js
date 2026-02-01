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
    context.res = {
      status: 401,
      body: { error: 'Missing authenticated user context.' },
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
    const photoEndpoint = `https://graph.microsoft.com/v1.0/users/${userKey}/photo/$value`;

    if (req.method && req.method.toUpperCase() === 'PUT') {
      const contentType = req.headers['content-type'] || req.headers['Content-Type'] || 'image/jpeg';
      const isImage = contentType.startsWith('image/');
      if (!isImage) {
        context.res = { status: 400, body: { error: 'Invalid content type. Use image/jpeg or image/png.' } };
        return;
      }

      const raw =
        req.rawBody ||
        (Buffer.isBuffer(req.body)
          ? req.body
          : req.body && req.body.type === 'Buffer'
          ? Buffer.from(req.body.data)
          : null);

      let body = raw;
      if (!body && typeof req.body === 'string') {
        const trimmed = req.body.trim();
        if (trimmed.startsWith('data:')) {
          const base64 = trimmed.split(',')[1] || '';
          body = Buffer.from(base64, 'base64');
        } else {
          const isBase64 = /^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0;
          body = Buffer.from(trimmed, isBase64 ? 'base64' : 'binary');
        }
      }

      if (!body || body.length === 0) {
        context.res = { status: 400, body: { error: 'Missing photo bytes in request body.' } };
        return;
      }

      const putRes = await fetch(photoEndpoint, {
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

    const response = await fetch(photoEndpoint, {
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
