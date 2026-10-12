export const CLOUDFLARE_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

export const cloudflareBeaconConfig = (token: string | undefined, nodeEnv: string | undefined) =>
  nodeEnv === 'production' && token && /^[A-Za-z0-9]+$/.test(token) ? JSON.stringify({ token }) : null;
