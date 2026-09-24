# Site Image Composition Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add non-destructive focal-point and zoom editing for the Home hero and pastor photos.

**Architecture:** A shared parser and style helper define image composition. Azure SQL stores one JSON object for both slots. The settings editor and public Home components consume the same values and rendering helper.

**Tech Stack:** Next.js 16, React 18, TypeScript, Azure Functions, Azure SQL, Node test runner.

## Global Constraints

- Keep original uploaded files unchanged.
- Allow focal coordinates from 0–100 and zoom from 1–2.
- Preserve existing settings when composition metadata is omitted.
- Add no image-editing dependency.

---

### Task 1: Composition model and persistence

**Files:**
- Create: `app/src/lib/imagePresentation.ts`
- Create: `app/src/lib/imagePresentation.test.ts`
- Modify: `app/src/lib/siteSettings.ts`
- Modify: `app/src/lib/ThemeContext.tsx`
- Modify: `api/shared/db.js`
- Modify: `api/site-settings/index.js`
- Test: `api/site-settings/index.test.js`

- [ ] Add failing parser tests for defaults, clamping, and CSS style output.
- [ ] Implement `ImageComposition`, `SiteImagePresentation`, parser, defaults, and style helper.
- [ ] Extend app settings types, context defaults, payload, and parsing.
- [ ] Add `ImagePresentationJson` schema migration and API GET/PUT persistence.
- [ ] Run app and API unit tests.

### Task 2: Public rendering

**Files:**
- Modify: `app/src/components/SitePhoto.tsx`
- Modify: `app/src/components/home/HomeHero.tsx`
- Modify: `app/src/components/home/PastorFeature.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] Let `SitePhoto` accept presentation metadata.
- [ ] Pass hero and pastor presentation from site settings.
- [ ] Replace fixed public object positioning with the shared composition style.
- [ ] Run typecheck and app tests.

### Task 3: Three-column composition editor

**Files:**
- Modify: `app/src/components/settings/SitePhotoField.tsx`
- Modify: `app/src/components/settings/HomeCopyFields.tsx`
- Modify: `app/src/components/settings/SiteCopyFields.tsx`
- Modify: `app/src/pages/settings.tsx`
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/lib/siteCopyEditor.test.ts`

- [ ] Add an editor render test for source, zoom, result, and reset controls.
- [ ] Add pointer and keyboard focal-point selection.
- [ ] Add zoom and composition reset controls.
- [ ] Add slot-specific result frames using the shared rendering metadata.
- [ ] Wire drafts into global save and preserve tab switching.
- [ ] Add responsive three-column and stacked layouts.

### Task 4: Verification

**Files:**
- Verify all files above.

- [ ] Render hero and pastor editors in published, pending-file, and reset states.
- [ ] Confirm source marker and result crop update together.
- [ ] Run `npm run typecheck`.
- [ ] Run `./node_modules/.bin/tsx --test src/lib/*.test.ts`.
- [ ] Run `npm run build`.
- [ ] Run `npm test` in `api`.
- [ ] Review lints and leave the change uncommitted for user approval.
