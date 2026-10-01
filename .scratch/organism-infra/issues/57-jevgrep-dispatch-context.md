# 57: jevgrep context at dispatch

**Type:** design-question

**Priority:** P0

**What to build:** Cells start cold and spend tokens locating code. Try running `jg` (jevgrep) on a ticket's What-to-build text at dispatch and passing the top file paths and excerpts in the dispatch prompt; also consider `jg` for scout codebase surveys. ADR 0010 currently keeps dispatch routing and scout filtering out of Jev's scope, so the architect first records an ADR (amending or following 0010) on whether context supply is in scope. Then a trial on a few tickets compares cell tokens with and without jg context, using `log-cell.mjs` rows as the baseline.

**Blocked by:** none

**Status:** in-review

- [ ] ADR recorded (architect)
- [ ] Trial on 3+ tickets, token comparison in the handoff
- [ ] Go/no-go from the user

## Comments

- **Created (orchestrator, 2026-09-29):** User: "jev would also be good for handing agents necessary codebase information really fast". jg has been run ~6 times across all sessions; no genome mentions it.
- **orchestrator, 2026-09-29 (cloud 3):** User wants jevgrep in use alongside the Jev measurement. Raised to P0. The architect ADR gets the next free cell slot (both slots are on 51/58 qa specify). The trial then runs on the tickets after that, and the token comparison goes into the same measurement pass as verify going live.
- **architect, 2026-09-29:** ADR 0014 written (docs/adr/0014-jevgrep-context-supply-at-dispatch.md): context supply in scope; script writes a jg context file once per ticket, dispatch prompt carries the path only; trial thresholds fixed. Checkbox 1 done; trial and go/no-go need user yes on build and jg auth. Handoff: handoffs/57-architect.md
- **orchestrator, 2026-09-30:** User yes (2026-09-30) on build + trial. Build filed as 87; trial phases run after 87 merges.
