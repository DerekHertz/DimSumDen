# 195 qa specify: conformance setup guard

```json
{
  "ticket": "organism-infra/195-conformance-setup-guard",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests committed on tests/195-conformance-setup-guard (fbda482). 32 fail for the right reason (missing feature), 82 pass. Only apps/bridge/cells/conformance.test.mjs changed.",
  "artifacts": ["apps/bridge/cells/conformance.test.mjs"],
  "decisions": [
    "Interface for the developer: export S6B_DENY_TARGET (relative path in the worktree, no .claude segment, not allowed.txt). The S6b inline --settings deny AND the worktree settings.local.json allow both contain Write(<S6B_DENY_TARGET>), so deny must outrank a real allow. The prompt names the target; evaluateS6b counts a Write whose file_path ends with it as the denied attempt (a Write at .claude/probe.txt no longer counts).",
    "Setup guard: runSpikes reads the child's init. permissionMode other than default, or any mcp_servers entry, gives verdict 'setup-invalid' (never go/no-go/unconfirmed) with evidence naming 'permissionMode' and/or 'mcp_servers' (and not naming the other when only one fails). Tested through runSpikes with a stub child for S1 S2 S3 S4 S6 S7 S8 S4b S6b S3b; S5 is not covered (it reads no child init). A missing permissionMode field is untested; all test fakes now emit permissionMode default and mcp_servers [].",
    "S4b: the fake takes the FIRST double-quoted string in the user message as the Bash command and runs it as the tool process. So the prompt must quote the command in double quotes with no inner double quotes. The command and prompt must not match /\\bsleep\\b/i, and the prompt must not mention 'background'. The runner must find and count that process itself (the old 'sleep 61' ps match is gone) and still kill every tool and child pid at the end.",
    "Production shape (ADR 0016 re-run setup, tested for S8 and S4b): every child of those spikes gets --setting-sources project,local, --strict-mcp-config, an inline --settings, and never --permission-mode.",
    "Control run (tested for S4b, S6b, S8; S3b and S1-S7 not asserted): the same spike is run again with the same arguments minus --settings. The spike result gets a property 'control' = { spike, verdict (string), evidence (non-empty array) }. The control must not change the spike's own verdict and must leave no worktree (S6b).",
    "Existing S4b runner tests were rewritten for the new fake (tool process from the prompt instead of a literal sleep 61); their assertions (group-kill go, detached no-go, no-EOF no-go, no leftover pids) are kept. The S6b runner test lost the Write(.claude/**) assertions, replaced by the S6B_DENY_TARGET ones, as the ticket requires.",
    "human-verified: 'run instructions in the handoff fit one screen and can be pasted from the main checkout' (developer writes them; user or orchestrator checks)."
  ],
  "failures": [],
  "pending": [
    {"item": "Implement in apps/bridge/cells/conformance.mjs: setup guard, S4b real in-flight tool, S6B_DENY_TARGET, control run, production shape for S8/S4b; update HELP/usage and write the run instructions in the developer handoff", "owner": "developer"}
  ]
}
```

## Criterion to test map

- Fake init with bad permissionMode or mcp_servers makes every spike report setup-invalid and name the field: `setup guard, <id>: ...` tests (two per spike), `both fields wrong`, `written to results.json`, plus the `default` + empty positive case.
- S4b in-flight tool is a visible process, not sleep: `runSpikes S4b: the in-flight tool is a real process, running when EOF and SIGTERM land, and it is not a sleep command` and `never reported as unstarted`.
- S6b deny target outside .claude/: `S6B_DENY_TARGET is a relative path...`, `prompt names the new deny target`, `no inline deny rule and no project-local allow rule points into .claude/`, the updated S6b runner test, and the evaluator test for the old target.
- Control run without --settings scored next to each spike: `runSpikes S6b: a control run...`, `runSpikes S8: a control run...`, `runSpikes S4b: production-shaped arguments ...`.
- Run instructions on one screen: human-verified.

## State

`node --test apps/bridge/cells/conformance.test.mjs`: 114 tests, 82 pass, 32 fail (all missing-feature failures; S4b/S6b go-path tests currently fail on the sleep command, the missing S6B_DENY_TARGET export or the missing setup-invalid verdict). I did not run the full `npm test`. Specify sha for the later light verify: fbda482.

## Failed calls

- Bash, a node script written via heredoc plus run: refused by the worktree guard as too complex; wrote scripts/edits with Write and Edit instead. Genuine guardrail.
