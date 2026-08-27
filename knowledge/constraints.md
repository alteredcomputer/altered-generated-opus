# Constraints and approvals

The authoritative list of what an agent is allowed to touch. Default is deny. Nothing is added here
without the owner approving it explicitly in the Cursor chat, with the date recorded.

**Org rename, 2026-08-27:** the GitHub org `usealtered` is now `alteredcomputer`. Every
`usealtered/...` reference in this file and in older decisions refers to the same repos under the
new org; GitHub redirects the old paths. This repo is `alteredcomputer/altered-generated-opus`.

## Approved operations

| Scope | Operation | Approved | Date |
| --- | --- | --- | --- |
| `usealtered/altered-generated-opus` | Full git write: branch, commit, push, merge to `main` | Yes | 2026-08-12 |
| Any third party | Read-only API calls and documentation fetches | Yes | 2026-08-12 |
| Public package registries | Install dependencies | Yes | 2026-08-12 |
| Handed-over credentials | One first wipe, where contents are clearly residual from the old `altered-generated` project. No porting, no migration. | Yes | 2026-08-12 |

## Explicitly denied until approved

- Vercel: creating or modifying projects, deployments, domains, or environment variables. A
  `VERCEL_TOKEN` is present in the environment; it is read-only by policy.
- GitHub: any write outside this repo. Includes `usealtered/altered` and
  `usealtered/altered-generated`, which are reference material only.
- Creating secrets, API keys, service accounts, or credentials of any kind.
- Provisioning infrastructure: databases, Redis, queues, buckets, domains, phone numbers.
- Any outbound message, post, DM, or email to a real recipient.
- Any payment or charge.
- Cursor Cloud Agents API writes: spawning agents, creating runs.

## The previous system

Resolved 2026-08-14. The owner has taken down the previous project's deployments and provisioned new
infrastructure, so its schedules are no longer firing.

## Deployment identifiers

Locked so no agent has to guess when calling the Vercel API.

| Field | Value |
| --- | --- |
| Project | `prj_bxIGAfZxeJt0ep5hwQyykPYMpbnV` (`generated`) |
| Team | `team_kaSUAXJCVtO2tEDVwnTFNDVN` (`alteredcomputer`) |
| Root directory | `apps/web` |
| Domain | `generated.altered.computer` |
| Webhook | `https://generated.altered.computer/api/webhooks/sendblue` |

**Pulling environment values** is approved and is a read. The Vercel REST API returns ciphertext for
encrypted variables even with `decrypt=true`, so use the CLI, which decrypts correctly:

```bash
cd apps/web
mkdir -p .vercel && printf '{"projectId":"prj_bxIGAfZxeJt0ep5hwQyykPYMpbnV","orgId":"team_kaSUAXJCVtO2tEDVwnTFNDVN"}' > .vercel/project.json
pnpm dlx vercel@latest env pull .env.local --environment=development --token="$READ_ONLY__VERCEL_TOKEN" --yes
```

The file must live in `apps/web`, not the repo root, because Next only loads env files from the
application directory. It is ignored by the root `.gitignore`. After pulling, verify no value looks
like a base64 envelope beginning `eyJ`, which would mean ciphertext was written instead of a value.

`APP_ENV` already has a `development` value in Vercel, so the pulled file is correctly marked as
development with no manual edit.

## Reference clones

Located 2026-08-14 with the broader GitHub token. Both are private and read-only.

- `usealtered/altered-no-code-1-week-gtm` - the notes repository. Roughly 2,000 Apple Notes exports
  under `sources/notes/`, plus Cursor chat and plan exports. This is where the **Liminal** thinking
  lives, along with the foundational reasoning behind ALTERED's primitives.
- `inducingchaos/liminal` - a small prior implementation of Liminal.

## Resource inventory

What this project actually has access to right now. Verified 2026-08-14.

| Resource | Status | Notes |
| --- | --- | --- |
| `READ_ONLY__GITHUB_TOKEN` | Present | Full read across the owner's repos. Read-only by policy and by name. |
| `READ_ONLY__VERCEL_TOKEN` | Present | Read-only by policy and by name. |
| `READ_ONLY__CURSOR_TOKEN` | Present | Read-only by policy and by name. |
| Everything in `.env.example` | **Provisioned by the owner, not yet reachable here** | Values live in the Vercel project. They reach this environment only once the owner adds them as Cloud Agent secrets, or once an agent is permitted to pull them. |

The owner has provisioned a new database, Redis, queue, and LLM key, and has taken down the previous
project's deployments. The iMessage number is carried over with a rolled signing secret and its
webhook repointed at this application.

Nothing that runs against a live service can be built or verified until the relevant credential is
provisioned by the owner. Pure logic, schema, and interface work can proceed without them, and
should be written so that a missing credential fails loudly at startup rather than at first use.

## Reference repositories

Read-only. Cloned on demand, never vendored into this repo.

- `usealtered/altered` - the hand-written product core. Closest thing to a source of truth for what
  the product is. Its conventions are a reference, not an inheritance.
- `usealtered/altered-generated` - the previous, lower-quality attempt at this project. Useful only
  as a record of intent and as a catalogue of mistakes. See `prior-art.md`.

Neither repo's contents are authoritative. Every claim taken from them must be re-confirmed with the
owner before it ships.
