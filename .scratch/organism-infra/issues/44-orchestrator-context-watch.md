# 44: Orchestrator watches its own context window

**Type:** feature

**What to build:** `node scripts/context.mjs` prints the current main session's context size as JSON: `{"session","context_tokens","percent"}`. It reads the newest top-level transcript in `~/.claude/projects/<project>/` and adds up input, cache_creation and cache_read tokens from the last assistant usage. The orchestrator runs it at every usage check and logs a `{"kind":"context",...}` row to usage.jsonl.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Prints context_tokens from a fixture transcript (test)
- [x] Picks the newest top-level session and ignores subagent transcripts (test)
- [x] No transcript found -> exits 0 with `context_tokens: null` (test)

## Comments

- **Created (orchestrator, 2026-09-28):** User asked for the orchestrator to watch its context window and log it. The genome rule is added now and takes effect once this script exists.
- **qa, 2026-09-29:** QA pass: 3/3 tests pass at 5fd6993, test file unchanged since specify 88a656f, all criteria covered.
- **security, 2026-09-29:** Security pass at 5fd6993: no findings medium or above; 3 LOW notes (unchecked usage field types, whole-file read, stat race). See handoffs/44-security.md
- **Resolved (orchestrator, 2026-09-28):** PR #32 merged. User confirmed the 1M window and the 60% ceiling for main orchestrator sessions.
