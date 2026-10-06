# 105 developer handoff

Wrote `apps/bridge/cells/conformance.mjs` and `apps/bridge/cells/conformance.test.mjs` (commit 63e66db on `feat/105-steering-spikes`). The script has NOT been run against a real `claude`: this sandbox has no login. The orchestrator runs it and records the results (ticket 105 acceptance criteria 2 to 4 stay open until then).

## Run it

```
node apps/bridge/cells/conformance.mjs --out /tmp/den-conformance
```

- `--dry-run` prints the plan and spends nothing. `--spike S1,S3` runs a subset. `--model` (default `haiku`), `--timeout <s>` (per turn, default 120), `--extra-env NAME` (adds one variable to the child allowlist; try `--extra-env USER` if S1 reports a login failure).
- Run S1 first (`--spike S1`): if it fails on login, the rest cannot pass.
- Spend: 7 spikes, about 10 user turns (S1 1, S2 2, S3 2, S4 2, S5 1, S6 1, S7 1), each 2 to 4 API calls on Haiku (the generated `probe` role file pins `model: haiku`). S2 includes one subagent run; S4 and S7 each hold a tool call 8 to 20 seconds. S5 also calls `scripts/usage-claude.mjs` twice (with a 5 s wait) and so needs the usage token; S5 only reads usage, it never goes no-go on its own.
- Output: one line per spike (GO, NO-GO or UNCONFIRMED) with evidence; raw stdout lines are saved as fixtures (`S1.jsonl`, `S2-subagent.jsonl`, `S3-allow.jsonl`, `S3-deny.jsonl`, ...) plus `results.json` in `--out`. Copy the S1 and S3 fixtures into the adapter's tests (ADR 0016 S3: "capture the real shapes as fixtures").
- Exit code 1 if any spike is no-go.

## What each spike does and decides

- S1 spawns a child with the env allowlist (PATH, HOME, locale, DEN_CLAUDE_BIN) while this process holds a canary variable; checks `init` with the sent `--session-id`, `--agent probe` honoured (the reply must carry a marker the role file demands), a first stdin user message accepted, no login error, exit on stdin EOF, canary absent.
- S2 runs `sleep 3` in Bash and compares when the `tool_use` line arrives with when its `tool_result` arrives (go: latency under 1 s); a second child starts a subagent and the result says whether subagent lines show on stdout (`tailerNeeded`).
- S3 uses `--permission-prompt-tool stdio`, a Write outside any allowlist, answers allow then deny, and checks the control_request's full input and the files on disk. It prints the real control_request shape.
- S4 SIGTERMs a child mid tool call (under 5 s), looks for the transcript under `~/.claude/projects/*/<id>.jsonl`, then `--resume`s it.
- S5 reads 5-hour plan usage before and after one trivial run. Never a no-go: an unmoved integer percent proves nothing; the user must still check the account usage page.
- S6 puts a project `allow` for Write in the probe's own `.claude/settings.json` and a `--settings` deny on `.claude/**`: go needs allowed.txt written (merge) and `.claude/probe.txt` absent (deny wins). The model never attempting the denied write gives UNCONFIRMED.
- S7 writes a second user message while a `sleep 8` tool call runs and names the behaviour: `queued-new-turn`, `merged-into-running-turn` (both go), `dropped` or `interrupted` (no-go). The UI wording (slice 2) follows the named behaviour.

```json
{
  "ticket": "organism-infra/105-steering-spikes-conformance",
  "cell": "developer",
  "current_step": "conformance.mjs and 37 unit tests committed (63e66db); full npm test green (2068). The script has not run against a real claude (no login in the sandbox); the orchestrator runs it and records results.",
  "artifacts": ["apps/bridge/cells/conformance.mjs", "apps/bridge/cells/conformance.test.mjs"],
  "decisions": [
    "Pure builders (buildArgs, buildChildEnv, userMessageLine, controlResponseLine) and pure evaluators (evaluateS1..S7) are exported and unit-tested; the harness is tested against scripted fake claude binaries (S1, S3, and a generic fake for S2, S4, S6, S7).",
    "The adapter-side hypotheses the spikes test: stdin user line is {type:user,message:{role:user,content}}; control_request is {type:control_request,request_id,request:{subtype:can_use_tool,tool_name,input}}; the reply is {type:control_response,response:{subtype:success,request_id,response:{behavior:allow|deny,...}}}. These are SDK-protocol recollections, unverified; a no-go on S3 with evidence showing a different shape means the shape, not the design, is wrong.",
    "buildArgs refuses --dangerously-skip-permissions, --allow-dangerously-skip-permissions and --permission-mode in extraArgs (ADR 0016 decision 3).",
    "Each spike runs in a throwaway temp dir with a generated role file 'probe' (model haiku), not in the repo, so repo settings and the real roles cannot change the result. Consequence: S1 proves --agent works under -p for a project role file, not that this repo's 'scout' loads.",
    "S5 never emits no-go; S6 and S2's subagent check can emit UNCONFIRMED when the model does not do the thing asked."
  ],
  "failures": [
    "claude --help on this machine (2.1.287) lists --permission-prompts host|none but does not list --permission-prompt-tool; the script passes --permission-prompt-tool stdio as ADR 0016 says. If the CLI rejects it, S3 is no-go with the stderr tail in the evidence."
  ],
  "pending": [
    {"item": "Run the script with the owner's login (command above), paste S1 to S7 results into the ticket, update ADR 0016's open questions (billing: confirm on the usage page), and copy the S1 and S3 fixtures for the adapter tests. A go on S1 to S3 unblocks 106; S7 unblocks 107.", "owner": "orchestrator"}
  ]
}
```
