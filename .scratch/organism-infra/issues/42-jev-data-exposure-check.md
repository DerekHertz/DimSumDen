# 42: Security check of Jev data exposure

**Type:** research

**Priority:** P2

**What to build:** Check ADR 0010's Data exposure section against TypeSafe primary docs: retention, training use and pricing. Security owns it. Design: docs/adr/0010-jev-precheck-tier-and-verify-depth.md.

**Blocked by:** None (can start immediately).

**Status:** claimed

- [ ] Retention and training policy cited from primary docs
- [ ] Pricing confirmed or ADR corrected

## Comments

- **Created (orchestrator, 2026-09-28):** Follow-up of 04 (ADR 0010), published with the user's yes.
- **orchestrator, 2026-10-03:** Parked: shadow already sends Jev the same data live will (refocus, docs/refocus/triage-2026-10-02.md)
- **orchestrator, 2026-10-07:** Un-parked on the user's yes (136 settlement item 6): runs right after 136's architect; scope now covers handoff text and diffs sent to TypeSafe.
- **security, 2026-10-07:** Security pass (research). Pricing confirmed from docs.typesafe.ai/models.md (0.042 USD per Mtok input, output free). No-training cited (privacy policy, MCA 4.1); retention unbounded, ZDR enterprise-only; Telemetry carve-out medium. Handoff text and diffs: OK on conditions in handoffs/42-security.md, user decides. scripts/exposure.mjs:8-33 medium: pattern gaps; :40-51 low: no per-file diff filter.
