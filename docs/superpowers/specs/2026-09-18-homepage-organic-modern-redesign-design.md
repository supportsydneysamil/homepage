# Homepage Organic Modern Redesign

## Goal

Redesign the Sydney Samil Church homepage as a bright, modern, welcoming experience for first-time visitors. Use only church-owned photography and preserve the existing bilingual, theme, authentication, and static-export behavior.

## Visual Direction

- Use the approved **Bright Organic Modern** direction.
- Base palette: warm off-white, soft mint, deep teal, and restrained warm gold accents.
- Use generous whitespace, large Korean/English typography, soft organic shapes, rounded image frames, and subtle shadows.
- Avoid excessive glass effects, dark overlays, decorative blobs, emoji icons, and dense grids.
- Motion must be restrained, CSS-only, and disabled by `prefers-reduced-motion`.

## Photography

- Use `app/public/church-bg.png` as the primary hero image.
- Present it in a large independent frame beside the hero copy, not as a full-background image. This avoids text competing with the centered church sign.
- Use `app/public/pastor.jpg` only in the pastor section with a deliberate portrait crop.
- Remove the Unsplash hero image and the entry-photo placeholder.
- Do not introduce stock photography.

## Page Structure

1. **Split hero**
   - Left: church identity, concise welcome message, primary visit CTA, secondary directions CTA.
   - Right: framed church exterior image with organic accent shapes.
2. **Quick information strip**
   - Three cards: Sunday service times, first-visit information, and directions.
   - Remove unverified `20+ teams` and `50+ groups` statistics.
3. **This week**
   - Show up to three active items from `weekly.json`.
   - If no item is active, show a useful empty state linking to events, sermons, and resources instead of an empty grid.
4. **Church identity**
   - Reduce the current four feature cards to three concise pillars.
5. **Visit section**
   - Combine service expectations, children/language guidance, parking, and map into one clear two-column section.
   - Remove the “entry photo coming soon” placeholder.
6. **Pastor introduction**
   - Use a clean editorial split with the existing portrait and concise contact information.
7. **Next steps**
   - Replace the long visit, newcomer, matching, and prayer forms on the homepage with three compact CTA cards.
   - Link visitors to the existing contact page or focused anchors/pages; keep detailed data collection off the homepage.

## Responsive Behavior

- Desktop: asymmetric two-column hero and visit/pastor sections.
- Tablet: balanced stacked sections with image retained above or beside key copy where space allows.
- Mobile: single-column flow, horizontally comfortable padding, full-width CTAs, no clipped navigation or images.
- Ensure embedded map, cards, long Korean strings, language control, and authentication control do not overflow.

## Functional and Visual Quality Pass

- Preserve Korean/English switching across all new copy.
- Preserve all configured themes, but make the approved church theme the canonical polished presentation.
- Remove duplicate or contradictory calls to action.
- Use semantic headings, real links, visible keyboard focus, descriptive image alt text, and sufficient contrast.
- Avoid claims or content that cannot be verified from repository data.
- Ensure expired weekly content does not make the section appear broken.
- Confirm the homepage does not depend on third-party stock-image availability.
- Keep the existing contact backend untouched unless testing reveals a concrete integration defect.

## Implementation Boundaries

- Refactor the oversized homepage into small presentational components where that materially improves readability; do not create a broad design-system rewrite.
- Continue using existing CSS and theme variables; add homepage-specific variables where necessary.
- No new runtime dependency or animation library.
- Do not change unrelated pages beyond shared responsive/header fixes required to prevent visual breakage.

## Verification

- Run TypeScript checking and the production static build.
- Inspect the homepage at desktop, tablet, and mobile widths in Korean and English.
- Check the default church theme plus light and dark themes for readable fallbacks.
- Verify internal anchors, directions, contact links, weekly-item links, images, and empty state.
- Check keyboard focus and reduced-motion behavior.
- Confirm there are no horizontal scrollbars, image distortion, overlapping controls, or empty visual sections.
