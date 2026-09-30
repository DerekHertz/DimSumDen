# 62: board handoff refuses a name for another ticket

**Type:** fix

**Priority:** P0

**What to build:** `board handoff <ref> --from <file> --name <name>` publishes to `.scratch/<feature>/handoffs/<name>`. Today a `--name` whose `NN-` prefix is another ticket's number is accepted and silently overwrites that ticket's published handoff (showcase-v1/08's developer passed `--name 01-developer.md` and replaced ticket 01's handoff). Refuse any `--name` whose `NN-` prefix differs from the ref's ticket number, with an error that names the expected prefix. Also refuse to overwrite an existing handoff published under a different claim (someone else's file), keeping 51's own-draft overwrite rule.

**Blocked by:** None

**Status:** claimed

- [ ] `--name` with a different `NN-` prefix is refused and the target file is untouched (test)
- [ ] The error message names the expected prefix, e.g. `08-` (test)
- [ ] Overwriting another claim's existing handoff is refused; overwriting your own draft under the current claim still works (test)

## Comments
- **Incident (orchestrator, 2026-09-30):** showcase-v1/08 developer overwrote then deleted `.scratch/showcase-v1/handoffs/01-developer.md`; restored from git.
