# Handoff: 87 developer

```json
{
  "ticket": "organism-infra/87-dispatch-context-script",
  "cell": "developer",
  "current_step": "scripts/dispatch-context.mjs implemented; all 28 dispatch-context tests and the jg tests pass; npm test 1425 pass, 0 fail; committed e7dfb64 on feat/dispatch-context87. The .claude diff is below for the user to apply.",
  "artifacts": [
    "scripts/dispatch-context.mjs (new)",
    "scripts/jg.mjs (runJg gains in-process `flags`)",
    "scripts/dispatch-context.test.mjs (5 MB test changed, header comment updated)",
    "scripts/jg.test.mjs (2 tests appended)",
    "branch feat/dispatch-context87, commit e7dfb64"
  ],
  "decisions": [
    "5 MB check: installed jg has no `files` command, so buildContext sums byte sizes of `git ls-files -z` output (excluding .scratch/ and .claude/) through an injected `trackedBytes({root, files})` seam; skip above 5242880. ADR 0014 line 28 is unchanged; deviation is noted in a ticket comment.",
    "runJg got a trusted in-process `flags` option placed after the two excludes and before the query. It refuses FORBIDDEN_FLAGS and any --exclude. The CLI never passes it, so CLI behaviour is unchanged.",
    "buildContext reuses runJg through a spy `run` that stashes the raw {stdout, stderr, exitCode, timedOut} or the thrown error, so fallback reasons (jg-missing, not-authenticated, timeout, jg-exit-N) are classified from the raw result.",
    "Order: type skip, named-path skip, git ls-files, 5 MB skip, secret scan of tracked files (secret-in-root), jg, then End context. / secret-in-output / 24 KB cap checks.",
    "Code types: feature, task, fix, bug, chore, refactor. Everything else skips.",
    "Only a successful file is reused across hops (CLI). A skip or fallback leaves no file, so the next hop reruns the script (and jg after a fallback, up to 90 s again). Flag to orchestrator if that proves costly.",
    "CLI default search root is the main checkout ($ORGANISM_ROOT / resolveRoot). A missing ticket file or bad ref exits 2."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify: check the changed 5 MB tests listed below and the jg.mjs flags extension; run risk-check. User applies the .claude diff below.",
      "owner": "qa"
    }
  ]
}
```

## Changed tests (for qa verify)

Only the 5 MB boundary was changed in `scripts/dispatch-context.test.mjs`:

1. The test `skip: jg files reports more than 5 MB eligible; exactly 5 MB proceeds` was replaced by `skip: tracked files total more than 5 MB; exactly 5 MB proceeds`. The boundary is kept: `trackedBytes: async () => 5242881` skips with no jg search call and no file; `5242880` proceeds and returns a file. The fake's `files` option is no longer used for this test.
2. New test `the size check is handed tracked files only, not .scratch/ or .claude/`: the `trackedBytes` seam receives `["src/a.mjs"]` for a repo that also tracks `.scratch/big.md` and `.claude/s.md`.
3. Header comment: the `jg files:` line now describes the `trackedBytes` seam.

No other test in that file was edited or removed. Added to `scripts/jg.test.mjs` (appended, nothing edited): `runJg forwards in-process flags between the excludes and the query` and `runJg refuses an in-process flag that widens the filter or adds an exclude`.

## Design notes

- Over-cap jg output becomes the fallback `output-too-large` (no file).
- Fallback reasons: jg-missing, not-authenticated, timeout, jg-exit-N, incomplete (also exit 0 with no `## ` files), secret-in-output, output-too-large, secret-in-root, git-ls-files-failed, refused-<kind> (runJg refused, e.g. a secret in the question).
- The secret scan reads each tracked file outside `.scratch/` and `.claude/` with `hasSecret`; untracked and gitignored files are never listed, so they do not block.
- The real `jg` was never run. The CLI tests use a fake jg on PATH with HOME redirected.
- security should review the `secret-in-root` check (ADR 0014 decision 5).

## .claude diff (user applies; I did not edit .claude/)

Scout's pull line already exists (`.claude/agents/scout.md` line 23, ticket 80), so no scout edit is needed. The only file is `.claude/agents/orchestrator.md`, two edits.

Edit 1: in "## Code relay", insert this paragraph between the line `Every code ticket runs through these stages, one cell at a time per ticket:` (plus its blank line) and `1. \`qa\` in \`specify\` mode ...`:

```diff
 Every code ticket runs through these stages, one cell at a time per ticket:
 
+0. Context step (ADR 0014; ticket 87), once per ticket before the first stage that starts cold. Run `node scripts/dispatch-context.mjs --ticket <feature>/<NN-slug>`. It prints one JSON line `{path, bytes, skipped, fallback}`, exits 0 whatever happens (2 only for bad arguments), and reuses an existing file, so every later hop is free. Never read the file yourself. When `path` is non-null, add this line to the dispatch prompt of `architect`, `qa` in `specify` mode and `developer` (fix rounds included), and to no other cell: `Start-here context: <path> (jg output; read before searching; may be incomplete or stale)`. When `path` is null (skipped, or a fallback such as `jg-missing`, `not-authenticated`, `timeout`, `secret-in-root`), add nothing and dispatch as before. Run it with `--refresh` only after the ticket's What to build text changes.
 1. `qa` in `specify` mode writes failing acceptance tests on a tests branch.
```

Edit 2: in "## Rules", first bullet (the usage-rows one), insert this sentence immediately before ``` `scripts/jev.mjs` appends its own `{"kind":"jev",...}` rows ```:

```diff
+`scripts/dispatch-context.mjs` and `scripts/jg.mjs` append their own `{"kind":"jg",...}` rows; never write them by hand.
```

(`git apply --check` passed on the equivalent full patch, generated against main's orchestrator.md at index dd1db2e. Apply by hand or ask the orchestrator to regenerate it.)
