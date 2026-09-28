# 14: harness template gap analysis — architect handoff

**State:** done. Read-only analysis; no code or `.claude/` changes made. Ticket resolved.

## Source

Template fetched via `curl` (raw): `https://raw.githubusercontent.com/walkinglabs/learn-harness-engineering/main/skills/harness-creator/templates/agents.md`. Its 7 sections: Startup Workflow, Working Rules, Required Artifacts, Definition of Done, End of Session, Verification Commands, Escalation.

## Mapping table

| Template section | Where we cover it | Verdict |
|---|---|---|
| Startup Workflow | `organism-protocol` SKILL.md "Claiming a ticket" (claim → board sets `claimed`); genome frontmatter read implicitly on session start; `docs/agents/issue-tracker.md` for ticket state | **Partial gap** — no step confirms environment health (`init.sh` equivalent) or reviews recent commits before claiming |
| Working Rules | Scattered: "one ticket at a time" in `organism-protocol` Apoptosis; "stay in scope" in `.claude/agents/developer.md` step 4; "leave clean state" in `docs/agents/process-hygiene.md` | Covered, but no single "Working Rules" list — each rule lives where it's cheapest to preload |
| Required Artifacts | Board ticket (`.scratch/<feature>/issues/*.md`) ≈ `feature_list.json`; `handoff` skill output ≈ `progress.md`/`session-handoff.md` | **Gap** — no analog to `init.sh` (a single repeatable "verify environment" script) |
| Definition of Done | Per-genome `organism.done` frontmatter field (developer, qa, architect, etc.) | Covered, and more precise than the template's generic version (role-specific, not one-size-fits-all) |
| End of Session | `organism-protocol` "Apoptosis": commit, stop processes (→ `process-hygiene.md`), `/handoff`, `board release`, stop | Covered, more detailed than template |
| Verification Commands | Implicit only: `package.json` scripts (`npm test`, `npm run board`), referenced ad hoc per genome (e.g. developer step 6's scout smoke check) | **Real gap** — no single documented list of "run this before claiming done" |
| Escalation | `organism-protocol` "Brain gates" (generic) + per-genome `gates:` field (specific) + "Environment issues" section | Covered, more detailed than template |

## Deliberate skip: `feature_list.json`

We use the board (one markdown file per ticket, `Status:` header, atomic `.lock` claim) instead of a single JSON tracker. Reasons: (1) concurrent claiming — ADR 0003 and 0008 chose per-ticket lock files over one file so N cells can claim different tickets without contending on one write; a single JSON needs full-file rewrite-and-lock semantics for every status change. (2) Token cost — a cell reads one ticket file (~1–2KB) instead of a growing JSON array of every feature ever ticketed. Not proposing a change here; this is settled by ADR 0003/0008, not a gap.

## Proposed edits

1. **Verification Commands, in `CLAUDE.md`** (small, ~6 lines): add a short section naming the canonical commands — `npm test` (full suite), `npm run board -- <cmd>` (board ops), and pointing to whichever package-specific script a ticket's `apps/<name>/` directory defines. Token cost: trivial, it's preloaded already.
2. **Startup Workflow, in `organism-protocol` SKILL.md**: add one line under "Claiming a ticket" step 1 — before claiming, skim `git log --oneline -5` and confirm `npm test` isn't already red on `main`; if it is, report it as an environment issue rather than claim over a broken baseline. Token cost: ~2 lines, preloaded for every cell, worth it since it catches the exact ci-cd/03 class of problem (a red baseline discovered mid-ticket) earlier.
3. **Hang/timeout rule, in `organism-protocol` SKILL.md**, new subsection near "Environment issues" (~6 lines): *Every long-running command — a test run, dev server, browser automation, or `gh run watch`/CI wait — must be bounded with an explicit timeout. If it fires, that's an environment issue to report (with the command and the bound used), not a thing to retry or wait out.* This sharpens the existing "Never poll or loop while waiting" line in Token Hygiene rather than duplicating it. Evidence this is needed: `.scratch/ci-cd/issues/03-*.md` — PR #18's CI run hung 36+ min in "Run tests" before the user had it canceled; `.scratch/ci-cd/handoffs/02-qa-verify.md` already independently adopted an external timeout by hand. Token cost: ~6 lines, preloaded for every cell.
4. **CI job timeouts**: the proposed `.github/workflows/ci.yml` (drafted in `.scratch/ci-cd/handoffs/03-security.md`, sitting in worktree `.claude/worktrees/ci-cd-03-security/.github/workflows/ci.yml`, not yet applied) has no `timeout-minutes` on either job — the exact gap that let the hang run 36+ min. Propose `timeout-minutes: 15` on `test` (npm ci + Playwright install + suite) and `timeout-minutes: 5` on `security` (gitleaks + audit), applied when ci-cd/01/03 lands. Not a `.claude/` change — the security cell owns this file per its genome and can apply it directly once approved.

No ADR: none of these are hard to reverse (skill text and a workflow field), so this fails the domain-modeling ADR test. No conflict with an existing ADR — ADR 0008's lock timeouts are a different mechanism (board write-lock reclaim), not command/CI timeouts.

## Next step

Orchestrator brings edits 1–3 to the user as a brain gate (`.claude`/`CLAUDE.md` change); edit 4 rides along with whichever cell finishes ci-cd/01/03.

## Suggested skills

`organism-protocol`, `writing-for-agents` (if drafting the actual SKILL.md/CLAUDE.md text).
