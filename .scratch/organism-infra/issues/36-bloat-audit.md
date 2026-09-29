# 36: Bloat audit of per-cell context

**Type:** research (scout, read-only)

**What to build:** Measure what each cell loads before doing any work, so the Jev/efficiency grill (ticket 04) has per-component numbers. For each cell type in `.claude/agents/`: genome size, preloaded skills (`skills:` frontmatter) and their sizes, CLAUDE.md, and any docs the genome tells it to read at start. Also size the typical handoffs and relay reports from tickets 26/28/34/35. Report in approx tokens (bytes/4), largest first, and flag duplicated text across genomes/skills.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Per-cell startup load table (component, bytes, ~tokens)
- [x] Top 5 biggest components and duplication candidates
- [x] Handoff/report size stats for 26/28/34/35
- [x] Cross-check against `cell_backfill` row in `.scratch/usage.jsonl`

## Comments

- **Created (orchestrator, 2026-09-28):** Step 1 of the efficiency plan approved by the user.
- **Result (scout via orchestrator, 2026-09-28):** Startup load per cell (genome + preloaded skills + CLAUDE.md/CONTEXT.md/cell-start.md), about 4 bytes per token: orchestrator ~7.4k tokens, architect 6.4k, product 6.0k, designer 5.8k, developer 5.3k, qa 5.1k, security 4.3k, debugger 4.1k, scout 1.9k. organism-protocol (~1.9k) is the only skill most cells load (7/9). The orchestrator genome is ~2.1k. Handoffs average 0.7–1.0k each, 4 per ticket (7 on 34 because of its bounce). Per-hop tokens from cell_backfill average 29k–46k, so the repo docs are ~10–20% of a hop. Not counted: the harness system prompt and tool schemas, which are the same for every cell and are probably the larger fixed cost. Conclusion: trimming docs saves little; the cost is in task work (reads, tests, tool calls). Model tier and review depth (04) matter more.
- **Harness cost (orchestrator, 2026-09-28):** Measured the first-turn context from subagent transcripts. That is everything a cell has loaded before its first tool call: the harness system prompt, tool schemas, repo docs and the dispatch prompt. Median per cell type: developer 19.5k (n=7), qa 17.7k (n=12), security 16.7k (n=7), scout 8.0k (n=3). Subtracting the repo docs leaves ~12–14k of harness per cell, or ~6k for scout, which has fewer tools. That is 2–3x the repo docs, and it is paid again on every turn, though mostly as cache reads.
