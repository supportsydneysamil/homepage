# Event Photo Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the public event detail page, keep the album thumbnail grid and let a visitor open the uncropped original in a lightbox, then move previous/next with buttons, keyboard, and swipe.

**Architecture:** Reuse the existing `visibleEventImages` URLs. Add `stepEventGalleryIndex` and `eventGallerySwipeDelta` in `app/src/lib/events.ts`. A new `EventGallery` component owns the grid, lightbox index, keyboard, focus trap, swipe, and scroll lock. Wire it only from `app/src/pages/events/detail.tsx`. No API, admin, or npm library changes.

**Tech Stack:** Next.js Pages Router, React 18, TypeScript 5, existing `globals.css`, `node:test` via `tsx --test src/lib/*.test.ts`.

## Global Constraints

- Public event detail page only; do not change manage/admin photo UI.
- No new runtime dependency or lightbox library.
- No zoom, pinch-zoom, captions, download, share URL, or wrapping from last photo to first.
- Same `/api/files/download/{id}` URLs for thumbnails and lightbox (no separate thumbnail assets).
- Thumbnail grid layout stays two columns (one column under 760px).
- Lightbox image uses `object-fit: contain`.
- Previous does nothing at index `0`; next does nothing at the last index.
- Single-photo events hide previous and next.
- Swipe: at least 40px, and only when `|dx| > |dy|`.
- Korean/English chrome labels; image `alt` remains the event title.
- Static export, routing, and upload APIs stay intact.

## File map

- `app/src/lib/events.ts` — clamp index helper and swipe delta helper.
- `app/src/lib/events.test.ts` — unit tests for those helpers.
- `app/src/components/EventGallery.tsx` — thumbnail grid plus lightbox overlay.
- `app/src/pages/events/detail.tsx` — render `EventGallery` instead of raw `<img>` list.
- `app/src/styles/globals.css` — thumbnail button and lightbox styles.

---

### Task 1: Gallery index and swipe helpers

**Files:**
- Modify: `app/src/lib/events.ts`
- Modify: `app/src/lib/events.test.ts`

**Interfaces:**
- Consumes: none beyond existing `events.ts`.
- Produces:
  - `stepEventGalleryIndex(index: number, delta: number, length: number): number`
  - `eventGallerySwipeDelta(dx: number, dy: number, threshold?: number): number` — returns `-1`, `0`, or `1`. Default `threshold` is `40`. Swipe left (`dx` negative and large enough) returns `1` (next). Swipe right returns `-1` (previous).

- [ ] **Step 1: Write the failing tests**

Append to `app/src/lib/events.test.ts` and add the two names to the existing import from `./events`:

```ts
test('steps an event gallery index and stops at the ends', () => {
  assert.equal(stepEventGalleryIndex(1, 1, 3), 2);
  assert.equal(stepEventGalleryIndex(1, -1, 3), 0);
  assert.equal(stepEventGalleryIndex(0, -1, 3), 0);
  assert.equal(stepEventGalleryIndex(2, 1, 3), 2);
  assert.equal(stepEventGalleryIndex(0, 1, 1), 0);
  assert.equal(stepEventGalleryIndex(0, -1, 1), 0);
  assert.equal(stepEventGalleryIndex(4, 1, 0), 0);
});

test('reads a horizontal swipe as a gallery step', () => {
  assert.equal(eventGallerySwipeDelta(-50, 5), 1);
  assert.equal(eventGallerySwipeDelta(50, 5), -1);
  assert.equal(eventGallerySwipeDelta(-20, 0), 0);
  assert.equal(eventGallerySwipeDelta(-80, 90), 0);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd app && npx tsx --test src/lib/events.test.ts`

Expected: FAIL with `stepEventGalleryIndex` / `eventGallerySwipeDelta` not exported.

- [ ] **Step 3: Implement the helpers**

Append to `app/src/lib/events.ts`:

```ts
export const stepEventGalleryIndex = (index: number, delta: number, length: number) => {
  if (length <= 0) return 0;
  const next = index + delta;
  if (next < 0) return 0;
  if (next >= length) return length - 1;
  return next;
};

export const eventGallerySwipeDelta = (dx: number, dy: number, threshold = 40) => {
  if (Math.abs(dx) < threshold) return 0;
  if (Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
};
```

- [ ] **Step 4: Re-run the tests**

Run: `cd app && npx tsx --test src/lib/events.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/events.ts app/src/lib/events.test.ts
git commit -m "$(cat <<'EOF'
Add clamped event gallery index and swipe helpers.

EOF
)"
```

---

### Task 2: EventGallery component

**Files:**
- Create: `app/src/components/EventGallery.tsx`

**Interfaces:**
- Consumes: `stepEventGalleryIndex`, `eventGallerySwipeDelta` from `../lib/events`.
- Produces default export:

```ts
type EventGalleryProps = {
  images: string[];
  alt: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
};
```

If `images.length === 0`, render `null`.

- [ ] **Step 1: Add `app/src/components/EventGallery.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { eventGallerySwipeDelta, stepEventGalleryIndex } from '../lib/events';

type EventGalleryProps = {
  images: string[];
  alt: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
};

const EventGallery = ({
  images,
  alt,
  closeLabel,
  previousLabel,
  nextLabel,
}: EventGalleryProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const length = images.length;
  const showStep = length > 1;

  useEffect(() => {
    if (openIndex === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

  if (!length) return null;

  const close = () => {
    const index = openIndex;
    setOpenIndex(null);
    if (index !== null) thumbRefs.current[index]?.focus();
  };

  const step = (delta: number) => {
    setOpenIndex((current) =>
      current === null ? current : stepEventGalleryIndex(current, delta, length)
    );
  };

  const focusables = () =>
    [closeRef.current, previousRef.current, nextRef.current].filter(
      (node): node is HTMLButtonElement => Boolean(node)
    );

  return (
    <>
      <section className="event-gallery">
        {images.map((image, index) => (
          <button
            type="button"
            className="event-gallery__thumb"
            key={image}
            ref={(node) => {
              thumbRefs.current[index] = node;
            }}
            onClick={() => setOpenIndex(index)}
            aria-label={`${alt} ${index + 1} / ${length}`}
          >
            <img src={image} alt="" />
          </button>
        ))}
      </section>

      {openIndex !== null ? (
        <div
          className="event-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              step(-1);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              step(1);
            }
            if (event.key !== 'Tab') return;
            const nodes = focusables();
            if (!nodes.length) return;
            event.preventDefault();
            const current = nodes.indexOf(document.activeElement as HTMLButtonElement);
            const offset = event.shiftKey ? -1 : 1;
            const next = (Math.max(current, 0) + offset + nodes.length) % nodes.length;
            nodes[next].focus();
          }}
        >
          <div
            className="event-lightbox__frame"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              const point = event.changedTouches[0];
              touchStart.current = { x: point.clientX, y: point.clientY };
            }}
            onTouchEnd={(event) => {
              if (!touchStart.current) return;
              const point = event.changedTouches[0];
              const delta = eventGallerySwipeDelta(
                point.clientX - touchStart.current.x,
                point.clientY - touchStart.current.y
              );
              touchStart.current = null;
              if (delta) step(delta);
            }}
          >
            <button
              ref={closeRef}
              type="button"
              className="event-lightbox__close"
              onClick={close}
            >
              {closeLabel}
            </button>
            {showStep ? (
              <button
                ref={previousRef}
                type="button"
                className="event-lightbox__nav event-lightbox__nav--prev"
                onClick={() => step(-1)}
              >
                {previousLabel}
              </button>
            ) : null}
            <img
              className="event-lightbox__image"
              src={images[openIndex]}
              alt={alt}
            />
            {showStep ? (
              <button
                ref={nextRef}
                type="button"
                className="event-lightbox__nav event-lightbox__nav--next"
                onClick={() => step(1)}
              >
                {nextLabel}
              </button>
            ) : null}
            <p className="event-lightbox__counter">
              {openIndex + 1} / {length}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default EventGallery;
```

Thumbnail `<img alt="">` is decorative because the button `aria-label` already names the photo. The lightbox `<img>` keeps `alt={alt}` (event title).

- [ ] **Step 2: Typecheck the new file**

Run: `cd app && npx tsc --noEmit --pretty false`

Expected: PASS (or only pre-existing errors unrelated to `EventGallery`). If `EventGallery` has type errors, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/EventGallery.tsx
git commit -m "$(cat <<'EOF'
Add event photo lightbox gallery component.

EOF
)"
```

---

### Task 3: Page wiring and lightbox CSS

**Files:**
- Modify: `app/src/pages/events/detail.tsx`
- Modify: `app/src/styles/globals.css` (`.event-gallery` block around lines 3293–3305)

**Interfaces:**
- Consumes: `EventGallery` default export with `images`, `alt`, `closeLabel`, `previousLabel`, `nextLabel`.
- Produces: public event detail page opens the lightbox from thumbnails.

- [ ] **Step 1: Replace the raw image grid in `app/src/pages/events/detail.tsx`**

Add:

```ts
import EventGallery from '../../components/EventGallery';
```

Replace:

```tsx
      {images.length ? (
        <section className="event-gallery">
          {images.map((image) => (
            <img src={image} alt={event.title} key={image} />
          ))}
        </section>
      ) : null}
```

with:

```tsx
      {images.length ? (
        <EventGallery
          images={images}
          alt={event.title}
          closeLabel={isKo ? '닫기' : 'Close'}
          previousLabel={isKo ? '이전 사진' : 'Previous photo'}
          nextLabel={isKo ? '다음 사진' : 'Next photo'}
        />
      ) : null}
```

Do not change loading, empty, YouTube, or header markup.

- [ ] **Step 2: Restyle thumbnails and add lightbox CSS**

Keep `.event-gallery` grid rules. Change `.event-gallery img` so it still fills the cell when nested in a button. Insert immediately after the existing `.event-gallery img` block:

Replace the current:

```css
.event-gallery img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 1.4rem;
  object-fit: cover;
}
```

with:

```css
.event-gallery__thumb {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 1.4rem;
}

.event-gallery__thumb:focus-visible {
  outline: 2px solid var(--site-ink);
  outline-offset: 3px;
}

.event-gallery img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 1.4rem;
  object-fit: cover;
}

.event-lightbox {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(12, 10, 8, 0.88);
}

.event-lightbox__frame {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  width: min(100%, 96vw);
  max-height: 92vh;
}

.event-lightbox__image {
  display: block;
  max-width: 100%;
  max-height: 78vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.8rem;
}

.event-lightbox__close,
.event-lightbox__nav {
  border: 0;
  border-radius: 999px;
  background: var(--site-surface);
  color: var(--site-ink);
  cursor: pointer;
  padding: 0.45rem 0.9rem;
}

.event-lightbox__close:focus-visible,
.event-lightbox__nav:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.event-lightbox__counter {
  margin: 0;
  color: #fff;
  font-size: 0.95rem;
}
```

Leave the existing `@media (max-width: 760px)` rule that sets `.event-gallery { grid-template-columns: 1fr; }` unchanged.

- [ ] **Step 3: Typecheck**

Run: `cd app && npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Run lib tests**

Run: `cd app && npm run test:lib`

Expected: PASS, including the Task 1 gallery tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/events/detail.tsx app/src/styles/globals.css
git commit -m "$(cat <<'EOF'
Open event originals in a same-page photo lightbox.

EOF
)"
```

---

### Task 4: Browser check

**Files:** none (verification only).

**Interfaces:**
- Consumes: a published event with at least two photos on `/events/detail?slug=...`.
- Produces: confirmed lightbox behavior, or a follow-up fix if something fails.

- [ ] **Step 1: Open a multi-photo event**

Start the app if it is not running (`cd app && npm run dev`). Open a public event that has two or more images.

- [ ] **Step 2: Exercise the lightbox**

Confirm:

- The album grid still looks like the current two-column (or one-column on narrow) crop.
- Clicking a thumbnail opens that photo uncropped (`contain`, not cropped to 4:3).
- Previous/next buttons move through the set and stop at the ends (no wrap).
- `←` / `→` move; `Esc` closes.
- Backdrop click and the close control close the lightbox.
- Counter shows `n / total`.
- On a narrow viewport, a horizontal swipe of 40px+ changes photo; a mostly vertical swipe does not.
- One-photo events (if available) hide previous/next.
- Focus returns to the thumbnail after close.
- Page behind the overlay does not scroll while open.

If any of these fail, fix `EventGallery.tsx` or the CSS in this same task, then re-check. Do not expand scope (no zoom, no admin gallery, no new routes).

- [ ] **Step 3: Commit only if a fix was required**

If verification required a code change:

```bash
git add app/src/components/EventGallery.tsx app/src/styles/globals.css
git commit -m "$(cat <<'EOF'
Fix event lightbox behavior found in browser check.

EOF
)"
```

If verification passed with no code change, skip the commit.
