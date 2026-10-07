# 168 security handoff

```json
{
  "ticket": "organism-infra/168-serialize-full-test-runs",
  "cell": "security",
  "current_step": "Security pass. Reviewed diff 1927f81 against origin/main by hand (3 files); gitleaks clean; no dependency or CI changes.",
  "artifacts": ["scripts/test-lock.mjs", "package.json"],
  "decisions": [
    "Pass: spawn runs cmd with an args array and no shell; argv and env are developer-controlled.",
    "Pass: lock is created with a hard link of a fully written temp file (atomic, EEXIST on contention); temp name carries a random token so it is not guessable; a pre-planted symlink at the lock path only yields EEXIST.",
    "Low, non-blocking: scripts/test-lock.mjs:70-81 stale takeover is check-then-rename, so a process that took over between the read and the rename can have its fresh lock moved aside. Result is two concurrent full runs, which is the flakiness the ticket targets, not a security impact.",
    "Low, non-blocking: scripts/test-lock.mjs:37-45 pid liveness has no start-time check, so a reused pid keeps a stale lock until the 15 minute bound.",
    "Low, non-blocking: scripts/test-lock.mjs:106 default lock path is a fixed name in the shared OS temp dir; another local user could hold it and make npm test wait to the bound (local denial of service only; single-user WSL host)."
  ],
  "failures": [],
  "pending": []
}
```

Verdict: Security pass. gitleaks detect over origin/main..1927f81: no leaks (2 commits). No dependency, lockfile or .github changes.
