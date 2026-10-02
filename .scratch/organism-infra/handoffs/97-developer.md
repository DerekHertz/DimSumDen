# Handoff: organism-infra/97 developer (batch K) - cause differs from qa's [97] fix tests

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "developer",
  "current_step": "Stopped before changing code for 97. The measured cause is not the root size, so qa's four [97] fix tests (narrow the search root to a subtree) do not fit. No 97 code was written and the tests were not touched. Batch K branch feat/jg-limit-batchK holds only the 91 commit (ba57b9a). npm test on it: 1711 pass, 4 fail, all 4 are the [97] fix tests (981, 982, 984, 993).",
  "artifacts": [],
  "decisions": [
    "Cause 1 (what the ticket saw): a single file over jg's 16 MiB per-file limit. jg reads each candidate file before it checks for binary, so design/3d/panda-mascot.blend (97 MB, tracked, not hidden, not ignored) raises resource_limit and jg exits 2 ('discovery incomplete', Issue resource_limit: 1). Not entry volume (about 1,160 files, limit 100,000), not directory opens (limit 64 at once), not a text file over 1 MB. Proof: on jg 0.8.0, a synthetic tree with a 20 MB binary raised the same message; on this repo, the same search with --exclude design/3d/panda-mascot.blend exits 0 ('148 relevant files.') and without it exits 2 with resource_limit: 1. A subtree that holds no oversize file succeeds (matches the ticket's scripts/ observation), a subtree that holds one fails (design/3d).",
    "Cause 2 (hidden behind cause 1, and what actually makes the live run give jg-exit-1): the installed jg is 0.4.4 (nvm node v22.23.3, @dzhng/jevgrep). Its strict parser has no --exclude, so every call from scripts/jg.mjs (which always adds --exclude .scratch/ --exclude .claude/) dies with 'Unknown option or missing option value', exit 1. jg 0.8.0 (latest on npm) has --exclude, --max-output-bytes and a no-provider 'jg files' command. jg.mjs main() checks MIN_VERSION 0.6.0, but dispatch-context.mjs calls runJg without a version hook, so the old jg is never caught. Narrowing the root cannot fix this: a subtree search through the wrapper still carries --exclude and still exits 1 on 0.4.4.",
    "Cause 3 (next in line once 1 and 2 are cleared): on jg 0.8.0 with the blend excluded, stdout is 91,552 bytes, because --max-source-bytes caps only source blocks. dispatch-context then falls back output-too-large (cap 24,576). Adding --max-output-bytes 24576 gives exit 0 and 24,276 bytes ending 'End context.' (probed directly). The wrapper's allowlist (TRUSTED_FLAGS) only lets --max-source-bytes through.",
    "Live results recorded for AC1 (node scripts/dispatch-context.mjs --ticket organism-infra/97-jg-resource-limit-full-root --refresh, run from the worktree, so board root and search root are the main checkout): installed jg 0.4.4 -> {\"path\":null,\"bytes\":0,\"skipped\":null,\"fallback\":\"jg-exit-1\"}; jg 0.8.0 on PATH (installed under the session scratchpad, not in the repo) -> {\"path\":null,\"bytes\":0,\"skipped\":null,\"fallback\":\"jg-exit-2\"}. AC1 is NOT met on either. Two usage rows kind:jg were appended to the main checkout's usage.jsonl, and the 0.8.0 run and three direct probes sent non-board, secret-scanned repo text to the user's provider.",
    "Why I stopped instead of coding: the correct fix is different in shape from qa's. Per qa's own note ('if the limit is a single file that must be excluded ... say so, qa revises the tests'), I did not edit or bend to the tests. It also widens the wrapper's allowlist (a security-reviewed surface) and depends on the user upgrading jg, so it needs a decision first.",
    "Recommended fix for qa to specify and a developer to build. (a) scripts/jg.mjs: runJg takes an in-process 'excludes' list (never from the CLI), each entry a root-relative path with no leading '-', no '..', anchored with a leading '/' and gitignore-escaped, appended after the fixed .scratch/ and .claude/ excludes; allowlist --max-output-bytes next to --max-source-bytes; the forbidden flags stay forbidden. (b) scripts/dispatch-context.mjs: from the git ls-files listing it already has, stat every non-board file (binaries included, because jg's limit hits before its binary check) and exclude any over 16 MiB (16*1024*1024), and pass --max-output-bytes equal to OUTPUT_CAP. (c) pass the version hook so jg < 0.6.0 (here 0.4.4) falls back 'jg-version' with a clear row instead of a mysterious jg-exit-1; MIN_VERSION may need to rise to whichever release added --max-output-bytes (not checked: 0.8.0 has it, 0.4.4 does not). (d) Tests: a fake jg that exits 2 with resource_limit unless the oversize file is in --exclude args; assert exclusion list built from a listing with a >16 MiB file; assert escaping; assert the existing fallbacks, secret scan and size gate are unchanged. qa's AC2/AC3 guard tests (9 passing) stay valid; only the four [97] fix tests need replacing.",
    "Alternative that needs no code: add a repo .ignore at the root listing design/3d/ or *.blend (jg honours .ignore). It fixes cause 1 only and still needs the jg upgrade and cause 3. Not chosen because the dynamic exclude also covers the next big file."
  ],
  "failures": [
    "AC1 not met (see live results above). The four [97] fix tests stay red by design of this stop."
  ],
  "pending": [
    {
      "item": "User: upgrade jg to a release that has --exclude and --max-output-bytes (npm install -g @dzhng/jevgrep@latest, currently 0.8.0), and run jg auth again if 0.8.0 rejects the saved credentials (the 0.8.0 probes ran with the existing credentials without complaint). Needed for AC1 whatever the code fix.",
      "owner": "user"
    },
    {
      "item": "Orchestrator: decide whether to widen jg.mjs's allowlist (--max-output-bytes) and add the per-call excludes (a security-reviewed change), then have qa revise the four [97] fix tests to match the recommended fix and a developer build it. 91 can merge on its own once qa verifies it, if the four red tests are split out of this branch.",
      "owner": "orchestrator"
    }
  ]
}
```

## Details

Reproduction commands are in the session scratchpad, not the repo. In short: `jg files` (0.8.0, no provider calls) reports 384 eligible files, 169.2 MiB, of which design/ is 159.4 MiB; the 97 MB design/3d/panda-mascot.blend is the only file over 16 MiB (next largest tracked file is 5.2 MB).

Worth knowing for the fix: jg's per-file limit is `maxFileBytes = 16 * 1024 * 1024` in filesystemDefaults, applied in readBytes before the binary and private-key checks. The 0.4.4 source also shows resource_limit for more than 100,000 entries seen, 64 open directories at once, and a directory still queued after discovery stops; none applies here.
