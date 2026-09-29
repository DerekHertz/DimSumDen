# 53: Rename organ → station across genomes, skills, docs and code

**Type:** task

**Priority:** P1

**What to build:** The user renamed "organ" to **station** (2026-09-29). `design-brief.md` and `CONTEXT.md` are already done; use CONTEXT.md's Station entry and the table in `design-brief.md` §4.2 as the source of truth. Carry the rename through everything else:
- The genome frontmatter `organism.organ:` field becomes `station:`, with values `pass`, `steamers`, `tea-pantry`, `front-of-house`. Update whatever parses it (`apps/organism-infra/schemas.mjs` and friends) and the tests.
- Genome and skill prose: "Brain cell", "Muscles cell", "Immune cell", "Skin cell" become "Pass cell" and so on, in the genomes, `organism-protocol`, the other skills and `CLAUDE.md`'s Cells section.
- `docs/agents/*`, plus UI and asset code that names organs.
- Decide with the user whether "Brain gate" keeps its name. It's used everywhere; a rename to "Pass gate" is optional and would be done in this ticket.

Don't rewrite ADRs: they are history. Add one line to the newest ADR index or a new short ADR recording the rename. The `.claude/` edits are user-gated, and the PR merge is that gate.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `grep -rniw organ` over `.claude/`, `docs/agents/`, `apps/`, `scripts/` and `CLAUDE.md` returns only intentional "was: organ" notes (check in the handoff)
- [ ] The genome schema accepts `station:` and the tests pass
- [ ] The decision on "Brain gate" is recorded

## Comments

- **Created (orchestrator, 2026-09-29):** The user chose "everything"; the brief and CONTEXT.md were done in session 8, and the rest is filed here to fit the usage window.
- **orchestrator, 2026-09-29:** User decisions (2026-09-29): 'Brain gate' is renamed to 'Pass gate' in this ticket. It runs after dimsumden-ui-v0/12 and before 13.
- **qa, 2026-09-29:** qa specify done: 7 red tests in scripts/organ-to-station.test.mjs on tests/organism-infra-53-organ-to-station-rename (5c0ce57). See handoffs/53-qa-specify.md.
- **developer, 2026-09-29:** auto-mode classifier denied edits to .claude/ and CLAUDE.md; see handoff
- **orchestrator, 2026-09-29:** Unblocked (orchestrator, 2026-09-29): the user ran the developer's rename script and committed c20c001. Moved to in-review.
- **qa, 2026-09-29:** QA pass: 651/651, specify tests unchanged. See handoffs/53-qa-verify.md
