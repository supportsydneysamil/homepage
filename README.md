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
