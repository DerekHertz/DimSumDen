# Handoff: ticket 07, qa verify — QA pass

**Mode:** verify. Verified `worktree-agent-aad01bd255e8ec60a` @ `5009afd` (worktree `D:/claude_sessions/agent_office/.claude/worktrees/agent-aad01bd255e8ec60a`), based on `a5e42bc`, not today's `main` (`aa2489d`).

## Verdict: QA pass

Full findings and the file:line evidence for each criterion are in the ticket's `## Comments` (2026-09-27, "QA verify"). Summary:

- **`npm test`: 42/42 pass**, 0 fail/skipped.
- **Criterion 1** (props/hats attach by socket name, follow through all clips): the generic `attachProp` (`apps/ui/src/scene/dev-scene.mjs:158-181`) parents the prop to the named socket bone, so it inherits that bone's transform through every clip. The `hat` socket exists in the rig/contract (`panda-contract.mjs:11`, tested) but no habit currently uses it — consistent with spec.md, not a gap in this ticket. `prop-placement.test.mjs` (12 tests) hard-checks world-space attachment at 9 sampled times per loop.
- **Criterion 2** (three Brain clips in the glb, pass contract): confirmed directly against the real `apps/ui/public/models/panda.glb` — `fan_tap_and_point`, `scroll_unroll`, `blueprint_unroll` are all present, and the real-file contract test passes.
- **Criterion 3** (director maps `working` to habit loop, tested): `HABIT_LOOPS`/`mappingFor` (`director.mjs:43-57`) covered by `director.test.mjs:124-161`; all pass.
- **Criterion 4** (three types distinguishable by habit): not automatable (visual/holistic). Treated as `human-verified` — backed by designer rounds 1-3 and the user's 2026-09-27 verdict, which accepted the visual result and asked only for the blueprint-size follow-up (moved to ticket 11).
- **No qa-specify pass exists for ticket 07** (checked git history), so there is no specify-branch test file to diff for weakened assertions. Hand-diffed every `*.test.mjs` change across all ticket-07 commits (`dc5e751~1..5009afd`): only additions plus one mechanical sync-to-async edit; nothing removed or weakened.
- **`git merge-tree --write-tree aa2489d worktree-agent-aad01bd255e8ec60a`**: clean — single tree (`7539280916...`), exit 0, no conflicts. The branch is one merge-base (`157cdeb5`) behind today's `main`; nothing on `main` since then touches these files, so no rebase is needed before merge.

No bounce conditions found.

## Next

Security review, then the merge proposal. The user has already accepted the deferral of the blueprint-size MEDIUM and the dev-scene first-frame-render fix to `11-prop-polish.md`; those are not blockers here.

## Status

Ticket 07's `## Comments` carries the full QA verdict. Status left as-is (`in-review`) per the qa genome — qa does not set `resolved` on a code ticket. No lock was held (verify mode, read-only against the branch).
