```json
{"ticket": "organism-infra/69", "cell": "security",
 "current_step": "Review done. Verdict: Security pass at a4f8a2e (no critical, high or medium). Three Low hardening notes. No code changed.",
 "artifacts": [".scratch/organism-infra/issues/69-jev-route-new-ticket-shadow-and-reserved-budget.md (verdict comment)"],
 "decisions": ["Route input is the ticket file only; 67 exposure rules hold.", "Low findings do not block; fold into the exposure-module ticket or a small follow-up."],
 "failures": ["risk-check hits (jev.mjs, jev-report.mjs, tests) are all keyword hits (board, secret, spawnSync); no real exposure."],
 "pending": [{"item": "Optional Low hardening: Object.hasOwn on RESERVED, clamp cost >= 0, reject --mode live for route until go-live", "owner": "developer (any later jev ticket)"}]}
```

## State
Security pass. Branch dev/69-jev-route-shadow at a4f8a2e29c81, diff vs origin/main is 4 files (scripts/jev.mjs, scripts/jev-report.mjs, two new test files), ~700 lines. Gitleaks on origin/main..a4f8a2e: 3 commits, no leaks. `git diff` over .github, .claude, .gitleaks.toml, package.json, package-lock.json, scripts/hooks, scripts/risk-check.mjs is empty: no gate, hook, CI or dependency change. jev test files run here: 60/60 pass. I could not run /security-review separately; the review was by hand.

## Checks (your list)
1. **Text sent to Jev.** Route sends `ticketText` only (`jev.mjs:151`; `testsText` is joined only when `point === "verify"`). `ticketText` is one `readFileSync` of `.scratch/<feature>/issues/<slug>.md` (`jev.mjs:241`). No handoff, events, `_requests` or comment-event read exists in `jev.mjs`. The route path adds no new `--tests` reading, so the 67 `--tests` gap is unchanged (it only affects verify). `events.jsonl` is read only in `jev-report.mjs:198`, never sent anywhere. Comments inside the ticket markdown are ticket class (67). The transport request carries `state`, `model` and a criteria map filtered to the offered labels (constants).
2. **Secrets.** `SECRET_PATTERNS.some(re.test)` runs on the whole assembled text before the 16k tail cut and before the key read (`:152`). The patterns have no `g` flag, so `test` has no lastIndex state. The key is only in the Authorization header in `fetchTransport`. `catch` returns a fallback label only and never uses `e.message` (`:175-177`). Rows and stdout carry labels, numbers and the ticket ref (validated) only. The existing tests `blocked input ... key stays out of the row` and `the API key goes to the transport only` cover this. Gaps in the secret rule itself remain the 67 exposure-module ticket; this diff does not worsen them.
3. **Writes.** The only write is `appendFileSync(usage.jsonl)`. `--ticket` must match `^[\w.-]+\/[\w.-]+$` with no `..` (no `\n`, since `$` is not multiline), so no traversal. There is no shell: `execFileSync("git", [...])` is constant, and ticket-derived strings only reach `path.join` and JSON. The model's label is checked against the offered set before it enters the row; anything else becomes `other`. Shadow stdout drops `pick` and `conf` (`:144`).
4. **Budget arithmetic.** Probed through `decide` with an injected transport. Block cases: total at or above 0.50, own at reserve with shared exhausted, and an epsilon edge (0.05-1e-10 and 0.35-1e-10 blocked). Allow cases: route own 0 with the shared remainder spent by tier; yesterday's rows (UTC day compare via `toISOString`); an unknown point (draws only from shared; blocked when over). The worst-case invariant holds: total spend is at most 0.35 + 3 x 0.05 = 0.50, and `total >= CAP` binds first.
5. **Report and tests.** The report reads `events.jsonl` (op, feature, ticket, cell, ts) and prints only labels, counts and ticket keys. It never prints event text. `--usage` is read-only. The tests use `spawnSync(process.execPath, [SCRIPT, ...argv])` with an argv array (no shell), a temp `ORGANISM_ROOT`, and `TYPESAFE_API_KEY` deleted from the env, so no network. The fake key is split in the source (`"sk-" + "test-..."`) and gitleaks is clean. `globalThis.fetch` is restored in `finally`.
6. **Gates.** Untouched (see State).

## Findings, ranked (all Low; none block)
1. **Low** `scripts/jev.mjs:115`: `RESERVED[k] ?? 0` with a prototype key (a usage row with `point: "constructor"`) gives NaN, so `shared` is NaN and the shared sub-cap is skipped. The probe allowed a route call at 0.46 total with shared already exhausted. The total 0.50 cap still binds. It needs a hand-written row in `usage.jsonl`, which the script never writes. Fix: `Object.hasOwn(RESERVED, k)` or a Map, and skip rows whose point is not a string.
2. **Low** `scripts/jev.mjs:110` and `:184`: a negative cost (a row, or `input_tokens` from the API) is not clamped and would lower the day's total. Fix: `Math.max(0, c)`.
3. **Low** `scripts/jev.mjs:217-222`: `--mode live` is accepted for route. Live mode exposes `pick` and `applied`, but nothing in this diff consumes it, and the ticket says "nothing routes live". Consider refusing live for route until the go-live bar (ADR 0015 decision 5) passes.
4. **Info, pre-existing, not worsened:** the ticket path follows a symlinked ticket file; timeout or abort rows log cost 0 although the call may be billed; concurrent callers read usage before appending, so overshoot is a few calls at about $0.0002 each; `--tests` is unconfined (67). All belong to the exposure-module ticket.

## Next step
Orchestrator: open the PR (pass gate stays with the user for merge rules per relay autonomy). Optionally ticket findings 1 to 3 as a small hardening follow-up or fold them into ticket 70.

## Gotchas
The ticket Status was `claimed` (not `in-review`) when I claimed, because qa verify's release kept `claimed`; I released with `--keep-status`, so it still reads `claimed`. Set it to `in-review` or `resolved` at merge time as your relay requires.
