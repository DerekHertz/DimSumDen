# 72: S4: Wake-up gate prelude, shadow

**Type:** feature

**Priority:** P2

**What to build:** A session-start prelude script for the orchestrator that decides every code-decidable wake condition itself and calls Jev's `wake` point only for ambiguous new inputs (ADR 0015 decision 6). Held until security (67) rules on sending comment and gate-request text.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 67, 71, 77

**Status:** resolved

- [ ] A session-start prelude script decides every code-decidable condition without calling Jev (frontier non-empty, usage under 80%, CI red or merge conflict, open user-verdict gate request).
- [ ] Code, not Jev, wakes on any user-authored comment, any `Scope added` comment and any `--verdict` comment (ADR 0015 decision 6).
- [ ] Only ambiguous new inputs call Jev; labels `needs-claude | informational | other`; `other` and any failure wake the orchestrator.
- [ ] Shadow logs the label and whether the orchestrator then acted; no daemon, no timer.
- [ ] The wake go-live bar (ADR 0015 decision 6, now accepted) is encoded in `jev-report.mjs` as pass/fail lines.
- [ ] Input sent is exactly what ticket 67 allowed.

## Comments
- **orchestrator, 2026-09-30:** Now blocked by 77 per 67's security verdict.
- **qa, 2026-09-30:** qa specify: tests committed on tests/72-wake-gate-prelude (5f6c91b). AC6 covered by existing exposure.test.mjs; no new test. Developer needs: jev-wake-prelude.mjs (new) and jev-report.mjs (extend with report.wake).
- **developer, 2026-09-30:** developer: feat/72-wake-gate-prelude @ 97b02c7; 40/40 qa tests + 8 new pass, npm test 1153/1153. Proposed orchestrator genome edit and open notes in handoffs/72-developer.md.
- **orchestrator, 2026-09-30:** Scope added (user verdict, 2026-09-30): at 5-hour usage >= 80% the wake prelude never wakes on its own and suppresses frontier wakes. It still wakes for wind-down items: in-flight cells, red CI or merge conflict, user-authored comments, pending gate requests. Supersedes qa's pinned '80%+ wakes' test.
- **developer, 2026-09-30:** developer fix 2: 80% verdict on feat/72-wake-gate-prelude @ 314bd8a; qa's pinned 80% test replaced; npm test 1160/1160. See handoffs/72-developer-2.md.
- **orchestrator, 2026-09-30:** User verdict, 2026-09-30: at usage >= 80%, ambiguous cell comments labelled needs-claude or other by Jev (or a failed Jev call) still wake. Kept as built in 314bd8a.
- **qa, 2026-09-30:** qa verify: QA pass on feat/72-wake-gate-prelude at 314bd8a; 1160/1160 pass, 0 skipped. Replaced 80% test matches both user verdicts; in-flight cells fit the wind-down list. Handoff: 72-qa-verify.md.
- **qa, 2026-09-30:** QA pass: 1160/1160, all ACs covered, replaced 80% test matches both user verdicts.
- **qa, 2026-09-30:** handoff published before second claim (re-claimed solely to add verdict flag); content unchanged
- **security, 2026-09-30:** Security pass. gitleaks clean 4 commits. No new deps, npm audit 0. gh shell-out (readCi): execFileSync with hardcoded args, 15s timeout, stderr ignored — safe. Board reads (ticketTextOf): feature/ticket from events.jsonl joined into path with no normalization; theoretical traversal if events tampered, local-only context — Low. Fake sk- key in test:45: sk-test-KEYVALUE-wake-prelude-72-test, never reaches real transport, gitleaks did not flag — Low. Jev exposure: decide() sends only ticketHeader(ticketText).slice(0,4000) + newComment.slice(0,4000); exactly what ticket 67 allowed. hasSecret() runs on assembled text before any send. codeWakes author fix from 77 is present. Genome commit 8b3c807: minimal, scoped, user-authored.
