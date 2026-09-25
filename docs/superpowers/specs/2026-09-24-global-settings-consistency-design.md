# Global Settings Consistency Design

## Goal

Make Appearance, Church Information, and Site Copy behave as one coherent settings workspace without changing the existing content model or single global save action.

## Save Experience

- Detect changes independently for Appearance, Church Information, and Site Copy.
- Keep one fixed save bar visible across all tabs.
- Name the tabs with unsaved changes and disable save when nothing changed.
- Treat theme selection as a draft; publish it globally only after a successful save.
- Paint the drafted theme locally as a live preview, because an animated theme such as Living cannot be judged from a static swatch. Track the preview separately from the published theme so unsaved-change detection keeps comparing against what is saved, and drop the preview when the workspace unmounts, when the user discards changes, or once a save succeeds.
- Announce save success and failure accessibly.

## Validation

- Validate all drafts before uploading files.
- Require public church facts, all bilingual copy, one or more services, and complete service/gathering rows.
- Validate email, phone, service time, AM/PM, and stored length limits.
- Mark invalid controls, show a localized message, switch to the first affected tab, open its disclosures, and focus the problem.
- Keep address line 2 optional and allow it to be cleared intentionally.

## Appearance Consistency

- Add the same tab-level title and description used by the other tabs.
- Remove the duplicate logo heading.
- Use site settings colors for logo actions.
- Show published, pending, and reset status for the logo.

## Upload Failure Safety

- If the settings database save fails, the API deletes new site-image paths that were not referenced by the previous settings.
- Never delete a previously referenced image or an image after a successful database save.

## Responsive and Accessibility Rules

- The save bar remains compact and usable on narrow screens.
- Field errors use `aria-invalid` and linked descriptions.
- Global status uses `role="alert"` or polite live announcements.
- Existing tab drafts, page-copy coverage, and photo composition behavior remain intact.
