# Newcomer Registration

## Goal

A first-time visitor can register as a newcomer from the homepage and from the applications list. The questions and the answers stay in a church-owned Microsoft Form. The website only publishes the link and makes that link easy to find.

## Product Judgment

Newcomer registration is ongoing pastoral care, not a seasonal signup. The site already publishes Microsoft Forms through the applications catalog. Reusing that catalog keeps one link, leaves personal answers in Microsoft 365 with the pastoral owner, and avoids a second database of names, addresses, and prayer requests.

The applications list alone is the wrong front door. A newcomer will not look under Resources for an account request or a retreat signup. The home “next step” section leads with this registration when it is open. The visit, community, and prayer cards stay behind it.

Follow-up status (new, contacted, connected) lives in the Form’s response sheet. The website does not store submissions and does not show a status queue.

## Scope

In scope:

- Application category `welcome` (Korean label 새가족, English label Welcome)
- Optional per-application button label
- Home next-step card that appears only for an open, public welcome application
- The same application remains available in the home “open now” highlights and in the resources applications list
- Button label rules below, shared by those three surfaces

Out of scope:

- Creating or embedding the Microsoft Form
- Storing answers, sending registration email, or tracking contacted / connected on the website
- A new public route or a new admin page
- Changing the three existing next-step cards (visit, community, prayer)
- Changing the default category or visibility of a newly created application
- Seeding a form URL

The church creates the Form in its own tenant. Name and one contact method are required. Attendance, faith, how they heard of the church, address, family, small group, and prayer are optional. An editor then publishes one application as category Welcome, visibility Everyone, no closing date, and highlighted on the home page. The Form owner records follow-up in the response sheet.

## Visitor Experience

When an open public welcome application exists, the home next-step section shows it as the first card, numbered 01. The existing three cards follow as 02, 03, and 04.

That card uses the application title and description as written. Those fields are not translated by the language toggle. If the description is empty, the card uses “부담 없이 알려 주세요.” in Korean and “Share only what you would like us to know.” in English.

The card button opens `formUrl` in a new tab with `rel="noopener noreferrer"`.

The card is absent when no application matches all of these:

- category `welcome`
- visibility `public`
- status open (published, opening date today or earlier or blank, closing date today or later or blank)

Draft, member-only, scheduled, and closed welcome applications do not take this slot, including when the viewer is an editor or a signed-in member. If several applications match, use the first in the existing applications order: highlighted on the home page first, then newest created.

The resources applications list and the home “open now” section keep their current rules. A welcome application appears there when those rules already include it. Their button uses the same label rule as the next-step card.

## Button Label

Each application may store an optional action label, at most 80 characters after trimming. An empty label is stored as empty.

Displayed label:

- A non-empty action label is shown as typed, in both languages
- An empty label on a welcome application is 등록하기 in Korean and Register in English
- An empty label on any other category is 신청하기 in Korean and Apply in English

## Data And API

Add `ActionLabel NVARCHAR(80) NULL` to `dbo.Applications` when the column is missing. Category values already fit in the existing column, so `welcome` needs no schema change.

The applications API accepts category `welcome` and an optional `actionLabel`. It rejects a label longer than 80 characters. It still rejects any form URL that is not an https link on `forms.office.com` or `forms.microsoft.com`. Unknown categories still fall back to `other`, so `welcome` must be in the allowed list rather than coerced.

The public response includes `actionLabel` as a string, empty when the column is null.

New applications in the editor still default to category discipleship, visibility member, published, and not highlighted. The action label field starts empty. The editor chooses Welcome and Everyone for the newcomer card.

## Failure Handling

If the home applications request fails, the welcome card is omitted and the rest of the homepage still renders. A closed or member-only welcome link never replaces the visit card. An invalid form URL or an over-long label is rejected on save. A failed update leaves the stored application unchanged, and a failed create stores nothing.

## Testing

Unit-test the welcome selection and the label rule:

- Open, public welcome application is selected
- A highlighted open welcome application is chosen ahead of an older open welcome application that is not highlighted
- Draft, member-only, scheduled, and closed welcome applications are skipped
- Empty welcome label is 등록하기 / Register
- Empty label on another category is 신청하기 / Apply
- A custom label is shown unchanged

API validation accepts a welcome application with an action label, rejects a label over 80 characters, and still rejects a non-Microsoft Forms URL.

Parser coverage keeps `actionLabel` and still drops a non-form address.

Browser check: with one open public welcome application highlighted, the home next-step card, the home highlights, and the applications list open the same form. With that application unpublished, the extra home card is gone and the three original next steps remain.

## Success Criteria

A visitor who has no church account can open newcomer registration from the first home next-step card and from the applications list, land in the church Microsoft Form, and leave no personal answers in the website database. When that registration is not publicly open, the homepage next steps look as they do today.
