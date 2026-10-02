# 108 security review: apply-gated

Verdict: Security pass (with one medium and two low non-blocking comments). Range reviewed: origin/main..bb59eb6 (branch feat/108-apply-gated). gitleaks: no leaks in 2 commits. No dependency changes (package.json adds one script line only).

```json
{
  "ticket": "organism-infra/108-apply-gated-script",
  "cell": "security",
  "current_step": "Security review complete: pass-with-nits. Probed scripts/apply-gated.mjs in throwaway /tmp repos.",
  "artifacts": ["scripts/apply-gated.mjs", "/tmp/sec108/probe.mjs", "/tmp/sec108/toctou.mjs"],
  "decisions": ["Medium TOCTOU and low display findings do not block per genome; file as follow-up"],
  "failures": [],
  "pending": [
    {
      "item": "Optional follow-up ticket: read patch once and feed the same bytes to every git call (finding 1); extend printable() (finding 2)",
      "owner": "orchestrator"
    }
  ]
}
```

## Verified safe (probed)

- No shell: only `execFileSync("git", [...])`, argument arrays, no `shell:` option. A subject like `--amend $(touch X) \`touch Y\`` is committed literally, nothing runs.
- Argument injection: every git call that takes a file or path uses `--`, plus `--literal-pathspecs`. Patch files named `-n.patch`, paths named `-rf` and `:(top)glob*.txt` were applied as plain names. Patch file path is absolute anyway.
- Writes outside repo or into .git: git apply itself rejects `.git/hooks/x`, `.GIT/`, `sub/.git/`, `.git./`, `../x` and absolute paths ("invalid path"), and refuses writes "beyond a symbolic link" both for a symlink added in the same patch and for a committed symlink. Nothing was written outside the root in any probe. No core.hooksPath is set, so a patch cannot plant a hook that the commit then runs.
- Symlinks in gated/: `listPatches` uses `Dirent.isFile()`, which is false for symlinks, so a symlinked `*.patch` is ignored (probed). `.sh`/`.mjs` in gated/ are ignored.
- `--root`: it is an operator-supplied path, default cwd. A subdirectory of a repo fails safe (commit fails, patch reverted, nothing on disk). A different repo is applied to, but the target is printed before the prompt.
- Commit scope: `add -A -- <paths>` and `commit -- <paths>` limited to the paths parsed from the patch (including rename sources); a dirty-path pre-check refuses to sweep in other work.
- Tests: `child_process` appears only in `scripts/apply-gated.test.mjs` and `scripts/apply-gated.extra.test.mjs` (git setup, spawning the script, one `chmod +x` on a temp file). The script is not imported by anything at runtime.

## Findings

1. Medium: scripts/apply-gated.mjs:163-205 (re-reads the patch file after the prompt). The patch is read for `--numstat`, `--check`, display, `mailinfo`, then again for `git apply` after an unbounded wait for `y`. A cell or process that can write `gated/` can swap the file between review and `y`. Probed: after the prompt I replaced a benign one-file patch with one that keeps the approved path but changes its content and adds `extra.txt`. Result: the swapped content was committed under `benign.txt`, `extra.txt` was written to the tree uncommitted, and the patch was moved to applied/ with exit 0. Fix: `readFileSync` the patch once, and pass those bytes via stdin (`git apply -` / `--check -`, `mailinfo`) for every call; optionally compare a sha256 before apply. Medium because the gate protects `.claude/` and `CLAUDE.md` from cells, and cells do write gated/. Not blocking: the user reviews at the terminal, and the window requires a hostile writer.
2. Low: scripts/apply-gated.mjs:52 (`printable`). The regex strips C0 and DEL but not C1 (U+0080-U+009F; U+009B is CSI in some terminals) or bidi controls (U+202A-202E, U+2066-2069). Probed: U+009B and U+202E reach the terminal in both the patch body and the file name line. Bidi overrides can make the reviewed diff read differently from what applies, which undermines the review gate. Fix: also replace `[\u0080-\u009f‪-‮⁦-⁩​-‏]`.
3. Low: scripts/apply-gated.mjs:205 (commit runs repo hooks). A patch that edits a tracked hook script is only dangerous if `core.hooksPath` points at a tracked dir; none is set today. Note for the future if hooks are added: the review prompt is the only gate.

## Comments

Security pass.
