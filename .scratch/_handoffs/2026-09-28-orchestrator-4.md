```json
{"ticket": "none/orchestrator-session", "current_step": "Moving the organism to WSL; next session runs in ~/dimsumden under Ubuntu",
 "artifacts": [".scratch/organism-infra/issues/27-wsl-trial.md", ".scratch/organism-infra/refs/jev-engineering-notes.md", ".scratch/organism-infra/issues/26-gc-forgive-main-checkout-copies.md"],
 "decisions": ["repo code may go to TypeSafe cloud via jevgrep (not .env or secrets)", "jevgrep trial before the full ticket 04 ADR", "npm ci first in every code cell's worktree", "try WSL (ticket 27) before the jevgrep trial"],
 "failures": ["classifier blocked the orchestrator editing .claude/settings.json; the user added the allow rules", "Playwright install-deps needs sudo in WSL; the user runs it"],
 "pending": [{"item": "ticket 27: WSL trial, using ticket 24 as the relay", "owner": "orchestrator (WSL)"}, {"item": "jevgrep trial: 24 baseline vs 26 with jg", "owner": "orchestrator"}]}
```

# Handoff: orchestrator, 2026-09-28 (session 4, Windows)

**Done:** organism-infra/16 (PR #25) and 25 (PR #26) merged and resolved. Created tickets 26 (gc forgives main-checkout copies) and 27 (WSL trial). gitleaks installed on Windows. jevgrep installed in WSL (`wsl bash -lc "jg ..."`); a single smoke query took 4.5 s and returned a wrong top file. The TypeSafe plugin is installed on Windows at user level; WSL's Claude still needs it. The origin remote now points at DimSumDen.

**WSL state:** Claude CLI installed; repo cloned to `~/dimsumden`; `npm test` 209/210 until the user runs `npx playwright install-deps chromium` (needs sudo).

**Caution:** the Windows checkout still has uncommitted and untracked work that the WSL clone does not have: character-animation issue edits, `design/3d/panda-mascot.blend`, many `.scratch/_handoffs/*` and `character-animation` handoffs and design files. Commit or copy them before retiring the Windows checkout.

**Next, in order:** 27 (with 24 as its relay), then 04's jevgrep trial with 26, then 21, 20, 19, 22, 23, 11.

**Dispatch notes:** unchanged from session 3, plus: npm ci first; keep board comments short; reviewer worktrees are removed at handback (allowed now).
