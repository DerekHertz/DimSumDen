```json
{
  "ticket": "dimsumden-ui-v0/06-bridge-requests",
  "cell": "qa",
  "mode": "specify",
  "current_step": "22 failing tests committed on tests/dimsumden-ui-v0-06-bridge-requests (7 more pass vacuously, see notes)",
  "artifacts": ["apps/bridge/bridge-requests.test.mjs", "scripts/requests.test.mjs"],
  "decisions": [
    "Bridge tests reuse bridge-fixture.mjs unchanged: dispatch gate ref fx/02-ready-p0, merge gate ref fx/04-review (its fixture request is pending until the test appends a handled line)",
    "scripts/requests.mjs is tested as a CLI with ORGANISM_ROOT set to a temp root (same convention as scripts/metrics.mjs); --list is asserted by substring (id, kind, ref), not exact format",
    "Error statuses follow ADR 0011 decision 6 and decision 2 hardening: 400/404/409/413, and 403 for bad Content-Type, Origin, Host"
  ],
  "failures": [],
  "pending": [
    {"item": "implement POST /requests in apps/bridge/server.mjs", "owner": "developer"},
    {"item": "add apps/bridge/requests-log.mjs (shared parser) and scripts/requests.mjs (--list, --handle <id> --outcome <text>)", "owner": "developer"}
  ]
}
```

# Handoff: 06 qa specify

## Criterion to test map
- "A valid POST appends exactly one line; an invalid one writes nothing": bridge-requests.test.mjs, describe "POST /requests: valid" (201, id and ts assigned, one line appended equal to the response, note optional, snapshot shows the pending request, merge accepted once earlier one is handled) and describe "invalid writes nothing" (400 kind/JSON/note, 404 ref, 409 gate mismatch / no gate / already pending / duplicate, 413 over 4 KB, 403 Content-Type / Origin / Host; each asserts the file is byte-identical).
- "requests.mjs --handle marks handled and --list hides it": scripts/requests.test.mjs (list shows pending and hides handled; handle appends exactly one `{handled, ts, outcome}` line without editing earlier lines; handled id disappears from --list; unknown id, already-handled id, missing --outcome exit non-zero and write nothing).
- Nothing executes: no test needed (bridge has no Board write path); not human-verified either, covered by absence.

## Red state
22 of 29 fail: POST /requests returns 404 (no route) and scripts/requests.mjs is MODULE_NOT_FOUND. Not setup errors.
7 pass vacuously today and become real guards once the feature exists: bridge 404 x3 (empty board, missing ref, resolved ticket), foreign Host 403, and 3 CLI negative cases (non-zero exit and file unchanged).

## Notes for developer
- Interface choices that the ADR leaves open: CLI reads root from ORGANISM_ROOT (fallback cwd); `--list` prints id, kind and ref of each pending request; a missing requests file is exit 0 with nothing listed.
- Foreign Host is already 403 (existing hardening); Origin and Content-Type checks are new for POST.
- Not covered: concurrent POST race on the duplicate check; ADR mentions no test for it.

## Comments
None.
