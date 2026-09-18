# Azure Static Web Apps Runtime Update Plan

**Status:** Validated

## Scope

Modernize the existing Sydney Samil Church Azure Static Web Apps build configuration without changing Azure resources or deploying.

## Current State

- Frontend: Next.js `14.2.3`, React `18.2.0`, static export to `app/out`.
- Repository `.nvmrc`: Node `20`.
- Frontend `app/package.json`: no Node engine declared.
- Functions `api/package.json`: Node `18`.
- `app/staticwebapp.config.json`: no explicit API runtime.
- GitHub Actions deploys `app/out` and the `api` directory through `Azure/static-web-apps-deploy@v1`.

## Approved Target

- Next.js `14.2.35` with React 18 retained.
- Frontend build engine: Node `20.x`.
- Azure Functions API runtime: Node `20`.
- Existing Pages Router, static export, authentication, API routes, and deployment workflow retained.

## Planned Changes

1. Update `app/package.json` and lockfile to exact Next.js `14.2.35`.
2. Add `"engines": { "node": "20.x" }` to `app/package.json`.
3. Change `api/package.json` Node engine from `18` to `20.x`.
4. Add `"platform": { "apiRuntime": "node:20" }` to `app/staticwebapp.config.json`.
5. Install with the lockfile and run utility tests, TypeScript checking, static export, sitewide smoke checks, and `npm audit --omit=dev`.
6. Do not deploy or push unless separately requested.

## Azure Compatibility

- Azure Static Web Apps supports Node.js 20 for frontend Oryx builds and Functions APIs.
- Next.js 14.2.35 requires Node.js 18.17 or newer.
- The generated `out` directory remains provider-neutral static HTML/CSS/JavaScript.

## Rollback

Revert the package/configuration changes and reinstall from the prior lockfiles. No Azure resource migration or data change is involved.

## Verification Results

- Node `20.20.2`: frontend utility tests passed (4/4).
- Node `20.20.2`: TypeScript check and Next.js `14.2.35` static export passed (14 routes).
- Sitewide static-export smoke checks passed.
- Node `20.20.2`: all Azure Functions JavaScript entry points passed syntax checks.
- Frontend audit still reports 2 high and 1 critical advisory; npm recommends the breaking Next.js 16 upgrade for full remediation.
- API audit reports 3 moderate transitive advisories through Azure Identity/MSAL/UUID.
- No deployment or push was performed.

## Validation Steps

- Validate all JSON configuration files and exact runtime values.
- Confirm GitHub Actions paths still target `app`, `api`, and `out`.
- Install frontend and API lockfiles under Node 20.
- Run frontend tests, TypeScript check, static export, and route smoke checks.
- Run syntax checks for every Functions entry point.
- Record dependency audit findings without applying breaking upgrades.

## Validation Proof

- `npx --yes -p node@20 -c 'cd app && node -v && npm ci … npm run build'`
  - Node `v20.20.2`
  - 4/4 tests passed
  - TypeScript passed
  - Next.js `14.2.35` generated all 14 static routes
- `python3 scripts/check-homepage.py`
  - Sitewide static export checks passed
- `npx --yes -p node@20 -c 'cd api && node -v && npm ci … node --check'`
  - Node `v20.20.2`
  - API dependencies installed
  - All Functions entry points passed syntax checks
- Azure SWA runtime configuration assertion
  - Frontend engine `20.x`
  - API engine `20.x`
  - SWA API runtime `node:20`
  - Workflow paths unchanged and valid
- Static RBAC verification
  - No Bicep/Terraform or role assignments changed; existing SWA route roles remain unchanged
