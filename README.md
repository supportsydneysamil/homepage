# Church Website (Next.js Static Export)

A production-ready starter for a church website built with Next.js (Pages Router) and TypeScript, optimized for Azure Static Web Apps using static export.

## Prerequisites
- Node.js 18+
- npm

## Install
```bash
cd app
npm install
```

## Run Locally
```bash
npm run dev
```
The site will be available at http://localhost:3000.

## Local Auth (Azure Static Web Apps)
Azure Static Web Apps authentication endpoints (/.auth/*) are not available in plain `next dev`.
To test login locally, use the SWA emulator:

```bash
npm i -g @azure/static-web-apps-cli
cd app
npm run dev:swa
```

This starts the Next.js dev server and proxies through the SWA emulator so `/.auth/login/aad` works.

### Dev Bypass (default in development)
Auth is bypassed by default when running `next dev`. To disable the bypass and test real auth,
set `NEXT_PUBLIC_DEV_AUTH_BYPASS=0`.

```bash
cd app
NEXT_PUBLIC_DEV_AUTH_BYPASS=0 npm run dev
```

This bypass is development-only and will not apply in production builds.

## Entra ID Profile + Photo (optional)
The profile page can pull a user's Entra ID details and avatar if you provide backend endpoints:

- `GET /api/profile` → JSON with `displayName`, `jobTitle`, `mobilePhone`
- `GET /api/profile/photo` → raw image bytes

These should be implemented in Azure Functions (or another backend) that proxies Microsoft Graph
with user consent. Once those endpoints exist, the UI will sync automatically.

### Azure Functions + Microsoft Graph setup (minimal)
- Add delegated Microsoft Graph permission `User.Read` to the Entra ID app used by SWA.
- Grant admin consent for the permission.
- Deploy the Functions in `/api` alongside the static app so `/api/profile` and `/api/profile/photo` are reachable.
- The functions expect an access token in `x-ms-token-aad-access-token` (SWA injects this when auth is configured).

## Build for Azure Static Web Apps
```bash
npm run build
```
This produces a static export in the `out` directory (because `output: "export"` in `next.config.js`). Configure Azure Static Web Apps to serve from `out`.

## Folder Structure
- `app/next.config.js` — Next.js configured for static export and unoptimized images.
- `app/package.json` — Project metadata and scripts.
- `app/src/pages/` — Pages for Home, About, Worship, Events (with dynamic event detail), Sermons, Resources, and Contact.
- `app/src/components/` — Shared layout, header, and footer.
- `app/src/content/` — JSON content files for sermons, events, and resources.
- `app/src/styles/globals.css` — Global styles.

## Notes
- Rendering uses static generation only; no API routes or server-side rendering.
- Media assets are loaded from external URLs (e.g., Azure Blob Storage, YouTube).
- Content can be updated by editing the JSON files under `src/content/`.
