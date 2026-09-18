# Role-Based Access for Resources, Sermons, and Events

## Goal

Add role-based access to the existing Azure Static Web Apps site so signed-in church members can view and download library and sermon files, editors can upload files and maintain events, and administrators can change site settings. Preserve the current Next.js static export, Entra ID tenant-only sign-in, bilingual content, and themes.

## Access Model

- Public visitors read home, about, worship, events, sermon videos, and contact.
- `member` reads the resource library, sermon attachments, and downloads files.
- `editor` has all `member` access plus uploads and event, sermon, and resource maintenance.
- `admin` has all `editor` access plus site settings.
- Entra Global Administrator is used only for one-time tenant setup (group creation, Graph admin consent, Storage and SQL configuration). It is never required for day-to-day content work.

## Identity and Roles

- Sign-in stays custom Entra ID, single tenant, with `User assignment required = Yes` on the enterprise application.
- Three Entra security groups are created manually in the Entra portal: `Samil-Members`, `Samil-Editors`, `Samil-Admins`.
- Group object IDs are stored as Functions app settings `SAMIL_GROUP_MEMBER_ID`, `SAMIL_GROUP_EDITOR_ID`, `SAMIL_GROUP_ADMIN_ID`. Match on object ID, never on display name.
- A SWA `rolesSource` Function (`/api/roles`) runs once per sign-in, reads the user's group membership through Microsoft Graph, and returns SWA roles.
- Roles are cumulative: Admins receive `["admin","editor","member"]`, Editors receive `["editor","member"]`, Members receive `["member"]`, and any other signed-in user receives `[]`.
- Graph access uses the existing app-only client credentials pattern already present in `api/`. Required application permission: `GroupMember.Read.All` or `Directory.Read.All`, with admin consent.
- `useGlobalAdmin` and its per-request `/api/profile/directory-roles` check are removed. Client code reads roles from `/.auth/me`.

## Route Protection

Configured in `app/staticwebapp.config.json`:

| Route | Allowed roles |
|---|---|
| `/`, `/about`, `/worship`, `/events/*`, `/sermons`, `/contact`, `/login` | anonymous |
| `/resources` | `member` |
| `/manage/*` | `editor` |
| `/settings` | `admin` |
| `/profile` | `authenticated` |

Unauthorized requests continue to redirect to `/login` through the existing 401 and 403 response overrides.

## API Surface

| API | Method | Role | Purpose |
|---|---|---|---|
| `/api/roles` | POST | SWA internal | rolesSource role resolution |
| `/api/events` | GET | anonymous | Public event list and detail data |
| `/api/events` | POST, PUT, DELETE | `editor` | Event maintenance |
| `/api/sermons` | GET | anonymous | Public sermon list with video URLs |
| `/api/sermons` | POST, PUT, DELETE | `editor` | Sermon maintenance |
| `/api/resources` | GET | `member` | Resource library listing |
| `/api/resources` | POST, DELETE | `editor` | Resource registration and removal |
| `/api/files/upload-url` | POST | `editor` | Issue short-lived upload SAS |
| `/api/files/download/{id}` | GET | `member` | Authorize, then redirect to short-lived read SAS |
| `/api/site-settings` | GET | anonymous | Current theme |
| `/api/site-settings` | PUT | `admin` | Update theme |
| `/api/contact` | POST | anonymous | Existing contact form |

The `auth` block gains `"rolesSource": "/api/roles"`, and `/api/roles` itself is excluded from the route rules so SWA can invoke it. The existing `/api/*` catch-all requiring `authenticated` stays last, since SWA applies the first matching route; every anonymous and role-scoped API above must be declared before it.

Route `allowedRoles` is the first defence. Every write Function independently decodes `x-ms-client-principal` and re-checks the required role, so a single route misconfiguration cannot expose uploads or deletions.

## Storage

**Azure Blob Storage**, private access only, no public container URLs:

- `resources/` — bulletins and small-group material
- `sermons/` — sermon attachments such as notes and slides
- `events/` — event images

Blob names are prefixed with a generated ID rather than the original filename to avoid collisions and path guessing. Uploads are direct browser-to-Blob using a SAS that expires in minutes and is scoped to a single blob with create permission only. Downloads never return a permanent URL; `/api/files/download/{id}` verifies the caller's role, then redirects to a read SAS valid for minutes.

**Azure SQL** reuses the database already used by `site-settings`:

- `dbo.Events` — slug, date, title, description, published flag, audit columns
- `dbo.Sermons` — date, title, speaker, video URL, published flag, audit columns
- `dbo.Resources` — title, blob path, content type, size, audit columns
- `dbo.EventImages` — event ID, blob path, ordering
- `dbo.SermonFiles` — sermon ID, blob path, content type

Each table records `CreatedBy`, `CreatedAt`, `UpdatedBy`, and `UpdatedAt` from the client principal so content changes are attributable. Tables are created with the same idempotent `ensureSchema` pattern the existing `site-settings` Function uses.

## Content Migration

`app/src/content/events.json`, `sermons.json`, and `resources.json` currently hold placeholder example.com URLs and are compiled into the static export. They are seeded into SQL once, then the pages switch to client-side fetches:

- Events and sermons fetch the anonymous GET endpoints on mount, so publishing no longer requires a rebuild.
- Resources fetch the `member` endpoint, and the page relies on SWA route protection for the unauthenticated case.
- Direct file URLs are no longer stored in the client bundle. This removes the current situation where any resource PDF URL is readable by anyone who knows the address.

## Editor Experience

A new `/manage` area, protected by the `editor` role, provides forms for creating and editing events, sermons, and resources, plus file upload with progress and delete confirmation. It reuses the existing `PageHero`, `EmptyState`, and global styles rather than introducing a component library. All labels are bilingual and follow the existing `useLanguage` pattern.

Navigation shows `/manage` only to editors and `/settings` only to admins. Hiding controls is a convenience; enforcement remains in the routes and Functions.

## Error Handling

- Missing or unresolvable roles produce 403 with a bilingual explanation rather than a redirect loop.
- Graph or SQL failures return 5xx with a short, non-sensitive detail string, matching the current Functions style.
- Upload SAS issuance validates content type and maximum size before returning a token.
- Client fetch failures render the existing empty-state and error-text treatments instead of blank sections.

## Verification

- Unit tests for role resolution from group IDs, including cumulative roles and the no-group case.
- Unit tests for the role guard used by write Functions, verifying that a `member` principal cannot upload or delete.
- Verify that `/resources` and `/manage` redirect to `/login` when signed out, and that `/settings` is blocked for a non-admin account.
- Verify that a download URL issued for one user expires and cannot be replayed after the SAS lifetime.
- Run TypeScript checking and the production static build, confirming the export still succeeds with client-side content fetching.
- Confirm no resource, sermon, or event file URL appears in the static export output.

## Out of Scope

- Self-service membership requests or approval workflows.
- Rich text editing, scheduled publishing, and content versioning.
- Migrating existing authentication, profile, photo, or contact Functions beyond the removal of the Global Administrator check.
