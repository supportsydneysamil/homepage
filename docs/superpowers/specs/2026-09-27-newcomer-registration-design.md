# Newcomer Registration

한국어: [새신자 등록](./2026-09-27-newcomer-registration-design.ko.md)

## Goal

A first-time visitor can open newcomer registration from one clear band on the homepage. The questions and the answers stay in a church-owned Microsoft Form. The website stores only the form link and the band copy, and shows the band only when an admin turns it on.

## Product Judgment

Newcomer registration is ongoing pastoral care, and the church has exactly one newcomer form. Treating it as one more online application would need extra rules for a single item: a special category, what happens when two exist, no closing date, a different button label, and exclusion from the home “open now” cards. The band copy would also be edited in site settings while the link lived in the applications tab.

So registration is a standalone homepage band managed in one place: Site settings → Copy → Home → Newcomer registration. The on/off switch, the Microsoft Forms link, and the Korean and English copy live together. The online applications feature does not change.

Personal answers stay in Microsoft 365 with the pastoral owner. Follow-up status (new, contacted, connected) lives in the Form’s response sheet. The website does not store submissions and does not show a status queue.

## Scope

In scope:

- A `home.welcome` section in site copy: on/off, form link, kicker, title, intro, button label
- A newcomer band on the homepage, directly above “Your next step”
- A “Newcomer registration” section in the home copy editor, placed right before “Your next step”
- Client and server validation of the form link

Out of scope:

- Creating or embedding the Microsoft Form
- Storing answers, sending registration email, or tracking contacted / connected on the website
- Any change to online applications, the resources applications list, or the home “open now” section
- A new public route or a new admin page
- Changing the three next-step cards (visit, community, prayer)

The church creates the Form in its own tenant. Name and one contact method are required. Attendance, faith, how they heard of the church, address, family, small group, and prayer are optional. An admin pastes the link, turns the band on, and saves. The Form owner records follow-up in the response sheet.

If the church also wants newcomer registration in the resources applications list, an editor can add an ordinary application with the same link. That application follows the existing application rules and gets no special treatment.

## Visitor Experience

When the band is on and the link is a valid Microsoft Forms address, the homepage shows one full-width band directly above “Your next step”, after the first-visit section. The three next-step cards stay as they are, numbered 01 to 03.

The band shows the kicker, title, and intro on the left and one primary button on the right. On narrow screens the button moves below the text. Every string follows the language toggle.

The button opens the form link in a new tab with `rel="noopener noreferrer"`.

The band is absent when it is off, when the link is empty, or when the link is not a valid Microsoft Forms address. The rest of the homepage renders the same either way.

The band uses the homepage’s organic style: mint-to-white background, a soft gold glow, the existing `home-kicker` and `home-button--primary`, and the same rounded corners as other home sections. It needs light and dark theme variants like the other home sections.

## Site Copy

Add to `SiteCopy['home']`:

- `welcome.enabled`: boolean, default `false`
- `welcome.formUrl`: string, default empty
- `welcome.kicker`: 새가족 / New here
- `welcome.title`: 처음 오셨나요? 반갑습니다 / First time here? Welcome
- `welcome.intro`: 이름과 연락처만 남겨 주시면 담당자가 편하게 연락드립니다. 나머지는 알려 주셔도 좋고, 넘어가셔도 괜찮습니다. / Leave your name and a way to reach you, and we will get in touch. Everything else is optional.
- `welcome.buttonLabel`: 새가족 등록하기 / Register

`parseSiteCopy` treats `enabled` as on only when it is exactly `true`. It trims `formUrl` and keeps it only when it is an https link on `forms.office.com` or `forms.microsoft.com`, at most 500 characters. Otherwise `formUrl` becomes empty, so the band stays hidden. Missing copy falls back to the defaults above.

## Settings Editor

Site settings is already admin only, so only admins can change the band.

The “Newcomer registration” section has two groups:

- Connection: show on home (on / off) and the Microsoft Forms link
- Copy: kicker, title, intro, and button label, each with Korean and English

The four copy fields use the existing bilingual field rules: both languages required, 400 characters at most. When the band is on, an empty link or a link that is not a valid Microsoft Forms address is a copy-tab validation error, and save is blocked with the message “Microsoft Forms 주소를 입력해 주세요.” / “Enter a Microsoft Forms link.” When the band is off, the link may be empty; a non-empty invalid link is still an error.

The existing unsaved-changes marker, save bar, and discard behavior apply unchanged.

## Server

`PUT /api/site-settings` rejects the save with status 400 when `siteCopy.home.welcome.formUrl` is non-empty and not an https Microsoft Forms link. It reuses `isMicrosoftFormUrl` from `api/shared/applications.js`. No database schema change is needed: site copy is already stored as JSON.

## Failure Handling

If site settings fail to load, the homepage uses default copy, where the band is off. An invalid stored link hides the band instead of rendering a broken button. A rejected save leaves the stored settings unchanged.

## Testing

Unit tests:

- `parseSiteCopy` defaults the band to off with an empty link
- `parseSiteCopy` keeps a valid Forms link and drops a non-Forms or non-https link
- `enabled` is on only for boolean `true`
- The band renders only when on and the link is valid
- Settings validation flags an empty or invalid link when on, allows an empty link when off, and flags a non-empty invalid link when off
- The site-settings API rejects a non-Forms link and accepts a valid one

Browser check at desktop and mobile widths, in Korean and English, in the church, light, and dark themes: turning the band on shows it above “Your next step” and opens the form in a new tab; turning it off removes it and leaves the three next-step cards unchanged.

## Success Criteria

A visitor with no church account sees one newcomer band on the homepage, in the language they chose, and lands in the church Microsoft Form in one click. No personal answers reach the website database. An admin manages the band from one place, and turning it off restores the current homepage.
