# 38: scripts/jev.mjs pre-check script

**Type:** feature

**What to build:** Build `node scripts/jev.mjs <tier|verify>` per ADR 0010: inputs, 16k truncation, secret-pattern block, 10 s timeout, fallback exits 0, $0.50/day cap from today's jev rows, row append. Tests via decide() with a fake transport. First check TypeSafe primary docs for plain HTTP; a dependency or TYPESAFE_API_KEY setup needs the user's yes. Design: docs/adr/0010-jev-precheck-tier-and-verify-depth.md.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] tier and verify points return pick/conf and append a jev row (test)
- [x] every fallback reason exits 0 and logs `fallback` (test)
- [x] cap reached -> fallback `cap` without a network call (test)
- [x] shadow is the default mode (test)

## Comments

- **Created (orchestrator, 2026-09-28):** Follow-up of 04 (ADR 0010), published with the user's yes.
- **qa, 2026-09-29:** QA pass: tests unweakened, 28/28 pass, risk-check behavior unchanged.
- **security, 2026-09-29:** Security pass at 1be42fd. No findings medium+. LOW: --tests reads any path and sends it; secret patterns narrow (no ghp_/sk-/xox); usage.jsonl append unlocked. Detail: handoffs/38-security.md
