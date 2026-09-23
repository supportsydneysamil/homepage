# Site Copy Editor Refinement

## Goal

Make the Site copy tab complete and easy to scan without changing the existing content model or save behavior. Administrators should be able to edit every public-facing value in `SiteCopy`, understand where each value appears, and navigate the editor without a long undifferentiated form.

## Information Architecture

The editor uses two levels of disclosure:

1. Page accordions for Home, About, Worship, Contact, and Footer.
2. Collapsible section cards inside each page, ordered to match the public page.

Contact and Footer become separate page accordions because they represent different destinations and contain enough fields to scan independently. The first section of an opened page starts open; other sections start closed. Administrators may open multiple sections at once.

Each section separates fields by purpose:

- Primary copy: headings, introductions, descriptions, and body text.
- Supporting copy: kickers, labels, button text, empty states, and navigation labels.
- Accessibility copy: image alternative text.

Supporting and accessibility fields remain clearly visible within their section but have lower visual emphasis than primary copy.

## Complete Editing Coverage

Every localized value in `SiteCopy` is editable.

Home includes:

- Hero
- Quick information
- Church pillars
- Weekly highlights
- First visit
- Next steps
- Pastor feature

About includes the page header, values, and closing confession.

Worship includes the page header, page actions, service introduction, and location heading.

Contact includes the page header and contact-detail labels.

Footer includes the tagline, column headings, and navigation labels.

Structural values such as link destinations remain read-only. Where useful, their route is shown as contextual metadata on the related card.

## Components

`SiteCopyFields` remains the editor boundary and owns immutable updates to `SiteCopy`.

Small local presentation components provide the hierarchy:

- `PageAccordion`: page title, summary, and total localized field count.
- `CopySection`: collapsible section card with title, optional description, and field count.
- `FieldGroup`: labels primary, supporting, or accessibility fields where a section needs that distinction.
- Existing `BilingualField`: renders the Korean and English inputs.

Repeated values and links continue to use item cards. These cards show meaningful names when available and retain their route metadata.

## Responsive Behavior

Desktop layouts use two columns only for short, related fields. Long text spans the full section width.

Below the existing tablet breakpoint, every field and language pair becomes one column. Grid minimums must use a width-safe value so no input forces horizontal overflow on narrow screens.

## Accessibility

Each Korean and English control receives an accessible name containing both the field label and language, for example, “Hero headline, Korean.” Section toggles retain native `details` and `summary` semantics and gain visible keyboard focus styles.

Alternative-text fields include a short explanation that they describe the associated image for screen-reader users.

## Data and Saving

No API, schema, parser, or save-flow changes are required. Inputs update the existing page-level draft. Changes across every tab are still persisted only by the global save button.

No live preview, per-section save, reorder controls, rich text, or route editing is introduced.

## Verification

- TypeScript typecheck passes.
- Existing app and API tests pass.
- Static export build passes.
- Every localized leaf in `SiteCopy` has a corresponding editor control.
- Narrow layouts do not overflow horizontally.
- Input controls expose field-and-language accessible names.
