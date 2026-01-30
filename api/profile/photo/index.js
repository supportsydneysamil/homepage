const GRAPH_PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

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
    const response = await fetch(GRAPH_PHOTO_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
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
