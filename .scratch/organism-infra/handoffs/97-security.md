# Handoff: organism-infra/97 security review (batch K)

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "security",
  "current_step": "Full security review of 97 at 97275b0 (feat/jg-limit-batchK) done. Security pass: no critical or high findings; 3 low and 2 informational notes, none blocking.",
  "artifacts": [
    "scripts/jg.mjs",
    "scripts/dispatch-context.mjs"
  ],
  "decisions": [
    "Trusted-flag allowlist (scripts/jg.mjs:36): --max-output-bytes added. Value must match ^\\d+$, flag names are checked exactly, any other flag is Refused, and the CLI path still refuses every caller flag (checkFlags). It only narrows output. Pass.",
    "excludes option (scripts/jg.mjs:49-57): in-process only; runJg's CLI main passes no excludes and still refuses --exclude (tested). Entries are validated (non-empty string, not absolute, no '..' segment, no control characters), anchored with a leading '/', and escaped for backslash, *, ?, [, ] and trailing spaces. The leading '/' also defeats a leading '!' or '#' in a file name and makes it impossible to read as a flag, and the argv goes through spawn (no shell). I ran the escape function over nine hostile names (glob chars, brackets, trailing spaces, '#', '!', backslash, '?', leading '-', subdir) against real gitignore semantics (git ls-files --ignored) beside look-alike decoys: each pattern hid exactly its own file. jg 0.8.0 uses the 'ignore' npm package (gitignore semantics) and its own --exclude check rejects a leading !/#, newlines and a trailing unescaped backslash; our output cannot trip those. I did not run a live jg search (the guard blocks jg from this cell). Pass.",
    "Excludes can only hide files from jg, never widen what it reads; user excludes come after the fixed .scratch/ and .claude/ excludes and cannot negate them. Secret scan (secret-in-root), the 5 MB text gate and the secret-in-output check are unchanged and still run before and after the search (tests 16-18 of the limit file pass).",
    "Version floor (dispatch-context.mjs:116, installedJgVersion): `jg --version` is spawned by name from PATH, the same trust as the search call itself; failure or unreadable output is 'no verdict', and an old jg rejects the unknown flag so it fails closed to a named fallback.",
    "Scans: gitleaks detect on origin/main..97275b0, 4 commits, no leaks. npm audit --omit=dev: 0 vulnerabilities. No change to package.json, package-lock.json, .github/ or .claude/ in the batch diff, so no dependency or CI gate is triggered. Node test files touched by the batch (125 tests across the 7 jg/dispatch/wake files) pass in my worktree.",
    "FINDING low, scripts/jg.mjs:43: the allowlist accepts '0', and jg treats --max-output-bytes 0 as unlimited. Callers are in-process and pass only the OUTPUT_CAP constant, and dispatch-context.mjs:143 re-checks the cap on the result, so nothing is exposed today. Suggest rejecting 0 (and values under jg's 256 floor) if another in-process caller ever appears.",
    "FINDING low, scripts/jg.mjs:54 with scripts/dispatch-context.mjs:99-101: a repo file over 16 MiB whose name holds a control character (or a '..' segment) makes runJg refuse the whole call, so the context step falls back 'refused-exclude'. It fails closed (no context, no search), so it is a robustness gap and not a leak. A hostile name can only turn the context step off for that repo.",
    "FINDING low, scripts/dispatch-context.mjs:149-158 (overLimit): statSync follows symlinks, so a tracked symlink whose target is over 16 MiB is excluded by the link's path. Harmless (it hides a file; it reads nothing).",
    "INFO, scripts/jg.mjs countFiles: it now trusts the 'Jevgrep: N relevant files' line in jg's own stdout. It only feeds the no-files label and the usage row, never the secret scan or the cap checks (qa noted the same). The exit-code check still runs first.",
    "INFO, carried from the developer handoff: parseTicket matches only a bold '**What to build:**' line, real tickets use a '## What to build' heading, so a live query carries no ticket text. That narrows what leaves the machine, so it is not a security issue; it is a separate functional ticket for the orchestrator."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Security pass for 97. Open the PR and merge batch K on green CI (91 verdict is in 91-security.md). Optional follow-up tickets: reject --max-output-bytes 0; parseTicket heading format.",
      "owner": "orchestrator"
    }
  ]
}
```

## Verdict

Security pass (97). No critical or high findings. The three low findings and the two notes go in the ticket's Comments without blocking.
