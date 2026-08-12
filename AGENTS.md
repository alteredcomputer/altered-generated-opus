# Agent operating contract

This repo is built and maintained entirely by AI agents in Cursor cloud sessions. The owner does not
touch git, pull requests, or code. Assume you are a fresh agent with no memory of prior turns.

## Read this first, every session

1. `knowledge/state.md` - where the project stands and what to do next.
2. `knowledge/decisions.md` - locked decisions. Binding. Do not re-litigate without cause.
3. `knowledge/open-questions.md` - what is unresolved. Never guess past an open question.
4. `knowledge/feature-graph.md` - the contract you build against and update every turn.
5. `knowledge/prior-art.md` - failure patterns from the previous attempt. Do not repeat them.

## The hard wall

The core product lives in `usealtered/altered` and is hand-written by the owner, line by line, on
purpose. It is infrastructure that other people will build on top of, and its primitives, data
models, and API surface must be his. **No agent writes core product code, ever.**

This repo owns everything else: go-to-market, content, leads, sales, operator surfaces, docs, and
the landing page. Anything generated here is disclosed as generated.

The wall is hard in both directions. This repo does not import from the core product's source, and
does not write to its database. The only sanctioned future seams are published packages the owner
chooses to install, and read-only access to the core product's data once it is live.

## Prime directives

- **No ambiguity, no assumptions.** If a decision is not in `knowledge/decisions.md`, it is not
  decided. Ask in the Cursor chat. This covers scope, feature depth, roadmap, offer, funnel, copy,
  and visual design. Code structure, composition, and style are the agent's own call, subject to the
  quality bar below.
- **Never ask a question in a file.** The owner reads on a phone. Questions go in the chat, in
  rounds of six to eight, ordered so no answer invalidates an earlier one, each with options and a
  recommendation. Committing a document and asking him to review it does not count as asking.
- **Prevent, do not repair.** Anything he might dislike, that might look wrong, or that might
  produce bad output: stop and ask, with a recommendation attached.
- **Blocked means stop.** On a blocking constraint, stop and ask. Continue only on genuinely
  independent work.

## Guardrails

### External systems: default deny

No writes to any third-party API, service, or account unless the exact operation appears in
`knowledge/constraints.md` as approved, or the owner approves it in chat.

This includes creating or modifying Vercel projects, deployments, domains, or environment variables;
GitHub writes outside this repo; creating secrets or credentials; provisioning databases, queues, or
caches; posting to social platforms; sending messages; and charging money.

Reads are allowed.

### Two kinds of writes

- **Session writes** - what you do while working. Default deny.
- **Runtime writes** - what the shipped system does on its own: sending an iMessage, publishing a
  post, taking a payment. Each integration needs its own approval before it touches a live
  credential, and a kill switch that defaults to off.

### Git

- Writes only inside `usealtered/altered-generated-opus`.
- **Branch per logical change**, named `cursor/<descriptive-name>-<suffix>`. The owner wants the
  branch trail for visibility.
- Commit per logical change with a real message. Never force push. Never amend a pushed commit.
- **Merge to `main` yourself with plain git.** Do not use the pull request tooling; it asks the
  owner for approval, which defeats the point. `git checkout main && git merge --no-ff <branch> &&
  git push origin main`.

### Secrets

Never print, log, echo, or commit a secret value. Never create one. Read from the environment
indirectly. A missing credential is a loud startup failure, never a silent fallback.

## Communication

- **Cursor chat** is the only channel for development, code, and architecture.
- **iMessage** is the owner's assistant and top-level operator, not a development channel. See D016.
- Keep chat output scannable on a phone: short lines, no wide tables, no walls of text.
- If you do not understand why he wants something, ask. Do not reverse-engineer intent.

## Quality bar

Code quality is a product feature here. A weak codebase weakens the product, the marketing, and
every future turn.

- **Minimal first.** Simplest thing that works. Add machinery only when a real edge forces it, and
  say so when you do.
- **Do not reinvent.** Use the library as designed. See the third-party doctrine below.
- **Never silently alter content a human or a model will read.** No truncation, no ellipsis
  clipping, no quiet rewriting. Too long for a channel means split it or fail loudly.
- **Errors are typed, handled, and logged.** No empty catch. No swallowed rejection. No
  fire-and-forget write on a path that matters.
- **Absence of configuration is a hard failure, never a grant.** No fail-open defaults, ever.
- **Observability from the start.** Every meaningful operation traceable.
- **Config over constants.** Anything a human might want to change lives in the settings store, not
  in source.
- **Feature-separated modules.** No god files.
- **Mobile-first** on every human surface.

### Third-party doctrine

When a third-party library does not behave as needed, the order of attempts is fixed:

1. Use the library as documented, with its own configuration options.
2. Search its source and issues for the intended approach.
3. Compose around it without modifying it.
4. Only if the problem critically blocks revenue or workflow, consider a patch or workaround, and
   only after saying so in chat and getting agreement.

Avoidance is a legitimate first answer. If something is not time-critical, route around it rather
than building machinery to defeat it. The previous attempt burned roughly fifteen commits fighting
iMessage concurrency and ended up deleting most of what it built.

## Security pass

Run this at the end of every turn that touched code. Check each item explicitly and say so; a silent
pass is not a pass.

1. **Authentication and authorisation.** Every route, action, and tool has an explicit auth check.
   No route is protected only by being unguessable. No secret in a query string.
2. **Fail-closed.** Every check denies when its configuration is missing, empty, or malformed.
   Re-read every allowlist, signature check, and role check for the empty case.
3. **Admin and operator surfaces.** Every operator tool, dashboard route, and privileged agent tool
   is gated away from the public and verified by identity, not by phone number string alone.
4. **Data access.** No query can return another party's rows. Every lead-scoped and user-scoped read
   is filtered by owner at the query, not in application code after the fact.
5. **Webhooks.** Signature verified, replay considered, and rejected outright when keys are absent.
6. **Environment.** No secret reaches a client bundle, a log line, a commit, or an error message.
7. **Injection.** Untrusted input into prompts, SQL, shell, or HTML is parameterised or escaped.
   Consider what a hostile inbound message could make an agent do.
8. **Outbound.** No live external write is reachable without its kill switch on and its approval
   recorded.

## Feature graph

`knowledge/feature-graph.md` defines a maintained, feature-level mirror of everything in this repo.
It is the owner's primary way of understanding the codebase without reading code, and it is your
contract.

**Every turn, both ends:**

- **Before building:** add or update the nodes for what you are about to build, marked as planned or
  in progress. Build bottom-up against that contract.
- **After building:** reconcile the graph with what actually exists. Development uncovers
  discrepancies, so this reconciliation pass is mandatory, not optional. Run the graph check and fix
  every drift before merging.

A change is not done until the graph reflects it.

## End of every turn

1. Quality pass: minimisation, refactor, error handling, logging, dead code.
2. Security pass, per the checklist above.
3. Feature graph reconciliation.
4. Verification pass: types, lint, tests, build.
5. Update `knowledge/state.md` so a fresh agent resumes with zero loss.
6. Record any decision the owner made this turn in `knowledge/decisions.md`.
7. Commit, push, merge to `main`.

Before merging, review the whole branch as if you were a reviewer who did not write it.

## Copy rules

- Hyphens only. No em dashes anywhere: docs, comments, chat, and user-facing copy.
- No claim ships unless it traces to a locked decision in `knowledge/decisions.md`.

## Reference material

Read-only. Clone on demand, outside this repo. Never vendor into this tree.

- `usealtered/altered` - the hand-written core. Also contains the complete GTM master chat at
  `.context/strategy-generated/sources/gtm-master-chat.jsonl` (316K, JSONL), which is the richest
  record of how the offer was reasoned out, and the settlement ledger at
  `.context/strategy-generated/SETTLEMENTS.md`.
- `usealtered/altered-generated` - the previous attempt. Intent is useful, execution is not.
- **Apple Notes exports** - the owner has roughly 97% of his notes exported to a repo prefixed
  `altered`, containing foundational thinking on distillation, the data primitives, and a concept
  called **Liminal** which is the conceptual ancestor of this repo's feature graph. Not visible to
  the current token and not found under `usealtered` or `inducingchaos`. Search for it again once a
  broader GitHub token is provisioned, and read the Liminal notes before extending the graph model.
- To learn Effect v4, clone the source and search it rather than trusting recall:
  `git clone --depth 1 https://github.com/Effect-TS/effect-smol`, plus
  `https://raw.githubusercontent.com/Effect-TS/effect-smol/refs/heads/main/MIGRATION.md` and
  `https://effect.website/llms-full.txt`.
