# 06: Bridge: `POST /requests` and Gate request handling

**Type:** feature

**Priority:** P0

**What to build:** `POST /requests` validates and appends a Gate request `{id, ts, kind, ref, note?}` (kind: merge-approve, merge-reject, dispatch-approve, dispatch-reject) to `.scratch/_requests/requests.jsonl`. Add `scripts/requests.mjs` with `--list` (pending) and `--handle <id> --outcome <text>` for the orchestrator. Nothing executes.

**Blocked by:** 04

**Status:** resolved

- [ ] A valid POST appends exactly one line; an invalid one writes nothing (tests)
- [ ] `requests.mjs --handle` marks a request handled and `--list` hides it (tests)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass: 521/521, tests unchanged since specify, both criteria mapped. See handoffs/06-qa-verify.md
- **security, 2026-09-29:** Security pass at 9f0929c. Two low findings (note control chars, unbounded log), non-blocking. See handoffs/06-security.md
