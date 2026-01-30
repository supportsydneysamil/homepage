const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';

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
    const response = await fetch(GRAPH_ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
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
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: 'Unable to reach Microsoft Graph.' },
    };
  }
};
