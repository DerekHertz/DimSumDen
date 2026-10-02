# 108: `npm run apply-gated`: one command for edits only the user can apply

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

## What to build

Cells can't edit `.claude/` or `CLAUDE.md`, so they write a patch or apply script into `.scratch/_handoffs/` and the user copies a command into a terminal. These pile up (`apply-87-and-90.sh`, `apply-90-limit.mjs`, `apply-93-and-files.sh`, three `.patch` files), and a pasted heredoc hung on 2026-10-02 (#134 status edit). Add `npm run apply-gated` (script under `scripts/`): it lists pending patches in `.scratch/_handoffs/gated/` with their diffs and target worktree, applies each only after the user confirms at the prompt (`git apply --check` first), commits with the patch's message, and moves applied patches to `.scratch/_handoffs/gated/applied/`. The user runs it as `!npm run apply-gated` inside Claude Code. Update the orchestrator's gated-files paragraph in `organism-protocol` and the developer genome to say "write a patch to `.scratch/_handoffs/gated/<NN>-<slug>.patch`" (that genome edit is itself the first gated patch).

Files: `scripts/apply-gated.mjs` (+ test), `package.json` scripts, `docs/agents/` note; gated: `.claude/agents/developer.md`, `.claude/skills/organism-protocol/SKILL.md`.

## Acceptance criteria

- [ ] With no pending patches it prints "nothing to apply" and exits 0
- [ ] Each patch shows its diff stat and target, and is applied only on an explicit `y`; `n` skips it and leaves it in place
- [ ] A patch failing `git apply --check` is reported and left in place; nothing is partially applied
- [ ] Applied patches are committed and moved to `applied/`
- [ ] It never runs a patch's content as a shell script (patches only, no `.sh`)
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from the Claude Code usage audit (proposal 6), user yes 2026-10-02. Goes first: batch M, 112 and 113 ship their settings diffs through it.
- **qa, 2026-10-02:** Light verify: 20/20 tests pass (18 qa + 2 dev), full suite 1830/1830, execFile without shell, all criteria met.
- **security, 2026-10-02:** Security pass. Medium: apply-gated.mjs:163-205 re-reads the patch after the y prompt (swap between review and apply, probed). Low: :52 printable() misses C1 and bidi controls. Low: :205 hooks note. Details in 108-security.md.
