# Handoff: queue/03-admission-gate (security)

```json
{
  "ticket": "queue/03-admission-gate",
  "cell": "security",
  "current_step": "Security pass on b9b5403: no critical, high or medium findings; 2 low notes. gitleaks clean.",
  "artifacts": [],
  "decisions": [
    "Path safety: spec headings are read by loadSnapshot from directories named by readdir (FEATURE_RE, Dirent.isDirectory so symlinked dirs are skipped) and spec.md via lstat isFile (symlink not followed, 1 MB cap). checkAdmission is pure; a spec:<feature> in ticket text is only an Object.hasOwn key lookup after a FEATURE_RE check. No ticket text reaches a file path.",
    "Header injection: createTicket rejects newline/control/bidi in serves, enum-validates class/origin/p0Reason, caps serves at 300. Loader reads Class/Serves/P0-reason only above the first '## ' heading (test 16).",
    "Reasons written to the park comment and events.jsonl pass through quoted() (printable ASCII, 60 chars) or are fixed text/regex-matched timestamps/FEATURE_RE-checked names; the park path adds sanitizeCommentText and checkArgLength.",
    "board gate dry run is read-only; --apply uses setOffRelay, which refuses claimed or non-ready tickets, and a BoardError per ticket is reported and does not stop the rest.",
    "Regexes (SPEC_FORM_RE, INCIDENT_FORM_RE) are anchored and linear; no ReDoS. No dependency, workflow or lockfile change. gitleaks origin/main..b9b5403: no leaks (2 commits). 33/33 admission-gate tests pass."
  ],
  "failures": [],
  "pending": []
}
```

## Findings

- apps/organism-infra/frontier-queue.mjs:~146 (finding form), low: `Serves: finding:<ref>` is satisfied by any existing ticket, including the ticket itself, so any ticket author can pass the Serves rule. The gate is a mechanical filter, not an authorization boundary; the spec-form and incident-form checks are real. Consider rejecting a self reference if the gate is meant to resist a misbehaving agent.
- apps/organism-infra/frontier-queue.mjs:threeIncidentsOfOneTool, low: "same cause" is approximated by same `tool`; a ticket author can cite three real incidents of one tool that have different causes. Already flagged by the architect; no security impact beyond gate bypass for pipeline tickets.
