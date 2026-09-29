# 03: Refresh CLAUDE.md to match the code

**Type:** task

**Priority:** P1

**What to build:** `CLAUDE.md` still says "No app code exists yet" and describes a planned TypeScript stack. Rewrite it, short as before, to state:
- the real stack: Node ESM scripts, React plus React Three Fiber in `apps/ui`, the board CLI, and the bridge;
- the stations (the Pass, Steamers, Tea & Pantry, Front of House) and the herald;
- the relay as it runs now: light verify, the risk-check, relay autonomy and up to two concurrent cells;
- the cloud notes (`PW_CHROMIUM_PATH`, `docs/agents/cloud-sessions.md`, the usage estimate).
It's a gated edit (the user approved it on 2026-09-29), so the developer writes the new text as `docs/agents/CLAUDE.proposed.md` and the orchestrator applies it.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] No claim in CLAUDE.md contradicts the code on main (checked in the handoff)
- [ ] Stays under about 40 lines

## Comments
- **Decision (user, 2026-09-29):** do the refresh; also run organism-infra/37 (trim genome tools) and a skills bloat scan.
