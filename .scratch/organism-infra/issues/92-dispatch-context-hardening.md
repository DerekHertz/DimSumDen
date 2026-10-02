# 92: dispatch-context hardening (from 87 security review)

**Type:** task

**Priority:** P3

**Blocked by:** 87 merged

**Status:** resolved

## What to build

Follow-ups from the 87 security review (`.scratch/organism-infra/handoffs/87-security.md`). All non-blocking.

- **M1 (medium):** `scripts/dispatch-context.mjs` root secret scan uses `git ls-files`, so untracked, non-ignored files with secrets are not scanned, yet `jg` searches them. Add `--others --exclude-standard` to the listing (keep the `.scratch/` and `.claude/` exclusions for the size check). The secret-in-output check still catches leaks in the output, so this is defense in depth.
- **L1 (low):** `checkTrustedFlags` in `scripts/jg.mjs` is a denylist. Make it an allowlist of `--max-source-bytes`.
- **L2 (low):** the context-file cache write is non-atomic; write to a temp file and rename.

## Acceptance criteria

- [ ] A secret in an untracked, non-ignored file makes buildContext fall back with `secret-in-root` and never call jg (test)
- [ ] `runJg` with any in-process flag other than `--max-source-bytes` is refused (test)
- [ ] The context file is written by rename, so a reader never sees a partial file (test)

## Comments

- **orchestrator, 2026-10-01:** Filed after the 87 security pass. M2 (the ticket's "What to build" text goes to the jg provider) is allowed by ADR 0014 and needs no ticket.
- **orchestrator, 2026-10-02:** batch J = organism-infra/92-dispatch-context-hardening + organism-infra/95-context-size-gate-counts-binaries (same file, same listing). One relay, one branch, one PR (user approved 2026-10-02).
- **qa, 2026-10-02:** QA pass (batch J, full verify, 431728d): 1657/1657, tests unchanged since specify, AC1-3 mapped to passing tests.
- **security, 2026-10-02:** Security pass (batch J). No critical/high. Low: dispatch-context.mjs:86-90 FIFO symlink hang; :205-215 tmp name predictable, no wx flag. gitleaks clean. See 92-security.md.
