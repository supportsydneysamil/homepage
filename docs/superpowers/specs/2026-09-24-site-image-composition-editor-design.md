# Site Image Composition Editor Design

## Goal

Turn the Home hero and pastor photo fields into useful, non-destructive composition editors that show the source image, the available framing controls, and the exact published result.

## Scope

- Source image preview with a draggable and keyboard-accessible focal point.
- Zoom from 100% to 200%.
- Slot-specific result preview using the same aspect ratio, crop, and shape as the public homepage.
- Reset composition independently from choosing or restoring an image.
- Persist focal point and zoom for the hero and pastor slots.
- Apply the saved composition on the public Home page.

The editor will not add opacity, colour filters, rotation, flips, or destructive raster cropping. Those controls do not solve a current site need and would make branding inconsistent.

## Layout

On wide screens, each photo editor uses three columns:

1. **Source** — the complete image with a visible focal-point marker.
2. **Composition** — instructions, zoom slider, zoom percentage, and reset.
3. **Result** — the exact hero or pastor frame used on the homepage.

The publication state and image actions remain in a full-width footer. Narrow screens stack the three areas.

## Data Model

```ts
type ImageComposition = {
  focusX: number; // 0–100
  focusY: number; // 0–100
  zoom: number;   // 1–2
};

type SiteImagePresentation = {
  hero: ImageComposition;
  pastor: ImageComposition;
};
```

Defaults are centred for the hero and use the current `center 24%` pastor crop. Parsing clamps invalid values. The API stores this object as `ImagePresentationJson` in `dbo.SiteSettings`.

## Rendering

The source file remains unchanged. Public images use:

- `object-position` from `focusX` and `focusY`
- `transform: scale(zoom)`
- `transform-origin` at the focal point

The same style helper is used by the editor result preview and public homepage to prevent preview drift.

## Saving and Compatibility

Existing settings without composition metadata receive defaults. Existing PUT requests may omit the new object and preserve stored values. The global save continues to upload any pending file first and then saves paths, content, and composition together.

## Verification

- Unit tests for defaults, clamping, and generated image styles.
- API tests for GET/PUT persistence and backward-compatible omission.
- Render tests for editor controls.
- Typecheck, all app tests, API tests, and production build.
