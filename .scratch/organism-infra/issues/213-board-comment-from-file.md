# 213: board comment reads its text from a file

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Retro 2026-10-09: the worktree isolation guard refused `board comment` twice (organism-infra/202 security, 209 qa verify) because the quoted comment text held parentheses or words like `git status`, which the guard's parser read as commands. Each refusal cost a retry with reworded text.

## What to build

Add `--from <file>` to `npm run board -- comment <ref>`: the comment text is read from the file instead of a positional argument, with the same placement rules as `board handoff --from` (a draft under `/tmp` or the main checkout's `.scratch/`, never a symlink, never inside a git worktree). Positional text keeps working. Passing both is an error. Update the `organism-protocol` line that tells cells how to comment so it says to draft long or punctuated text to a file and pass `--from` (gated patch if the developer can't edit `.claude/`).

## Acceptance criteria

- [ ] `board comment <ref> --from <file>` appends the file's text as the comment; `--as` and `--verdict` still work with it.
- [ ] Positional text still works; both positional text and `--from` exits 2 with a clear message.
- [ ] `--from` refuses a symlink, a missing file, and a path inside a git worktree, with the same messages as `board handoff --from`.
- [ ] The cell-facing instruction names `--from` for comments.

## Comments
