```json
{"ticket": "organism-infra/25-shell-and-git-guidance", "current_step": "developer implementation complete, pushed",
 "artifacts": ["scripts/bom-check.mjs", "package.json"],
 "decisions": [
   "no git hook; CI-only enforcement via a new check:bom npm script wired into pretest, which npm test's existing CI job already runs",
   "no-arg default scans git-tracked *.md/*.json files via git ls-files",
   "checked all tracked .md/.json files in the repo for an existing BOM: none found, nothing to strip"
 ],
 "failures": [],
 "pending": [{"item": "verify the branch (bom-check.mjs + package.json) against the ticket's BOM-check acceptance criterion and qa's test-to-criterion map", "owner": "qa"}]}
```

# 25-developer

**Cell:** developer | **Ticket:** organism-infra/25-shell-and-git-guidance

**Scope:** only the "pre-commit or CI check rejects a BOM in .md and .json files" acceptance criterion (per qa's 25-qa-specify handoff). Items 1-6 (protocol prose in `.claude/`) and item 7 (npm ci on worktree creation) are out of scope for this cell.

## Branch

`claude/organism-infra-25-tests`, pushed to origin at `3806c14`.

## What changed

- `scripts/bom-check.mjs` (new): implements the script qa's tests specify. `node scripts/bom-check.mjs [file ...]` exits 0 if none of the targeted `.md`/`.json` files start with a UTF-8 BOM, non-zero and prints offending paths otherwise. No args = scan git-tracked `*.md`/`*.json` via `git ls-files`. Follows `scripts/risk-check.mjs`'s style (shebang, header comment, `git()` helper, `process.exit(main())`).
- `package.json`: added `"check:bom": "node scripts/bom-check.mjs"` and `"pretest": "npm run check:bom"`. CI's `test` job already runs `npm test` (`.github/workflows/ci.yml`), and npm's lifecycle runs `pretest` automatically before `test`, so no CI workflow edit was needed.

## Decisions (per orchestrator dispatch)

- No git hook. CI-only enforcement via `pretest` → `npm test`, which CI already runs.
- No-arg default scans git-tracked `.md`/`.json` files (matches qa's test 6).
- Checked all currently tracked `.md`/`.json` files in the repo for an existing BOM (`node scripts/bom-check.mjs` with no args against the real repo): **clean, 173 files checked, none stripped.**

## Review

Ran `/code-review` (Standards + Spec axes, foreground, both sub-agents in parallel) against `main`. Both axes clean:
- Standards: no informal-convention violations vs. `risk-check.mjs`; two judgement-call smells (Buffer named `fd` instead of `contents`; git call not routed through a reusable helper). Fixed both in a follow-up commit (`3806c14`).
- Spec: no missing/partial requirements within this ticket's scope, no scope creep, nothing implemented-but-wrong. Confirmed independently that the repo has zero BOM-prefixed tracked files.

## Tests

- `node --test scripts/bom-check.test.mjs`: 6/6 pass.
- `npm test` (full suite, includes `pretest` → `check:bom`): 210/210 pass.

## Open questions carried over from qa (unresolved by this ticket's scope)

- Whether a `.git/hooks/pre-commit` should also call `bom-check.mjs` — decided no, per orchestrator dispatch (CI-only).
- Items 1-6 (organism-protocol prose) and item 7 (npm ci on worktree creation, "may belong with 16") remain open on the ticket; both `.claude/`-touching and out of scope for a developer cell.

## Worktree

`C:\claude_sessions\agent_office\.claude\worktrees\agent-acfb0c2e29d78c54a` — clean after this handoff is copied out (no uncommitted changes; handoff file itself lives only in the main checkout, not committed here).

## Failed calls

- `npm run board -- release organism-infra/25-shell-and-git-guidance --status in-review` (first attempt, no State block): `board: release blocked: ... has no valid handoff State block`. Fixable friction, not a guardrail — the handoff needed a leading ```json State block (ticket/current_step/artifacts/decisions/failures/pending fields), which the first draft omitted. Added it and retried.

Otherwise none. `npm ci`, `git fetch`/`merge --ff-only`, `npm test` (twice), `git push` (60s timeout, completed well under), and both code-review sub-agent calls all succeeded on first try.
