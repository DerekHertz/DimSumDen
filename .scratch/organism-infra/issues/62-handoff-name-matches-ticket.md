# 62: board handoff refuses a name for another ticket

**Type:** fix

**Priority:** P0

**What to build:** `board handoff <ref> --from <file> --name <name>` publishes to `.scratch/<feature>/handoffs/<name>`. Today a `--name` whose `NN-` prefix is another ticket's number is accepted and silently overwrites that ticket's published handoff (showcase-v1/08's developer passed `--name 01-developer.md` and replaced ticket 01's handoff). Refuse any `--name` whose `NN-` prefix differs from the ref's ticket number, with an error that names the expected prefix. Also refuse to overwrite an existing handoff published under a different claim (someone else's file), keeping 51's own-draft overwrite rule.

**Blocked by:** None

**Status:** resolved

- [ ] `--name` with a different `NN-` prefix is refused and the target file is untouched (test)
- [ ] The error message names the expected prefix, e.g. `08-` (test)
- [ ] Overwriting another claim's existing handoff is refused; overwriting your own draft under the current claim still works (test)

## Comments
- **Incident (orchestrator, 2026-09-30):** showcase-v1/08 developer overwrote then deleted `.scratch/showcase-v1/handoffs/01-developer.md`; restored from git.
- **qa, 2026-09-30:** QA pass (light verify): 877 pass, 0 skipped, tests unchanged since specify, all 3 criteria covered. Only smoke:ui fonts fails (expected).
- **security, 2026-09-30:** Security pass. No critical/high. Low: 1162 same-cell re-publish after re-claim now refused (fails closed); 1151-1169 pre-existing unlocked check-then-write, mtime-based ownership; 1074 unprefixed names skip guard (in scope). gitleaks not installed, pattern grep on changed files clean. Details in handoffs/62-security.md.
