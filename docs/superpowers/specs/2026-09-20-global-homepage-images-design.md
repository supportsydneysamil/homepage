# Global Homepage Images

## Goal

Allow administrators to change the church image in the homepage hero and the lead pastor portrait from Global Settings. Preserve the current homepage composition, theme behavior, bilingual UI, and static image fallbacks.

## Scope

Global Settings will manage three site-wide values:

- Website theme
- Homepage hero church image
- Lead pastor portrait

The uploaded church image applies only to the framed image on the right side of `HomeHero`. It does not replace the `church` theme's fixed page background, the visit map fallback, theme preview artwork, or page-title hero components on other routes.

The uploaded pastor image applies only to the portrait in `PastorFeature`.

Editing pastor name, biography, contact details, hero copy, service times, image focal points, or theme background artwork is outside this change.

## User Experience

The existing administrator-only Global Settings page keeps the theme selector and adds a Homepage Images section with two image controls.

Each control shows:

- A label and brief recommended shape: landscape for the church image and portrait for the pastor image
- The currently published image, or a preview of a newly selected file
- A file picker accepting JPEG, PNG, and WebP
- A reset action that restores the built-in image

Selecting a file changes only the local preview. The existing Save and Apply Globally action uploads selected files and saves the theme and both image choices together. While saving, the action is disabled. A successful save replaces the previews with the published URLs and revokes any temporary object URLs.

The settings page reports validation, upload, and save errors in Korean or English. If saving fails, the currently published homepage remains unchanged and the administrator can retry without selecting the files again.

## Image Presentation

The current design intentionally gives the two images different roles:

- The church image remains inside the large arched hero frame with `object-fit: cover`.
- The pastor image remains inside the editorial portrait frame with the existing portrait crop.

The implementation will not reuse an uploaded church image as a full-page theme background. A photo suitable for the landscape hero crop may not provide sufficient contrast or composition as a fixed background. Keeping these roles separate also prevents an administrator image change from unexpectedly altering the whole theme.

The UI will recommend source images rather than enforce exact dimensions:

- Church hero: landscape, approximately 4:3 or wider
- Pastor portrait: portrait, approximately 4:5

Existing responsive CSS continues to control the final crop on desktop, tablet, and mobile.

## Settings Data

`dbo.SiteSettings` remains a single row keyed by `theme`. Two nullable columns are added idempotently:

- `HeroImagePath NVARCHAR(400)`
- `PastorImagePath NVARCHAR(400)`

Blob paths, not complete storage URLs, are persisted. This keeps storage-account and container configuration out of database content. The public `GET /api/site-settings` response derives and returns:

- `themeId`
- `heroImageUrl`
- `pastorImageUrl`

Null image paths represent the built-in defaults. The client falls back to `/church-bg.png` and `/pastor.jpg` respectively.

The administrator-only `PUT /api/site-settings` accepts the theme ID and nullable image paths. It validates that non-null paths belong to the dedicated `site/` folder, updates all settings in one SQL operation, and records the actor and update time.

## Upload and Storage

The existing direct-to-Azure-Blob SAS upload flow is reused. A new `site` upload folder is added with these rules:

- Only administrators may request an upload URL for this folder.
- Only JPEG, PNG, and WebP are accepted.
- The existing 25 MB maximum remains the server-side safety limit.
- `site` blobs use the existing public media container because homepage images must load for anonymous visitors.
- Generated paths use the existing randomized filename scheme under `site/`.

The upload helper gains `site` as a supported folder. Other upload folders and permissions remain unchanged.

After a successful settings update, a replaced prior `site/` blob is deleted on a best-effort basis. The database update is the source of truth: a cleanup failure is logged but does not roll back a successfully published setting.

## Client Architecture and Data Flow

The current theme provider already loads `/api/site-settings` for every page. It will be generalized to expose the complete site settings without adding a second global request. Existing theme behavior remains available through the same provider API or a compatibility hook.

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

Resetting an image sends `null` for that image path and restores the corresponding built-in asset.

## Failure Handling

- A settings fetch failure keeps the current `church` theme and built-in image paths.
- An invalid type or empty/oversized file is rejected before upload and is also rejected by the server.
- If an upload fails, the settings update is not sent, so published values do not change.
- If the settings update fails after an upload, published values do not change; the selected file remains available for retry during the current page session.
- If a remote image later fails to load, the image component switches once to its built-in fallback to avoid a broken homepage image.
- Blob deletion failures are logged and do not break the published settings.

## Security

- Reading site settings and images remains public.
- Only the `admin` role can save settings, request `site/` upload URLs, or reset images.
- The API accepts only generated `site/` blob paths from the configured public container; arbitrary external URLs and paths from other folders are rejected.
- Existing editor access to event, resource, sermon, and media uploads is unchanged.

## Testing and Verification

Automated coverage will include:

- Schema creation and idempotent addition of the two nullable columns
- Public settings response with uploaded and default image values
- Administrator save, reset, invalid theme, invalid path, and non-admin denial
- `site` upload validation, image type restrictions, and administrator-only authorization
- Client file validation and site-folder upload behavior
- Provider normalization and fallback behavior
- Global Settings previews and save/reset interactions
- Hero and pastor components using configured URLs and recovering to built-in assets on image errors

Verification will run API tests, frontend tests, TypeScript checking, and the production build. The homepage and settings page will be checked at desktop and mobile widths in Korean and English, including the default, uploaded, reset, failed-image, light-theme, and dark-theme states.
