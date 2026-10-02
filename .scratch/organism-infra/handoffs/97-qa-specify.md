# Handoff: organism-infra/97 qa specify (batch K)

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch K tests committed on tests/jg-limit-batchK (c2aec2a, base 0a7198d). New file scripts/dispatch-context-limit.test.mjs: 13 tests, 4 fail for the missing feature (all tagged [97] fix), 9 pass now and are regression guards (AC2, AC3). Rest of npm test is green (1703 pass, 12 fail, all 12 are batch K red tests).",
  "artifacts": [
    "scripts/dispatch-context-limit.test.mjs"
  ],
  "decisions": [
    "I could not find the root cause by reading, and did not run jg on the full repo (it sends content to the provider). In jevgrep's dist/bin/index.js, resource_limit is raised for: more than 100,000 entries seen, a directory open-handle cap, a single text file over 1 MB, and directories left unvisited after discovery. In this worktree the only tracked files over 1 MB are binaries (panda-mascot.blend 97 MB, renders/*.png, panda.glb), so the likely trigger is one of those counted by discovery, or entry volume. The developer should confirm with a jg run on the worktree before choosing a fix.",
    "The [97] fix tests pin the one design the ticket's first example names: a fake jg fails with the resource_limit message (exit 1, 'discovery incomplete', Issue \"resource_limit\": 1) when its search root argument is the whole repo root and succeeds when aimed at any subtree. They assert: a file and no fallback; the final search root is strictly inside the repo and not in a dot-directory; every call keeps --exclude .scratch/ and .claude/, --max-source-bytes 24576 and the 90 s timeout; and a CLI run through a fake jg on PATH returns a non-null path. How the subtree is chosen is left to the developer (the directory of the path the ticket names, top-level source directories, several calls merged, and so on). The fixture's ticket names one existing path (scripts/dispatch-context.mjs), so a narrowing keyed on named paths and one keyed on top-level directories both pass.",
    "If the developer finds the limit is a jg flag or a single file that must be excluded, rather than the root size, these four tests do not fit. Do not bend the code to the tests: say so in the handoff, and qa revises the tests with the developer. Note jg.mjs only allows --max-source-bytes as an in-process flag (TRUSTED_FLAGS), so any new flag needs the allowlist widened, and the wrapper's rules (never --hidden, --no-ignore, --include-dependencies, --include-sensitive) must stay.",
    "AC2 tests are regression guards that pass today: resource_limit failures with exit 1 and exit 2 give jg-exit-1 and jg-exit-2 (no file, row.bytes 0, skipped null), a missing jg gives jg-missing, a timeout gives timeout, a CLI run exits 0 with fallback jg-exit-1 and one kind:jg usage row, and the step makes at most 5 jg calls for a 3-directory repo when every attempt fails (so a retry or per-directory design cannot loop or fan out without bound).",
    "AC3: existing tests stay green, plus guards that a secret in an untracked file still gives secret-in-root with zero jg calls, over 5 MB of text still skips with 'root over 5 MB eligible' with zero jg calls, and (red until the fix) a secret in the narrowed search's output is still refused as secret-in-output.",
    "AC1 (a live run against this repo returns a non-null path, no fallback) is human-verified: not tested, because it needs the real jg and the user's key."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Find the actual limit (a jg run on the worktree or its subtrees, jg docs), make scripts/dispatch-context.mjs stay inside it, keep the secret scan, size gate and fallback contract. Then run node scripts/dispatch-context.mjs --ticket <a code ticket> against this repo and record in your handoff the printed JSON (path non-null, fallback null) and the bytes. Never loosen the tests. If the limit is not the root size, report it instead of bending to the [97] fix tests.",
      "owner": "developer"
    }
  ]
}
```

## Criterion-to-test map

Tests are in `scripts/dispatch-context-limit.test.mjs`.

1. Run against this repo returns a non-null `path` with no `fallback` (recorded in the handoff): human-verified. Seam stand-ins, red now:
   - "[97] fix: when jg hits resource_limit on the full root, the context step still returns a context file with no fallback"
   - "[97] fix: the search that succeeds is aimed at a subtree of the repo, never at .scratch/ or .claude/"
   - "[97] fix: CLI with a jg that rejects the full root returns a non-null path, no fallback, and writes the context file"
   - "[97] fix: a secret in the narrowed search's output is still refused as secret-in-output"
   - "[97] fix: every search call keeps the wrapper's excludes and the 24 KB output cap" (passes now; guard)
2. When jg still fails, the run falls back exactly as before (all pass now; guards):
   - "[97] AC2: jg failing on every root (resource_limit, exit 1) ... names jg-exit-1, as before"
   - "[97] AC2: jg failing on every root (resource_limit, exit 2) ... names jg-exit-2, as before"
   - "[97] AC2: when every attempt fails the step gives up after a bounded number of jg calls"
   - "[97] AC2: jg not installed after the change still falls back jg-missing"
   - "[97] AC2: a jg timeout after the change still falls back timeout"
   - "[97] AC2: CLI with jg failing on every root exits 0, writes no context file, prints a named fallback and logs a jg row"
3. Secret scan and size gate unchanged:
   - Existing `scripts/dispatch-context.test.mjs` stays green (note its test "jg is asked the fixed question plus What to build, searches the root" expects the root among the args on a ticket that names no paths; it is green now and must stay so).
   - "[97] AC3: a secret in an untracked, non-ignored file still falls back secret-in-root and jg is never called"
   - "[97] AC3: over 5 MB of tracked text is still skipped with the 'root over 5 MB eligible' reason and jg is never called"
