# Global Homepage Images

## Goal

Give administrators a small operational way to replace two rarely changed brand photos without a deploy: the church photo in the homepage hero frame, and the lead pastor portrait. This is not a homepage editor, media library, or design tool. The current layout, crops, theme behavior, bilingual UI, and built-in image fallbacks stay as they are.

## Product Judgment

These photos are homepage content, not theme. They change infrequently, so the feature exists for operational independence, not for design completeness. If an administrator never needs to replace the files without a developer, the built-in `/church-bg.png` and `/pastor.jpg` assets remain sufficient.

Because the site already has one administrator-only Global Settings page, that is the least extra surface. A dedicated homepage CMS, cropper, or gallery would add more risk than value: a poorly framed upload can weaken the homepage more than the convenience helps.

## Scope

Global Settings continues to own the website theme. Directly below it, a separate Homepage photos section owns exactly two images:

- Church photo in the arched `HomeHero` frame
- Lead pastor portrait in `PastorFeature`

The church photo does not replace the `church` theme's fixed page background, the visit map fallback, theme preview artwork, or page-title heroes on other routes.

Out of scope:

- Pastor name, biography, contact details, hero copy, or service times
- Image focal-point or crop editing
- Multiple photos, seasonal heroes, or a media library
- Theme background artwork
- A new homepage-editing page or event-admin placement

## User Experience

The settings page stays compact. Theme cards remain a distinct block. Homepage photos is a second block with a short note that the photos appear only on the homepage and that landscape church photos and portrait pastor photos work best.

Each photo control is one slot:

- Current published image, previewed in a shape close to the live frame (arch-like for the church photo, portrait for the pastor photo)
- One file picker for JPEG, PNG, or WebP
- One reset action that restores the built-in image
- One line of recommended shape: church photo about 4:3 or wider; pastor photo about 4:5. Dimensions are not enforced.

Selecting a file updates only the local preview. The existing Save and Apply Globally action remains the only publish step: it uploads newly selected files and saves the theme plus both photo choices together. While saving, the action is disabled. After a successful save, previews show the published URLs and any temporary object URLs are revoked.

Reset is local until save. Saving with a reset sends a null path for that photo and restores the built-in asset on the homepage.

Errors appear in Korean or English. If saving fails, the published homepage stays unchanged and the administrator can retry without picking the files again.

Do not add extra controls, galleries, drag-and-drop canvases, or live homepage mockups beyond the two framed previews.

## Image Presentation

The two photos keep their current roles:

- The church image stays inside the large arched hero frame with `object-fit: cover`.
- The pastor image stays inside the editorial portrait frame with the existing portrait crop.

Existing responsive CSS continues to crop on desktop, tablet, and mobile. The settings preview should hint at those frames so an administrator can judge composition before saving, without becoming a visual editor.

## Settings Data

`dbo.SiteSettings` remains a single row keyed by `theme`. Two nullable columns are added idempotently:

- `HeroImagePath NVARCHAR(400)`
- `PastorImagePath NVARCHAR(400)`

Persist blob paths, not complete storage URLs. The public `GET /api/site-settings` response derives and returns:

- `themeId`
- `heroImageUrl`
- `pastorImageUrl`

Null image paths mean the built-in defaults. The client falls back to `/church-bg.png` and `/pastor.jpg`.

The administrator-only `PUT /api/site-settings` accepts the theme ID and nullable image paths. Non-null paths must belong to the dedicated `site/` folder. One SQL operation updates all settings and records the actor and update time.

## Upload and Storage

Reuse the existing direct-to-Azure-Blob SAS upload flow. Add a `site` folder with these rules:

- Only administrators may request an upload URL for this folder.
- Only JPEG, PNG, and WebP are accepted.
- The existing 25 MB maximum remains the server-side safety limit.
- `site` blobs use the existing public media container so anonymous visitors can load homepage images.
- Generated paths use the existing randomized filename scheme under `site/`.

The upload helper gains `site` as a supported folder. Other upload folders and permissions stay unchanged.

After a successful settings update, a replaced prior `site/` blob is deleted on a best-effort basis. The database update is the source of truth: a cleanup failure is logged and does not roll back a published setting.

## Client Architecture and Data Flow

The current theme provider already loads `/api/site-settings` for every page. Generalize it to expose the complete site settings without a second global request. Keep `useTheme` as a thin wrapper so existing theme consumers do not change.

On page load:

1. The provider fetches public site settings.
2. It normalizes the theme and resolves null image values to built-in paths.
3. `HomeHero` receives the resolved hero URL.
4. `PastorFeature` receives the resolved pastor URL.

On administrator save:

1. Validate selected files locally.
2. Upload only newly selected files through the SAS flow.
3. Send the selected theme and resulting image paths in one settings update.
4. The API validates paths and commits the row.
5. The provider adopts the returned values immediately.
6. The API attempts to remove replaced uploaded blobs.

## Failure Handling

- A settings fetch failure keeps the `church` theme and built-in image paths.
- An invalid type or empty/oversized file is rejected before upload and by the server.
- If an upload fails, the settings update is not sent.
- If the settings update fails after an upload, published values do not change; the selected file remains available for retry in the current page session.
- If a remote image later fails to load, the image component switches once to its built-in fallback.
- Blob deletion failures are logged and do not break published settings.

## Security

- Reading site settings and images remains public.
- Only the `admin` role can save settings, request `site/` upload URLs, or reset images.
- The API accepts only generated `site/` blob paths from the configured public container. External URLs and paths from other folders are rejected.
- Existing editor access to event, resource, sermon, and media uploads is unchanged.

## Testing and Verification

Automated coverage will include:

- Schema creation and idempotent addition of the two nullable columns
- Public settings response with uploaded and default image values
- Administrator save, reset, invalid theme, invalid path, and non-admin denial
- `site` upload validation, image type restrictions, and administrator-only authorization
- Client file validation and site-folder upload behavior
- Provider normalization and fallback behavior
- Global Settings: separate theme and photos blocks, framed previews, save, and reset
- Hero and pastor components using configured URLs and recovering to built-in assets on image errors

Verification will run API tests, frontend tests, TypeScript checking, and the production build. Check the homepage and settings page at desktop and mobile widths in Korean and English, including default, uploaded, reset, failed-image, light-theme, and dark-theme states. Confirm the settings photos UI stays a small second block and does not read as a homepage builder.
