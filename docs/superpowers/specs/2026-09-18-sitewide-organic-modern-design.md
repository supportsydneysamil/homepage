# Sitewide Organic Modern Design

## Goal

Extend the approved bright organic-modern homepage language across every public, authentication, profile, and settings page while preserving bilingual content, themes, authentication, APIs, and static export.

## Shared Visual System

- Use warm off-white, soft mint, deep teal, and restrained gold as the canonical church theme.
- Retain the existing theme choices, mapping each to the same component hierarchy with readable palette variations.
- Use large editorial headings, concise eyebrow labels, generous whitespace, organic radii, thin borders, and restrained shadows.
- Replace generic glass-card styling with clear surfaces and stronger information hierarchy.
- Use CSS or inline SVG for decoration; add no icon or animation dependency.

## Shared Layout

- Rebuild the header as a refined sticky navigation with clear active, language, and authentication controls.
- On small screens, use an accessible menu rather than a dense wrapped or horizontally scrolling list.
- Rebuild the footer with church identity, address/contact details, primary navigation, and a visit CTA.
- Add a reusable page hero and section primitives for consistent spacing and typography.
- Correct `Community Church` metadata to `Sydney Samil Church`.

## Page Treatments

- **About:** editorial story, vision, and mission composition using numbered pillars rather than three generic cards.
- **Worship:** prominent service-time layout, midweek details, visit CTA, and location panel.
- **Events:** modern event index cards with locale-aware dates; detail pages receive consistent hero, gallery, and video framing.
- **Sermons:** editorial sermon list with responsive video treatment and locale-aware metadata.
- **Resources:** clean downloadable-resource rows with clear external-link affordances and empty state.
- **Contact:** two-column contact introduction and form with accessible status messaging; preserve `/api/contact`.
- **Login:** branded, bilingual sign-in card with clear loading, bypass, and signed-in states.
- **Profile:** organic-modern account dashboard without changing Graph loading or photo-upload behavior.
- **Settings:** consistent admin page, theme cards, focus states, and responsive controls.

## Scroll and Motion

- Never allow unintended horizontal page scrolling.
- Preserve normal vertical document scrolling; do not use full-page scroll snapping.
- Use a very thin native scrollbar with a transparent thumb at rest.
- Add a passive document scroll listener that applies `is-scrolling` to `<html>` and removes it approximately 800ms after scrolling stops.
- While `is-scrolling` is present, show a subtle teal scrollbar thumb. Use `scrollbar-gutter: stable` where supported to avoid layout shift.
- Treat the scrollbar enhancement as progressive: unsupported browsers retain their native scrollbar.
- Add subtle section-entry and hover transitions without blocking reading or navigation.
- Disable nonessential motion for `prefers-reduced-motion: reduce`.
- Use modern CSS features such as `clamp()`, container queries, and `content-visibility` only with safe fallbacks.

## Functional and Visual Corrections

- Keep all page behaviors and data sources intact.
- Use the selected language for visible date formatting rather than browser-default locale.
- Provide useful empty states for empty events, sermons, and resources.
- Harden YouTube URL conversion for standard and short URLs without changing stored data.
- Add iframe titles and maintain responsive aspect ratios.
- Prevent long Korean text, email addresses, roles, and group names from overflowing.
- Ensure form status updates are announced and controls retain visible keyboard focus.
- Ensure failed external embeds leave a deliberate visual fallback rather than a blank region.
- Remove stale brand names, placeholder copy, contradictory CTAs, and purely decorative content that implies unverified facts.

## Accessibility and Responsive Behavior

- Maintain semantic heading order and landmarks.
- Meet readable color contrast in church, light, dark, modern-sky, and modern-sand themes.
- Support keyboard navigation and visible focus throughout.
- Keep targets comfortably sized on touch devices.
- Verify desktop, tablet, and 375px mobile layouts in Korean and English.
- Avoid fixed text heights that clip translations.

## Architecture

- Introduce small shared presentation components only where multiple pages use them: page hero, section heading, empty state, and external-link treatment.
- Keep page-specific content and data fetching in existing page files.
- Add one small scroll-activity hook/component mounted by `Layout`.
- Consolidate sitewide organic styles in the existing global stylesheet, scoped by shared classes and theme variables.
- Do not introduce a broad component library or new runtime dependency.

## Verification

- Add a static-export smoke check for all generated routes and stale branding.
- Add focused tests for locale-aware date formatting and YouTube URL conversion.
- Run TypeScript checking and production static build.
- Capture and inspect public pages at desktop, tablet, and mobile widths.
- Inspect login, profile, and settings states that are available locally without weakening authentication.
- Verify theme contrast, keyboard focus, scrolling, reduced motion, embedded media fallback, links, and forms.
