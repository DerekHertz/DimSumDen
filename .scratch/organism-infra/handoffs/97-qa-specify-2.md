# Handoff: organism-infra/97 qa specify, round 2 (batch K)

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Re-specified the four [97] fix tests to the approved fix. Committed on feat/jg-limit-batchK as 20afbaf (parent ba57b9a, 91 untouched). scripts/dispatch-context-limit.test.mjs now has 23 tests: 11 red for the missing feature, 12 green (9 original guards kept byte-for-byte, plus 3 new guards). npm test: 1725 tests, 1714 pass, 11 fail, 0 skipped; every failure is a [97] fix or [97] jg.mjs test. Each red test fails on an assertion about the missing behavior (no context file, missing excludes, flag refused, wrong fallback), not on setup.",
  "artifacts": [
    "scripts/dispatch-context-limit.test.mjs",
    "scripts/dispatch-context.test.mjs (one fixture line: cliEnv.searchCalls also ignores --version calls)"
  ],
  "decisions": [
    "Interface pinned for the developer (a design call qa made; change it only with qa): (1) scripts/jg.mjs runJg takes an in-process option `excludes: string[]` of ROOT-RELATIVE FILE PATHS as they appear in git ls-files (for example 'design/3d/panda-mascot.blend', '-huge.blend', 'a[1]*.blend'). runJg itself anchors each with a leading '/' and gitignore-escapes it (backslash before \\ * ? [ ] and the like), and appends `--exclude <pattern>` after the fixed `.scratch/` and `.claude/` pair (those two stay the first two exclude values). No pattern may start with '-'. runJg refuses (throws an error with a string `kind`, run never called) an entry that is empty, absolute, has a '..' segment, or is not a string. The CLI (node scripts/jg.mjs) still refuses --exclude. (2) TRUSTED_FLAGS gains --max-output-bytes (numeric, both '--flag value' and '--flag=value'); every other in-process flag stays refused with kind 'flag'. (3) dispatch-context.mjs: from the git listing it already reads, stat every non-board file INCLUDING binaries (the oversize file is a .blend that the 5 MB gate and secret scan deliberately skip) and pass every file over 16*1024*1024 bytes as `excludes`; pass --max-output-bytes 24576 (OUTPUT_CAP) next to --max-source-bytes. Tests use a file of 16 MiB + 1 KiB and avoid the exact-16 MiB boundary.",
    "Version check (AC from the orchestrator comment): wired in the CLI path (main), NOT inside buildContext's `run` seam. The library default does no check, because the 87 tests count jg calls through `run` (`f.searches().length === 1`) and their fakes answer any jg call with a search result. In the CLI, run `jg --version`; a parseable version below jg.mjs's MIN_VERSION gives fallback 'jg-version' (exit 0, no file, no search call, a kind:jg usage row with fallback 'jg-version', ticket set). An unreadable or failing --version is NOT a verdict: the search still runs, so failures surface as before (jg-exit-N, jg-missing) and the existing CLI fakes (which answer --version like a search) stay green. MIN_VERSION may need to rise to the release that added --max-output-bytes; the tests only use 0.4.4 (too old) and 0.8.0 (fine), so the developer picks the floor from jg's changelog.",
    "I changed one line of the existing scripts/dispatch-context.test.mjs: the CLI fixture cliEnv.searchCalls now filters out `--version` calls as well as `files`, because the CLI will start spawning `jg --version` and the 'second hop reuses the file' test counts search calls. No assertion changed. The same filter is in my file's cliEnv. Do not edit tests to get green beyond this.",
    "Test model: the fake jg is a plain function jgModel(fs, path, root, patterns) that walks the repo like jg (hidden entries skipped, --exclude values read as gitignore patterns: slash means anchored, backslash escapes, * ? [..] wildcards) and reports files over 16 MiB that stay visible; the fake raises resource_limit (exit 2) while any is visible and prints 91,552 bytes unless --max-output-bytes is given. The CLI fake pastes jgModel.toString() into a script on PATH; the oversize files are sparse (truncate), so no real megabytes are written. The model was checked by hand: escaped anchored patterns hide exactly the target files, unescaped ones miss the weirdly named files and hide their look-alikes.",
    "Criterion-to-test map. AC1 (live run returns non-null path, no fallback, recorded in the handoff): human-verified at the developer stage, needs the real jg 0.8.x and the user's key (do not run jg against the live repo from qa); seam stand-ins, all red now: '[97] fix: a repo holding a file over 16 MiB still gets a context file, no fallback, within the 24 KB cap', '[97] fix: every file over 16 MiB is excluded by an anchored pattern, and files under the limit are not', '[97] fix: a file name with glob or escape characters is excluded exactly, not its look-alikes', '[97] fix: jg is given --max-output-bytes 24576, so a long answer is capped ...', '[97] fix: CLI against jg 0.8.0 on a repo with a 97 MB .blend returns a non-null path ...', '[97] fix: CLI treats an unreadable --version as no verdict and still searches'. Approved scope item 'per-call excludes for files over 16 MiB': the first three plus '[97] jg.mjs: excludes are appended after .scratch/ and .claude/, anchored and escaped ...' and '[97] jg.mjs: an exclude that is empty, absolute, climbs out of the root, or is not a string is refused ...'. Scope item '--max-output-bytes in the allowlist': '[97] jg.mjs: --max-output-bytes is an allowed in-process flag and is forwarded ...' (red) and '[97] jg.mjs: --max-output-bytes needs a byte count, and the other flags stay refused' (green now, guard). Scope item 'version check wired in': '[97] fix: CLI with jg 0.4.4 (no --exclude) falls back jg-version ...' and the 'unreadable --version' test. AC2 (jg still fails, falls back exactly as before): the 6 '[97] AC2' tests, green now, kept unchanged. AC3 (secret scan and size gate unchanged): existing dispatch-context.test.mjs and jg.test.mjs stay green, the 2 '[97] AC3' tests (green, kept), '[97] fix: a secret in the search output is still refused as secret-in-output once the oversize file is excluded' (red), and '[97] fix: a repo with no file over 16 MiB adds no excludes beyond .scratch/ and .claude/' plus '[97] jg.mjs: the command line still refuses --exclude' (new guards, green now). Also kept green: '[97] fix: every search call keeps the wrapper's excludes and the 24 KB output cap'.",
    "Security note for the full-security pass: the allowlist widening and the new excludes option are the reviewed surface. The tests pin that excludes can only narrow (anchored, escaped, no leading '-', no '..', no absolute path), never come from the CLI, and that forbidden flags stay forbidden."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement to turn the 11 red tests green without editing tests: jg.mjs (excludes option with validation, --max-output-bytes in TRUSTED_FLAGS), dispatch-context.mjs (stat every non-board file incl. binaries, pass excludes and --max-output-bytes 24576, wire `jg --version` in main with the tolerant rule above). Wait until `jg --version` on the user's PATH reports 0.8.x before the live AC1 run (orchestrator comment). Then run `node scripts/dispatch-context.mjs --ticket <a code ticket> --refresh` against this repo and record the printed JSON (path non-null, fallback null) and bytes in your handoff. Never run it from qa.",
      "owner": "developer"
    },
    {
      "item": "Full security review (allowlist change, per the orchestrator).",
      "owner": "security"
    }
  ]
}
```

## Details

New file layout: the helpers (`jgModel`, `sizedOutput`, `excludeValues`, `jg083`, `bigRepo`, `pandaRepo`) sit where the old [97] fix tests were, above the kept guard `every search call keeps the wrapper's excludes and the 24 KB output cap`. The CLI block (`modelEnv`, `cliModel`) follows the first CLI helpers. The jg.mjs seam tests are at the end of the file. The nine original guards (AC2 x6, AC3 x2, the excludes-and-cap guard) are unchanged.

Full-suite red list (all mine): 981, 982, 983, 985, 987, 988, 989, 998, 999, 1001, 1002 in `npm test`.
