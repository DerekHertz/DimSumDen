# Handoff: organism-infra/97 developer, round 2 (batch K)

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "developer",
  "current_step": "Done and committed on feat/jg-limit-batchK as 97275b0 (parent 20afbaf). The 11 red [97] tests are green without editing them; npm test: 1729 tests, 1729 pass, 0 fail (the 4 extra are my new tests in scripts/jg-output-format.test.mjs). Live AC1 against this repo with jg 0.8.0 returns a non-null path and no fallback (JSON in Details). Ready for qa verify, then full security (allowlist change).",
  "artifacts": [
    "scripts/jg.mjs",
    "scripts/dispatch-context.mjs",
    "scripts/jg-output-format.test.mjs"
  ],
  "decisions": [
    "MIN_JG_VERSION = 0.7.1 for the context step (dispatch-context.mjs), NOT raised in jg.mjs. jg ships no changelog, so I packed 0.6.0, 0.7.0 and 0.7.1 from npm and searched dist/bin/index.js: --max-output-bytes appears in 0.7.1 (4 hits) and not in 0.6.0 or 0.7.0; --exclude and --max-source-bytes are in all three. jg.mjs keeps its own floor MIN_VERSION 0.6.0 (the --exclude floor) because scripts/jg-wrapper.test.mjs 'jg older than 0.6.0...' asserts that 0.7.0 still runs; raising it to 0.7.1 would break that existing test. jg.mjs now exports versionAtLeast(text, min), which returns true, false, or null when no version is readable.",
    "Version check lives in buildContext as an optional `jgVersion` seam, called after the size gate and secret scan and just before the search; main passes installedJgVersion (spawns `jg --version`, 10 s). Below 0.7.1 gives fallback 'jg-version'; unreadable or failing is no verdict (null), so the search runs. Library default (no jgVersion) does no check, so the 87 tests are untouched. A non-code ticket or a secret still wins over the version check.",
    "Excludes: git ls-files listing is split into `listed` (non-board, includes binaries) and `tracked` (text only, for the 5 MB gate and secret scan, unchanged). Every listed file over 16 MiB (statSync) goes to runJg as `excludes`. runJg validates (non-empty string, not absolute, no '..' segment, no control characters; else Refused kind 'exclude' and a refused usage row), then anchors with a leading '/' and escapes backslash, *, ?, [, ] and trailing spaces. The CLI still refuses --exclude. dispatch-context passes --max-output-bytes 24576 beside --max-source-bytes 24576.",
    "NEW FINDING, fixed inside this ticket because AC1 needs it: the first live run (after the three approved changes) fell back 'incomplete'. jg 0.8.0 exited 0 with 24,273 bytes ending 'End context.', but its output opens 'Jevgrep: 147 relevant files.' and has no '## <path>' headers, and jg.mjs countFiles only counted '## ' lines, so every real search counted 0 files and was treated as 'no-files'. countFiles now takes the larger of the '## ' header count and the 'Jevgrep: N relevant files' number. Four tests added in scripts/jg-output-format.test.mjs (red first: 2 failed, then green). The existing fakes use '## ' headers and still count.",
    "Security surface for the full-security pass: TRUSTED_FLAGS gains --max-output-bytes (numeric only); runJg gains the `excludes` option (narrowing only, anchored, escaped, validated, never from the CLI); countFiles is read-only parsing."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify the batch (97 and 91), then npm run risk-check; the allowlist change means a full security review.",
      "owner": "qa"
    },
    {
      "item": "Separate ticket candidate (not done, out of scope): parseTicket in scripts/dispatch-context.mjs matches only a '**What to build:**' bold line, but real tickets (including 97) use a '## What to build' heading, so the live query to jg carries only the fixed question and no ticket text (the live argv ended '...which tests cover it?\\n\\n'). The two-named-paths skip never fires on real tickets for the same reason. The tests use the bold format.",
      "owner": "orchestrator"
    },
    {
      "item": "The user-installed jg must stay >= 0.7.1 for the context step; older jg now falls back jg-version (named, exit 0).",
      "owner": "orchestrator"
    }
  ]
}
```

## Details

Live AC1 (jg 0.8.0 on PATH, main checkout as root, run from this worktree):

```
$ node scripts/dispatch-context.mjs --ticket organism-infra/97-jg-resource-limit-full-root
{"path":"/home/dhertzell/dimsumden/.scratch/_context/organism-infra/97-jg-resource-limit-full-root.md","bytes":24567,"skipped":null,"fallback":null}
```

The jg argv of that run carried `--exclude .scratch/ --exclude .claude/ --exclude /design/3d/panda-mascot.blend --max-source-bytes 24576 --max-output-bytes 24576` (the only file over 16 MiB). The earlier attempt of the same command (run with --refresh, before the countFiles fix) printed `{"path":null,"bytes":0,"skipped":null,"fallback":"incomplete"}`; that is the finding above. The context file is now in the main checkout under .scratch/_context/ (untracked board data).

Tests: `node --test scripts/dispatch-context-limit.test.mjs scripts/dispatch-context.test.mjs scripts/jg-wrapper.test.mjs scripts/jg.test.mjs` 87/87; full `npm test` (scout) 1729/1729, 0 skipped. No qa test was edited.

Batch note: 91 is at ba57b9a and untouched by this commit (see 91-developer-2.md).
