# Security review: organism-infra/95 (batch J with 92)

Verdict: Security pass. Branch feat/context-gate-batchJ at 431728d, reviewed against origin/main (4 files, scripts only; no dependency or lockfile change, no workflow change).

```json
{
  "ticket": "organism-infra/95-context-size-gate-counts-binaries",
  "cell": "security",
  "current_step": "Security review done: pass, no critical or high findings; two low notes for the orchestrator.",
  "artifacts": ["scripts/dispatch-context.mjs", "scripts/jg.mjs"],
  "decisions": [
    "gitleaks detect over origin/main..431728d: 2 commits, no leaks.",
    "node --test scripts/dispatch-context.test.mjs scripts/jg.test.mjs: 53 pass, 0 fail.",
    "Binary exemption (extension list or NUL in first 8 KB) applies to both the size gate and the secret scan; the jg-output secret scan still runs as a backstop."
  ],
  "failures": [],
  "pending": [
    {"item": "Optional follow-up: confirm jg's own binary detection matches isBinary() so no file jg sends escapes the secret-in-root scan.", "owner": "orchestrator"}
  ]
}
```

## Findings

- scripts/dispatch-context.mjs:25-45 (isBinary), low: a text file with a binary extension (e.g. .bin, .pdf) or a NUL in its first 8 KB is dropped from the secret-in-root scan. If jg's own binary test is narrower than this one, such a file could reach jg unscanned. The secret-in-output scan remains a backstop. Contrived; not blocking.
- scripts/dispatch-context.mjs:86-90, low: the listing now includes untracked, non-ignored files and isBinary()/readFileSync follow symlinks. An untracked symlink to a FIFO or device could hang the open (DoS only, no disclosure). Tracked symlinks already had this exposure. Not blocking.

## Checked and fine

- jg.mjs checkTrustedFlags is now an allowlist (--max-source-bytes, digits only); inline, missing and empty values are refused. Tightening.
- Atomic write (tmp + rename) replaces rather than follows a symlink at the target, and the temp file is removed on failure. Tmp name is pid-predictable and written without "wx" (low, same-user only).
- No shell: all spawns use argv arrays. No new network exposure. No secrets in diff.
