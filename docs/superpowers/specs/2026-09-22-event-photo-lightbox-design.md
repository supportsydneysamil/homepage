# Event Photo Lightbox

## Goal

On a public event detail page, keep the existing album-style thumbnail grid. Clicking a photo opens a lightbox of the uncropped original. From that overlay the visitor can move to the previous or next photo in the same event, then close and return to the page.

## Product Judgment

The gallery already works as a grid. The gap is inspection: thumbnails use `object-fit: cover`, so people cannot see the full frame. A same-page overlay is enough. A photo library, zoom, deep links, or a new route would add more surface than this need.

## Scope

In scope:

- Public event detail page only (`app/src/pages/events/detail.tsx`)
- Thumbnail grid unchanged in layout (two-column album)
- Lightbox overlay: original image, prev/next, close, counter
- Keyboard (`Escape`, `ArrowLeft`, `ArrowRight`)
- Horizontal swipe on touch devices
- Focus management for the dialog

Out of scope:

- Manage/admin event photo list
- New npm lightbox library
- Zoom, pinch-zoom, captions, download, share URL
- Wrapping from last photo to first
- Separate thumbnail vs original URLs (the download URL is already the original)
- API, blob, or upload changes

## User Experience

The event gallery remains a grid of cropped images. Each thumbnail is a button. Clicking photo *n* opens the lightbox at index *n*.

The lightbox:

- Darkens the page behind it
- Shows the current image with `object-fit: contain` so nothing is cropped
- Shows a close control
- Shows previous/next controls when there is more than one photo
- Shows a small counter, e.g. `3 / 12`
- Does not change the page URL

Close:

- Close control
- Click on the darkened backdrop
- `Escape`

Navigate:

- Previous/next controls
- `ArrowLeft` / `ArrowRight`
- Horizontal swipe of at least 40px, and only when the horizontal movement is larger than the vertical movement

At the first photo, previous does nothing. At the last photo, next does nothing. If there is only one photo, previous and next are hidden.

While the lightbox is open, the page behind it does not scroll.

## Architecture

Add one component, `EventGallery`, used only from the event detail page. It owns:

- The existing `.event-gallery` grid
- Lightbox open/closed state
- Current index into the already-filtered `visibleEventImages` list

Image URLs stay `/api/files/download/{id}`. No server work.

Extract a tiny pure helper (e.g. `stepEventGalleryIndex(index, delta, length)`) that clamps to `[0, length - 1]` and returns the same index when length is `0` or `1`. The lightbox and tests both use this helper.

Do not add a dialog library. Native overlay markup plus CSS is enough.

## Accessibility

- Overlay uses `role="dialog"` and `aria-modal="true"`
- Opening moves focus into the dialog (close control)
- Closing restores focus to the thumbnail that opened it
- `Tab` cycles only close, previous, and next while open
- Thumbnail accessible name includes the event title and position, e.g. event title plus `2 / 5`
- Lightbox image `alt` is the event title (same as today)

## Failure Handling

A broken image still leaves the overlay open; the slot can stay empty. An empty image list does not render the gallery (current behavior). Navigation never throws or wraps.

## Testing

Unit-test `stepEventGalleryIndex` for:

- Middle of the list moves by `±1`
- First index ignores `-1`
- Last index ignores `+1`
- Length `0` or `1` stays at `0`

Swipe gesture and visual layout are checked in the browser on the public event detail page, not with extra UI tests.

## Success Criteria

A visitor on a public event with several photos can open any thumbnail, see the uncropped original, move through the set with buttons, keyboard, and swipe, see which photo they are on, and close without leaving the event page.
