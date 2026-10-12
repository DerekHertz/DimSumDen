```json
{"ticket": "agent-os/07-grant-hardening", "cell": "qa", "mode": "verify", "current_step": "Light verify done: steps 1, 2, 4 pass; criterion 6 reason location needs full verify. No verdict written.",
 "artifacts": ["/home/dhertzell/dimsumden/.scratch/agent-os/handoffs/07-qa-verify.md", "apps/bridge/cells/grants-hardening.test.mjs (unchanged since c68ddad)"],
 "decisions": ["Used the saved suite output /tmp/07-tests.txt per the dispatch; did not re-run npm test. It shows 4225 pass, 0 fail, 0 skipped, 0 todo, and includes the grants-hardening subtests, so it ran with the feature present.", "Criterion 6 low finding 'ticket directory read' and the Bash quoting note have their reasons only in the developer handoff (07-developer-2.md), not in the ticket's ## Comments. Judging whether that counts as recorded, and whether the reasons hold, is judgment, so escalate to full verify."],
 "failures": ["Tool Grep: 'No such tool available: Grep' when reading /tmp/07-tests.txt. Used grep via Bash instead."],
 "pending": [{"item": "Full verify: judge criterion 6 reason location and reason validity (ticket-dir read stays; Bash quoting weakness), and check the 400 behaviour beyond test names", "owner": "qa"}, {"item": "Criterion 7: npm run risk-check and gitleaks, then full security review of the branch", "owner": "security"}]}
```

# qa verify (light): agent-os/07-grant-hardening

State: partial. Light verify steps 1, 2 and 4 pass. Escalated to full verify on criterion 6. No QA verdict written.

Branch: tests/agent-os-07-grant-hardening. Specify commit c68ddad (tests). Developer commit 69bdee9. Worktree at 69bdee9.

## Light verify steps

1. Suite: /tmp/07-tests.txt (saved developer run, not re-run per dispatch). `# tests 4225`, `# pass 4225`, `# fail 0`, `# skipped 0`, `# todo 0`. The one "not ok" match is a test name, not a failure.
2. `git diff c68ddad 69bdee9 -- apps/bridge/cells/grants-hardening.test.mjs` is empty. No assertion removed or loosened.
3. Criterion to test (describe blocks in grants-hardening.test.mjs):
   - 1 governed path and main .git: "POST /tasks refuses a path grant on a governed path of the main checkout".
   - 2 home and system list: "POST /tasks refuses a path grant on a home or system path".
   - 3 agent-os/02 deny rules: "the deny rules of agent-os/02 stay as the second layer". grants.test.mjs and grants-paths.test.mjs are not in the diff.
   - 4 bare .git: "a bare .git entry covers the worktree's .git pointer file" (compiled rule). Live check is human-verified and recorded on the ticket (developer, 2026-10-12).
   - 5 .git/refs probe: human-verified, recorded on the ticket. Result: writes succeeded, so agent-os/09 owns the fix.
   - 6 low findings: .GIT casing, symlink, GitHub hosts each have a test. Ticket directory read and Bash quoting have no test; reasons are in 07-developer-2.md only. Escalated.
   - 7 npm test: covered by step 1. risk-check and gitleaks not run by qa; they belong to the next stages.
4. Files changed outside the test file (listed, not judged): apps/bridge/cells/claude-adapter.mjs, apps/bridge/cells/governance.json (guardrail path; developer edited it directly, no gated patch), apps/bridge/cells/grant-policy.mjs (new), apps/bridge/cells/host.mjs.

## Next step

Full verify by qa: decide whether the criterion 6 reasons count as recorded on the ticket and hold up, and review the grant-policy.mjs behaviour against the ticket. Then security for risk-check and gitleaks. The orchestrator should ask the developer or the user to copy the two reasons onto the ticket if full verify wants them there.

## Suggested skills

tdd, code-review, organism-protocol.

## Gotchas

- The developer handoff mentions one flaky 'npm run dev listens on 127.0.0.1 only' failure in one run. The saved run shows 0 fail.
- The ticket's own criterion says reasons go on the ticket, not in the handoff.
