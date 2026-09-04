# Plan 01 - Dashboard foundation

**Status:** waiting. **Blocker:** `RESEND_API_KEY` and `AUTH_EMAIL_FROM` in Vercel, then pulled
locally (see `constraints.md`). Also needs `OPERATOR_EMAILS` added to Vercel by the owner (a
comma-separated allowlist; one address for now).

**Depends on:** nothing in this folder. **Unblocks:** 03, 06, and the web review in 02.

## Outcome

The owner opens `generated.altered.computer/dashboard` on his phone, enters his email, types the
six-digit code he received, and lands on a home screen that shows: readiness of every capability,
the state of every kill switch, and the day's KPI numbers. He can add it to his home screen as a
PWA. Nobody else can get past the login, and an empty allowlist admits nobody.

## Locked inputs

- D006 mobile-first; D046 Better Auth with email codes via Resend; D050 one application; D054
  approvals happen on the dashboard; D056 the dashboard eventually holds lead flow and metrics,
  drafts and scheduled posts, the feature graph, and the kill switches; D058 our own database;
  D076 web-first; D009 settings over constants.
- Shared technical decisions in `README.md`.

## Scope

1. `packages/db`: Drizzle schema, Neon HTTP driver, migration tooling, a typed `Database` Effect
   service. First tables: Better Auth's own tables, `settings`, `operator_actions` (an append-only
   audit log of everything an operator does through the dashboard).
2. Better Auth server instance with the email OTP plugin and the Drizzle adapter, mounted at
   `/api/auth/[...all]`. Sign-in restricted to `OPERATOR_EMAILS`. Sessions are cookies, HTTP-only,
   secure, same-site lax.
3. Resend transport for the code email. Plain text, one line, no branding needed yet.
4. Dashboard route group `apps/web/src/app/(dashboard)/dashboard/...` with its own layout: shadcn
   on Tailwind v4, Berkeley Mono, system theme, bottom navigation on phones. Route-level guard:
   every server component and server action under the group calls one `requireOperator()` that
   redirects to login or throws. Not middleware alone; the check is at the data boundary.
5. Home screen: readiness (reuses `packages/core/src/readiness.ts`), kill switches (read-only
   display of `OUTBOUND_ENABLED` plus the per-integration switches from `settings`, toggleable by
   the operator with an audit row), and a KPI card that reads from the tables plan 02 creates or
   shows "not yet recorded" when they do not exist.
6. PWA: web manifest, icons, theme colour, `display: standalone`. No service worker beyond what is
   needed to install; offline is not a goal.
7. Tests: Vitest wired into `pnpm check` as `check:tests`. Tests for the allowlist (empty denies,
   case-insensitive match, whitespace), the settings reader (missing key is a typed error, never
   undefined), and the audit writer.

## Not in scope

Leads, drafts, truth editing, payments, posting. Those are plans 02 to 06 and render inside this
shell later.

## Design

- **Fail-closed allowlist.** `OPERATOR_EMAILS` is parsed at request time with Effect config into a
  non-empty array; parsing failure or emptiness is a hard error, and the login route returns 503
  with a generic message. Nothing about the allowlist reaches the client.
- **Settings.** `settings(key)` returns a typed value or fails with `SettingMissing`. Keys are
  declared in one module as a discriminated union with their value schema. The first keys:
  `outbound.imessage`, `outbound.payments`, `outbound.publishing`, `outbound.x` (all booleans,
  default off, and "default" here means a seed row written by the migration, not a fallback in
  code).
- **Audit.** `recordOperatorAction({ actor, action, subject, detail })` is called by every
  mutation. It is awaited and its failure fails the mutation. No fire-and-forget (prior-art A5).
- **Layout.** One layout for the group. Navigation items are declared as data so later plans add
  an entry rather than editing markup.
- **Theme.** Reuse the neutral ramp and accent variables from `globals.css` by mapping them onto
  shadcn's CSS variables in the dashboard layout, so there is one palette.

## Steps

1. Add `packages/db` with Drizzle, the Neon driver, `drizzle-kit`, a `Database` service that
   loads `config.database`, and the first migration. Commit.
2. Add Better Auth with email OTP and the Drizzle adapter; generate its schema into `packages/db`;
   mount the handler; implement the Resend sender behind an `EmailSender` service. Commit.
3. Add the allowlist config and `requireOperator()`. Tests for the empty and malformed cases.
   Commit.
4. Add Tailwind v4 and shadcn to `apps/web` scoped to the dashboard group; map the palette; add
   the layout, bottom navigation, and login screen. Verify at 390px. Commit.
5. Add `settings` and `operator_actions` tables, the settings module, the audit module, and their
   tests. Commit.
6. Build the home screen: readiness, kill switches, KPI card. Commit.
7. Add the PWA manifest and icons. Commit.
8. Wire `check:tests` into `pnpm check` and CI. Update `.env.example`, `turbo.json`
   `passThroughEnv`, and `packages/core/src/config.ts` for `OPERATOR_EMAILS`. Commit.
9. Reconcile the feature graph, run the security pass, update `state.md`, merge.

## Verification

- `pnpm check` and `pnpm build` pass.
- With `OPERATOR_EMAILS` unset, the login route returns 503 and no code is sent.
- With a non-allowlisted email, the response is identical to the allowlisted one (no enumeration),
  and no code is sent. Confirm by log line, not by UI.
- Login works end to end against the pulled development environment.
- Home screen renders on a 390px viewport with no horizontal scroll.

## Security pass specifics

- Auth routes are the only unauthenticated routes under the dashboard.
- Codes expire in ten minutes and are single-use (Better Auth defaults; confirm and record).
- Session cookie flags verified in the response headers.
- `OPERATOR_EMAILS` never appears in a client bundle or a log line.
- Kill switch toggles require an authenticated operator and write an audit row.

## Feature graph nodes

`data-layer` (root) with `data-layer-database`, `data-layer-settings`, `data-layer-audit`;
`dashboard` (root) with `dashboard-auth`, `dashboard-shell`, `dashboard-home`, `dashboard-pwa`;
`tooling-tests`. Descriptions must pass the junior-programmer test in `feature-graph.md`.

## Agent notes

Append-only, dated. The planning agent's notes:

- 2026-09-04: Better Auth's email OTP plugin and Drizzle adapter are the documented path; do not
  hand-roll code generation or session storage (prior-art A8). Verify current package versions on
  the registry before pinning; the catalogue in `pnpm-workspace.yaml` is where shared versions go.
- 2026-09-04: The public site must not gain Tailwind's preflight. Scope Tailwind's base layer to
  the dashboard group or disable preflight; check the landing page renders byte-identical after.
