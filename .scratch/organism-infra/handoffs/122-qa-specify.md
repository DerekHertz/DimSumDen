# 122 qa specify

Branch `tests/122-new-session-per-ticket`, specify sha `130f18f`. Test file: `scripts/next-session.test.mjs` (14 tests; 13 fail with "Cannot find module scripts/next-session.mjs", the missing feature; one "no handoff, claude not started" is tightened to also need the stderr message so it fails now too).

```json
{
  "ticket": "organism-infra/122-new-session-per-ticket",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed at 130f18f on tests/122-new-session-per-ticket. Developer builds scripts/next-session.mjs, the next-session package script, and the gated genome patch.",
  "artifacts": ["scripts/next-session.test.mjs"],
  "decisions": [
    {"decision": "Interface pinned by the tests: node scripts/next-session.mjs [--root <dir>] [--run]. Root is --root, else $ORGANISM_ROOT, else cwd (mirrors apply-gated --root).", "why": "ticket names no flags; the run flag is called --run"},
    {"decision": "Latest handoff = highest date then numeric N, from <root>/.scratch/_handoffs/ files named YYYY-MM-DD-orchestrator[-cloud]-N.md. Not mtime, not lexicographic (10 beats 9).", "why": "'latest orchestrator handoff'; per-ticket handoffs under a feature handoffs/ dir are not session handoffs and are ignored"},
    {"decision": "Print mode prints `claude --agent orchestrator <prompt>` (stdout, exit 0) and never starts claude. --run spawns `claude` from PATH with argv exactly [--agent, orchestrator, <prompt>], one prompt arg, no shell.", "why": "stub claude on PATH records argv; odd chars in root path must not split the prompt"},
    {"decision": "Prompt must name the handoff file, match /frontier/i, and be under 600 chars (restates no rules).", "why": "ticket: 'restates no rules'"},
    {"decision": "No handoff (or no _handoffs dir): exit non-zero, stderr matches /no orchestrator handoff/i, no command on stdout, claude not started even with --run.", "why": "AC2"},
    {"decision": "Not asserted: claude's exit code propagation, claude missing from PATH, how the printed command quotes the prompt.", "why": "unspecified; developer's choice"}
  ],
  "failures": [],
  "pending": [
    {"item": "Create scripts/next-session.mjs and package.json script next-session; make scripts/next-session.test.mjs pass; npm test green. Write the genome rule as a gated patch .scratch/_handoffs/gated/122-next-session-genome.patch (no test).", "owner": "developer"}
  ]
}
```

## Criterion to test map

- AC1 (gated patch adds end-of-ticket rule and says compaction is only for mid-flight gate hits): `human-verified`. Gated edit, no test. Reviewer should check the patch text names worktree-gc, handoff, "fresh session", proposes the next ticket, and says compaction only for a ticket hitting the 80k gate mid-flight.
- AC2 (prints command naming latest handoff; non-zero with clear message when none): describe "print mode" (latest, numeric ordering, name-not-mtime, ignores non-handoffs and per-ticket handoffs, ORGANISM_ROOT fallback), "no handoff" (two tests), "package script" (npm run next-session wiring), "prompt content".
- AC3 (run flag covered with stubbed claude): describe "--run with a stubbed claude" (argv shape, odd path chars, no start without handoff) plus "does not start claude when --run is absent".
- AC4 (npm test green): developer; the new file is under scripts/ so the glob picks it up.

## Notes

The orchestrator's "latest handoff" is read from `.scratch/_handoffs/` in the main checkout; a worktree has no copy, hence the ORGANISM_ROOT fallback.
