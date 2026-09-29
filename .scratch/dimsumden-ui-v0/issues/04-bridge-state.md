# 04: Bridge: `GET /state` snapshot

**Type:** feature

**Priority:** P0

**What to build:** Node bridge (localhost only) per `.scratch/dimsumden-ui-v0/spec.md` and the 01 ADR: `GET /state` returns the snapshot (tickets with effective priority and bump flag, holder, latest handoff, usage, pending requests) read from a `.scratch/` root.

**Blocked by:** 01, 02

**Status:** resolved

- [ ] `/state` on a fixture tree matches the ADR shape (test)
- [ ] Binds to 127.0.0.1 only (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass: 436/436, specify tests unchanged, both criteria mapped.
- **security, 2026-09-29:** Security pass. Medium: apps/bridge/server.mjs:19 new URL() throws on target // (verified crash; a web page can trigger it), wrap in try/catch and return 400. Low: server.mjs:27 500 echoes err.message; snapshot.mjs handoff/title text is untrusted, UI must render as text. gitleaks clean, npm audit 0, no deps. Details in handoffs/04-security.md.
