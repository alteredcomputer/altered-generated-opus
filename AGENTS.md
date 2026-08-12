# Agent operating contract

This repo is built and maintained entirely by AI agents in Cursor cloud sessions. The owner does not
touch git, pull requests, or code. Assume you are a fresh agent with no memory of prior turns.

## Read this first, every session

1. `knowledge/state.md` - where the project stands and what to do next.
2. `knowledge/decisions.md` - locked decisions. Treat as binding. Do not re-litigate without cause.
3. `knowledge/open-questions.md` - what is still unresolved. Never guess past an open question.
4. `knowledge/prior-art.md` - failure patterns from the previous attempt. Do not repeat them.

## Prime directives

- **No ambiguity, no assumptions.** If a decision is not in `knowledge/decisions.md`, it is not
  decided. Ask the owner in the Cursor chat. This covers stack, architecture, scope, feature depth,
  roadmap, offer, funnel, copy, and visual design. Minor local choices (a helper's name, a loop's
  shape) are yours.
- **Prevent, do not repair.** Anything the owner might dislike, that might look wrong, or that might
  produce bad output - stop and ask, with a recommendation attached.
- **Safety over progress.** When a guardrail and a task conflict, the guardrail wins and the task
  stops.
- **Blocked means stop.** On a blocking constraint (missing credential, missing resource, missing
  access), stop and ask. Continue only on genuinely independent work in the meantime.

## Guardrails

### External systems: default deny

No writes to any third-party API, service, or account unless that exact operation is listed in
`knowledge/constraints.md` as approved, or the owner approves it explicitly in chat.

This includes, and is not limited to: creating or modifying Vercel projects, deployments, domains,
or environment variables; creating or modifying GitHub resources outside this repo; creating
secrets, API keys, or credentials; provisioning databases, queues, or caches; posting to social
platforms; sending messages; charging money.

Reads are allowed. A `VERCEL_TOKEN` is present in the environment. It is not approved for writes.

### Two kinds of writes, two kinds of approval

- **Session writes** - actions you take while working. Default deny, as above.
- **Runtime writes** - actions the shipped system takes on its own (sending an iMessage, publishing
  a post, taking a payment). Each integration needs its own explicit approval before it is wired to
  a live credential, and each needs a kill switch that is off by default.

### Git

- Writes are allowed only inside `usealtered/altered-generated-opus`.
- Branch per logical change, named `cursor/<descriptive-name>-<suffix>`.
- Commit per logical change, with a real message. Never force push. Never amend pushed commits.
- Open a pull request for the record, then merge it yourself once checks pass. The owner never
  reviews or merges.

### Secrets

Never print, log, echo, or commit a secret value. Never create one. Read from the environment
indirectly. If a credential is missing, ask for it - do not invent a fallback that silently changes
behaviour.

## Communication

- **Cursor chat** is the only channel for development, code, architecture, and any decision that
  shapes the build.
- **iMessage** is for the owner's own use: notifications, small user-land questions and decisions,
  and voice notes that feed the knowledge base. It is never a development channel.
- Ask questions in **rounds**, ordered so that no answer can invalidate an earlier one. Give
  multiple choice options and a recommendation with reasoning for each. Ask in chat, never by
  committing a questionnaire file.
- The owner reads on a phone. Keep answers scannable: short lines, no wide tables, no walls of text.
- If you do not understand why the owner wants something, ask. Do not reverse-engineer intent.

## Quality bar

Code quality is a product feature here, not a nicety. A weak codebase weakens the product, the
marketing, and every future turn.

- **Minimal first.** Take the most straightforward solution that works. Add machinery only when a
  real edge forces it, and say so when you do.
- **Do not reinvent.** Use the library. Small helpers and domain logic are fine; re-implementing
  what a dependency already does is not, unless it was planned and approved.
- **Never silently alter user-visible content.** No truncation, no ellipsis clipping, no quiet
  rewriting of a message, a draft, or a record. If something is too long for a channel, split it or
  fail loudly.
- **Errors are typed, handled, and logged.** No empty catch blocks. No swallowed rejections. No
  fire-and-forget writes on paths that matter.
- **Observability from the start**, not bolted on. Every meaningful operation is traceable.
- **Config over constants.** Values that a human might want to change belong in the database or a
  settings store, not in source. Hard-code only what is genuinely structural.
- **Feature-separated, readable modules.** No god files. Group by feature.
- **Mobile-first** for every human surface: the dashboard, the landing page, iMessage output, and
  the chat updates you write.

## End of every turn

1. Quality pass: minimisation, refactor, error handling, logging, dead code.
2. Verification pass: types, lint, tests, build - whatever exists at the time.
3. Update `knowledge/state.md` so a fresh agent can resume with zero loss.
4. Record any decision the owner made this turn in `knowledge/decisions.md`.
5. Commit, push, open or update the pull request, merge when green.

Before merging a branch, do a whole-branch review pass as if you were a reviewer who did not write
it.

## Copy rules

- Hyphens only. No em dashes, anywhere - docs, code comments, chat, and all user-facing copy.
- No claim ships that is not traceable to a locked decision in `knowledge/decisions.md`.
