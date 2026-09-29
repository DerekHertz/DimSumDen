# 08: Scene: one plush per active ticket

**Type:** feature

**Priority:** P0

**What to build:** Pure scene-from-state function and renderer per `.scratch/dimsumden-ui-v0/spec.md`: active tickets only (claimed, in-review, blocked, waiting frontier), perch and pose from the existing character-animation spec and asset contract. Nothing new is animated. Designer reviews after qa.

**Blocked by:** 07

**Status:** resolved

- [ ] Table test over snapshots for the scene-from-state function
- [ ] Browser smoke: one plush per active fixture ticket; resolved tickets absent

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** qa specify: 35 tests in apps/ui/src/scene/scene-from-state.test.mjs (13a9eb0), red. Browser smoke AC is human-verified. Handoff: handoffs/08-qa-specify.md
- **orchestrator, 2026-09-29:** Scope add (user, 2026-09-29): also add a --model flag to scripts/log-cell.mjs so each cell row records the model it ran on (groundwork for lowering default model levels). Developer writes its own test for this. Also: qa's reading of ADR 0011 cellType (holder, else lastCell -> orchestrator on crown#0) is accepted.
- **qa, 2026-09-29:** QA pass: 567/567, specify tests unchanged, AC1 covered, AC2 human-verified, --model scope covered by log-cell-model.test.mjs.
- **orchestrator, 2026-09-29:** Design review (user decision, 2026-09-29): the designer couldn't run in WSL because it has no browser tools, so the user gives the visual verdict. Code-read findings for the user to check: (1) stacked crown chips overlap (styles.css:93); (2) 'Needs you' chip missing glow-lantern (styles.css:98); (3) queued chip opacity 0.55 dims the label text and may fail 4.5:1 contrast (styles.css:103), which is a designer spec error: dim the glyph only. Branch feat/dimsumden-ui-v0-08-scene-from-state at 388318c; qa verify passed.
- **orchestrator, 2026-09-29:** User design verdict (2026-09-29): bounce. (1) FIX: status chips overlap where plushes stack on Bao's head (3 crown chips collide); stack them so each is readable. (2) SKIP: the 'Needs you' yellow is enough; no glow-lantern for now. (3) FIX: dim only the queued glyph and keep the label at full ink (designer's own spec correction, for accessibility).
- **orchestrator, 2026-09-29:** User re-review (2026-09-29): the chips are OK. One more fix: the crown plushes stacked on Bao's head still overlap each other a little. Space the perch slots out a bit more. Then PR and merge when green (user approved).
- **security, 2026-09-29:** Security pass at 5ec88f9. gitleaks clean, no dep/CI change, no critical/high/medium findings; two low informational notes in handoffs/08-security.md.
