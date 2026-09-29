```json
{"ticket": "organism-infra/57", "cell": "architect", "current_step": "ADR 0014 written; trial not started, waits on user yes for build, jg auth and .claude edits",
 "artifacts": ["docs/adr/0014-jevgrep-context-supply-at-dispatch.md"],
 "decisions": ["Context supply is in scope as its own capability; ADR 0010 is followed, not amended", "Push a file path in the dispatch prompt, never excerpts; orchestrator never reads the file", "Scout gets a pull line, not a push", "Trial thresholds fixed before results (ADR 0014 decision 8)"],
 "failures": ["jg not installed in this cloud env and jg ignores TYPESAFE_API_KEY, so no prototype was run; decision rests on primary jevgrep docs and existing usage.jsonl and handoff numbers"],
 "pending": [{"item": "User go on building scripts/dispatch-context.mjs and running jg auth (and jg doctor) in the target env", "owner": "orchestrator"}, {"item": "Build and test scripts/dispatch-context.mjs (ADR 0014 decision 3, 7)", "owner": "developer"}, {"item": "Apply .claude edits: orchestrator relay step, scout pull line, kind:jg in usage kinds (needs user permission)", "owner": "orchestrator"}, {"item": "Phase 1 replay on 10+ resolved tickets, then phase 2 live trial on 3+ tickets, report to user for go/no-go", "owner": "orchestrator"}]}
```

# 57 architect handoff

**State:** done (ADR only). Trial and go/no-go remain.

**What changed:** `docs/adr/0014-jevgrep-context-supply-at-dispatch.md`, uncommitted in the main checkout (branch claude/fervent-pascal-ae5enm). No code, genome or CONTEXT.md edits.

**Decisions made (also in the ADR):**
- Design C: `scripts/dispatch-context.mjs --ticket <ref>` runs `jg` once per ticket on the What-to-build text, writes `.scratch/_context/<feature>/<NN-slug>.md`, logs `kind:"jg"`. Dispatch prompt gets one path line for architect, qa specify and developer. Not verify, security or orchestrator.
- Skip when the ticket already names 2+ existing paths, or non-code type. Fallback is today's cold start.
- Trial: phase 1 retrieval replay on 10+ resolved tickets (recall of PR-touched files at least 0.6, output at most 24 KB); phase 2 live on 3+ tickets against usage.jsonl medians (qa specify 49.5k, developer 50.9k).

**Conflicts surfaced:** ADR 0010 decision 9 says source never leaves the machine; that scopes jev.mjs only. ADR 0014 records jg's exposure (user allowed source excerpts 2026-09-28). Proposed, not made: a one-line pointer in 0010 decision 9 (ADR edit is a gate).

**Next step:** the orchestrator asks the user for a yes on follow-ups A to D (ADR "Consequences"), then dispatches a developer for the script. The user must run `jg auth` in the cloud env (jg ignores env keys; `jg auth --provider <name> --stdin` is the unattended form).

**Suggested skills:** tdd, organism-protocol.

**Gotchas:**
- n=3 cannot resolve a token difference: developer cell tokens range 4.8k to 229k. Judge with exploration-call counts and phase 1, and tell the user the spread.
- jg cost is not printed and not under the 0010 cap; the user reads it off the provider dashboard.
- `.scratch/` is tracked and full of prose, so the search must `--exclude '.scratch/'`. `.claude/worktrees/` is gitignored, which jg honors.
- Cloud: jg may need `NODE_USE_ENV_PROXY=1`.
- Failed calls: none refused. `which jg` found nothing (env, not a guardrail).
