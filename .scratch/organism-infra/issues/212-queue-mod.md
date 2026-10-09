# 212: Queue mod: band above the prompt and a /queue kanban

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Serves:** User visibility (user, 2026-10-08): ticket numbers alone don't say what is queued. The user wants to see the queue in the terminal, with the orchestrator's proposed order highlighted.

## What to build

1. **Queue script.** `scripts/queue.mjs` (board files and `.scratch/usage.jsonl` only, no network; honours `ORGANISM_ROOT` like `scripts/north-star.mjs`). `--json` prints `{inFlight, ready, waitingOnUser, blocked, proposed}`:
   - `ready`: frontier tickets (ready-for-agent, every blocker resolved, no lock) across all features, sorted by priority, then feature, then number. Each row has ref, short title (from the `# NN: Title` heading), priority.
   - `inFlight`: tickets with a lock or status `claimed`/`in-review`, with the holding cell and mode from the lock.
   - `waitingOnUser`: tickets at `ready-for-human`.
   - `blocked`: status `blocked`, or ready-for-agent with an unresolved blocker (name the blocker).
   - `proposed`: the orchestrator's proposed order, from the latest `{"kind":"jev-order"}` row's `actual` list in `.scratch/usage.jsonl` (no new file). Ready rows in that list carry their rank.
   - Plain output (no `--json`) prints the kanban as text columns: READY, IN FLIGHT, WAITING ON YOU, BLOCKED. Proposed tickets are marked with their rank (e.g. `①`).
2. **Band.** A mod `mods/queue/` modelled on `mods/north-star/`: one or two dim lines above the prompt, refreshed on session start and turn complete: in flight (ref, short title, cell) and the next 3 proposed tickets (falling back to the top of `ready`). Fails quiet: no output when the script fails.
3. **`/queue`.** Prints the full kanban from item 1. Use the mod or plugin command mechanism if the mod API has one; otherwise ship `npm run queue` and write the `.claude/commands/` file as a gated patch (`docs/agents/gated-patches.md`). Say which in the handoff.

## Acceptance criteria

- [ ] `queue.mjs --json` buckets a fixture board correctly: ready (sorted by priority), in flight with cell, waiting on user, blocked with blocker named.
- [ ] Proposed order comes from the latest `jev-order` row; ready tickets in it carry their rank; an absent or malformed row means no ranks, not a crash.
- [ ] Titles come from each ticket's heading, truncated to fit.
- [ ] The band shows in flight plus the next 3 proposed (or top 3 ready), and renders nothing when the script fails.
- [ ] `/queue` (or `npm run queue`) prints the four columns.

## Comments
- **orchestrator, 2026-10-09:** User 2026-10-08: published with the user's yes. Order: board priority, with the orchestrator's proposed order highlighted. Runs next after 143 and 210. Follow-on: new 'dashboard' feature (Den kanban + mod version; efficiency, quality, token economics) goes to product + designer for a spec; token economics needs 211.
- **qa, 2026-10-09:** QA pass (light verify, 72ff959): suite 3102 pass, 0 fail, 0 skipped (developer output /tmp/212-tests.txt, not re-run). Specify tests unchanged since 66f838b. AC1-AC5 mapped to passing tests; band live draw and /queue file human-verified. Details in handoff 212-qa-verify.md.
- **security, 2026-10-09:** Security pass (72ff959). gitleaks clean, npm audit 0, no new deps. Low: scripts/queue.mjs:57,124 unfiltered control chars from ticket title/lock reach terminal; mods/queue/hooks/register.tsx:15 cwd-relative script (same as north-star). Details in 212-security.md.
