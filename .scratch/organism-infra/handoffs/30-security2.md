# Handoff: security re-check, organism-infra/30

## State

```json
{"ticket":"organism-infra/30-isolation-guard-handoff-writes","cell":"security","mode":"recheck","current_step":"re-check of fix diff b1b9e35..d8124fd: Security pass","artifacts":["apps/organism-infra/board-service.mjs","apps/organism-infra/board-handoff.fix1.test.mjs"],"decisions":["symlink dir escape, overwrite, and --from cap findings all fixed and exercised","fix1 tests 6/6 pass"],"failures":[],"pending":[{"item":"merge proposal","owner":"orchestrator"}]}
```

## Verdict: Security pass

Scope: fix diff only, `apps/organism-infra/board-service.mjs` `publishHandoff`.

| Earlier finding | Status | Evidence |
|---|---|---|
| medium: symlinked handoffs dir escapes board root | fixed | `assertWithinRoot` before and after `mkdir`, plus explicit lstat symlink refusal. Ran it: symlink to an outside dir raised "path escapes the board root", outside dir stayed empty. A symlink to an in-board dir raised "handoffs directory must not be a symlink"; nothing written to issues/. |
| low: silent overwrite of another cell's handoff | fixed | Existing dest must be a regular file whose State cell and mode match; a different cell/mode raised "refusing to overwrite". Symlinked dest refused; outside victim file untouched. Same cell and mode rewrite still works (intended). |
| low: uncapped --from | fixed | lstat rejects symlink, non-regular file, and size over 256 KiB; post-read byte check as backstop. Ran it: symlink, directory, and 300 KB file all refused. |

`board-handoff.fix1.test.mjs`: 6 of 6 pass.

## Residual (informational, no block)

- lstat then readFile leaves a tiny TOCTOU window on `--from`; the caller is the local user, no privilege boundary crossed.
- Same-cell/mode overwrite is allowed by design, so a re-run replaces its own earlier handoff.

## Failed calls

- Bash: one compound setup command (mkdir plus heredocs plus node) was refused by the worktree isolation guard as too complex to verify; I split it into a Write-tool script and a plain `node` run. Genuine guardrail.
