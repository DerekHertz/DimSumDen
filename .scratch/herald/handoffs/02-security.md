# Handoff: herald/02 security review

Verdict: Security pass (no critical or high findings). Three medium and two low comments, non-blocking.

```json
{
  "ticket": "herald/02-herald-genome",
  "cell": "security",
  "current_step": "branch review complete at 8e30269, verdict pass",
  "artifacts": [".claude/agents/herald.md", "scripts/draft-check.mjs", "scripts/draft-check.test.mjs", "scripts/herald-genome.test.mjs", "docs/agents/herald-voice.md"],
  "decisions": [
    "diff reviewed with origin/main...8e30269 (5 files); the two-dot diff also shows orchestrator.md and CONTEXT.md only because main moved ahead, not branch changes",
    "15 of 15 herald tests pass on the branch",
    "fixtures: credential strings in draft-check.test.mjs are split by concatenation, so no contiguous token exists in the source; the AKIA fixture is AWS's documented example key; no real credential found; pattern grep of the branch files finds only the regex definition",
    "gitleaks is not installed here (not at ~/.local/bin or /usr/local/bin); fell back to pattern grep over the diff, so CI secret scanning has not been simulated with gitleaks",
    "genome: no Bash, WebFetch, WebSearch, Edit or GitHub tools, so herald has no direct publish tool; the exit gap is transitive through Agent (see M1)",
    "user decides on the genome findings; genome edits go through the orchestrator with user permission"
  ],
  "failures": [
    "gitleaks: command not found (fell back to pattern grep)"
  ],
  "pending": [
    {"item": "decide whether to restrict herald's Agent tool to Agent(scout) (M1)", "owner": "user"},
    {"item": "optionally broaden SECRETS patterns in scripts/draft-check.mjs (M2)", "owner": "developer"},
    {"item": "propose merge of herald/02", "owner": "orchestrator"}
  ]
}
```

## Findings

Medium (non-blocking)
- M1 `.claude/agents/herald.md:4` and `:44`: `Agent` is unrestricted, and the genome says "you hold no tool that can" publish. Herald can dispatch any cell. Even scout (`scout.md:4`) has Bash and WebFetch, and `.claude/settings.json` auto-allows `git push -u origin feature/:*` and `gh pr create:*` for Bash. Herald reads untrusted text (repo files, commit messages and PR text relayed by scout), so a prompt injection could steer a scout dispatch to push or open a PR. Scout's "never edits files" and read-only status is prose, not enforcement. Acceptable given scout is the intended helper, but tighten it: use `tools: Read, Grep, Glob, Write, Agent(scout), Skill` and update `herald-genome.test.mjs` to assert no bare `Agent`. Soften the "no tool that can" wording to "no direct tool" if left as is. No other cell uses `Agent(...)` yet, so this sets a precedent.
- M2 `scripts/draft-check.mjs:8-13`: the secret patterns are narrow. Probed and missed: `github_pat_`, `gho_`/`ghs_`, plain `sk-` and `sk-proj-` keys, Slack `xox*` tokens, JWT/Bearer strings, `-----BEGIN ... PRIVATE KEY-----`, `aws_secret_access_key=`, `token=`/`password=`/`SECRET_KEY=` pairs, JSON-quoted `"api_key": "..."`, lowercase `akia`, and any token split by a zero-width character. Caught: the four fixture shapes, quoted `apiKey: "..."`, credentials in a header. It is advisory (herald reads no secret store in normal use, and the user reviews the draft), so it is not a bypass of a hard control, but add patterns for the missed common shapes. Also `:40` treats `user:pass@host` URLs as an email hit, which is a fine side effect.
- M3 `.claude/agents/herald.md:26`: "outside the repo" is prose only. `Write` has no path scope, so herald could write to `.claude/`, `scripts/` or `.git/hooks` in its worktree. Same exposure as designer and product, and it only lands through a reviewed merge. Consider a test or hook if this matters.

Low
- L1 `.claude/agents/herald.md:32`: the draft check runs only if herald dispatches scout to run it. It is advisory, not a gate. The done criterion depends on it, so qa or the user should confirm the result.
- L2 `scripts/draft-check.mjs:18,36`: paragraph count is by blank-line separation, so 4 lines with single newlines count as 1 paragraph; an empty body passes. Shape lint only, no security impact.

## Not a concern
- No lock races, path traversal or shell-outs: the script reads one argv path, run by the user or scout. No network use, no daemon exposure.
- No new dependencies, so no audit or lockfile gate applies.
- No CI or workflow files changed.
- `docs/agents/herald-voice.md` has no credentials or personal data.
