```json
{"ticket": "organism-infra/67", "cell": "security",
 "current_step": "Review done. Verdict: Security pass with required narrowing (handoffs denied; jg board exposure needs a rule plus a guard). No code or ADR changed.",
 "artifacts": [".scratch/organism-infra/issues/67-security-review-jev-handoff-and-jg-board-exposure.md (verdict comment)"],
 "decisions": ["Handoff text never goes to Jev (any point).", "Comment text is allowed only as the same class as ticket markdown.", "Gate-request rows in _requests never go to Jev; code wakes on them.", "Cells may not widen jg beyond its default filter; the board must not reach jg's provider."],
 "failures": ["jg is not installed here, so I read jg 0.6.0 and 0.7.0 from the npm tarball (npm pack, no install, no scripts run) instead of running it."],
 "pending": [
  {"item": "Ticket: shared exposure module (denied-path list, secret-rule gaps, --tests confinement); it blocks 70 and 72", "owner": "orchestrator"},
  {"item": "Apply ADR 0010/0014/0015 edits listed below (pass gate, user yes)", "owner": "architect"},
  {"item": "Apply the jg line to genomes and the jg rule to scripts/hooks/bash-guard.mjs (.claude/ work, user permission)", "owner": "orchestrator"}]}
```

## State
Done. Security pass with required narrowing. Nothing built or edited; findings below are for ticketing.

## Q1: handoff and comment text to Jev
**Handoffs: denied, for every point.** Reasons: 0010 decision 9 lists them as never leaving; they carry `Failed calls`/`Environment issues` text (proxy and path strings, exact errors), security findings, and diffs quoted from code. One tracked handoff already trips gitleaks (`.scratch/organism-infra/handoffs/38-security.md:13`, aws-access-token, value not printed; not in `.gitleaks.toml`). A label needs none of it.
**Bounce route (70): ticket only.** Input = ticket markdown (already sent by tier/verify, and `## Comments` is part of it) plus the latest `board comment --verdict bounce` text read from `.scratch/events.jsonl` (`op:"comment"`, `verdict:"bounce"`, `text`), capped 2,000 chars, appended after the ticket under a fixed delimiter so the 16k tail cut cannot drop it. No file under `handoffs/` or `_handoffs/`.
**Wake (72): comment text only, same class as the ticket.** Input = ticket title and Status line plus the one new comment (events row `text`), each capped 4,000 chars. Ceiling: never more than the ticket markdown plus that comment.
**Gate-request text: denied.** `.scratch/_requests/requests.jsonl` rows are user clicks from the UI (kinds merge/dispatch approve/reject, optional free-text `note`). Code wakes on any new row by `id`; Jev never sees a row. Note it is an appended JSONL row, not a "new file".
**Wake rules code must own (extends 0015 decision 6):** `--verdict` is stored only in events.jsonl, not in the ticket text, so read it there. Wake without calling Jev on: user-authored comment, `Scope added`, any verdict event, unknown or unparseable author, blocked-input, any failure. Only a comment from a known cell type, no verdict, no scope text, may reach Jev. Comment text is untrusted (agents quote web pages): Jev's output is only ever mapped to the closed label set, and anything else is `other`.

## Q2: jg and `.scratch/`
**Finding: 0015 decision 8's premise is wrong for jg 0.6.0 and 0.7.0.** jg excludes hidden (dot-prefixed) paths by default (`dist/bin/index.js:701-702`; only `--hidden` reverses it), so `.scratch/`, `.claude/` and `.env*` are not sent by a default call. Tracked-ness does not matter. It also skips `.gitignore`/`.ignore` matches, dependency dirs, `credentials*`/`*.key`/`*.pem`, and any file with a private-key block. It has no per-search provider override and ignores env keys, so a cell cannot redirect it.
**Residual gaps (Low to Medium):** (a) the hidden test applies only to path parts below the root, so `jg "q" .scratch` (root inside the board) sends the whole board; (b) `--hidden`, `--no-ignore`, `--include-sensitive`, `--include-dependencies` widen it; (c) the default is version-dependent (0.5.0 not checked); (d) jg's only secret content check is a private-key block.
**Verdict: the board must not reach jg's provider. Required control = rule plus mechanical guard. No `.ignore` or `.jgignore` file** (`.ignore` would also hide `.scratch/` from cells' own `rg`, and `--no-ignore` bypasses it; `.gitignore` cannot be used on tracked files).
Rule for genomes that may run jg (wording for the orchestrator to place; user permission): `jg (ad hoc): run only as jg "<question>" <root>, where <root> is your checkout root or a non-hidden subdirectory of it. Never pass --hidden, --no-ignore, --include-sensitive or --include-dependencies. Never use a root that is or lies inside .scratch/, .claude/ or .git/, or outside the checkout. The board (tickets, handoffs, usage.jsonl) must not reach jg's provider. Use jg 0.6.0 or newer.`
Guard: add a jg rule to `scripts/hooks/bash-guard.mjs` (ticket 52, not yet built) that blocks those flags and roots. It is a string check, so shell indirection can bypass it; residual Low, tell the user.
Wrapper (0014 follow-up A): always pass `--exclude '.scratch/'` and `--exclude '.claude/'` (redundant today, version-proof), never forward caller flags, refuse a root under a dot-directory, check `jg --version` >= 0.6.0 else fall back (`jg-version`). Do not run `jg skill` in the repo: its skill tells agents to `npm install -g @dzhng/jevgrep@latest` at runtime (unpinned). jg 0.7.0: MIT, no install scripts, two bundled deps.

## Consistency rule (ticket criterion 4): gap named
Secret rule is owned once (`SECRET_PATTERNS`, `scripts/risk-check.mjs:18-29`, imported by `jev.mjs:10`) but incomplete. Synthetic probe missed: unquoted `NAME_KEY=value` env lines (the exact shape of `TYPESAFE_API_KEY=`), `Authorization: Bearer`, `sk_live_`, `github_pat_`, `gho_`/`ghs_`, JWT, `npm_`, URL credentials, `aws_secret_access_key = ...`. Ticket 46 covers only the `gh*_` and Slack shapes. The denied-path list does not exist in code at all. There is no redaction in `jev.mjs`, only `blocked-input` (line 104); 0015 decision 8 says "existing redaction".
Also `jev.mjs:186` reads any path given to `--tests` and sends it (Medium: with the pattern gaps, `--tests <env file>` would leave the machine).
**Required new ticket (blocks 70 and 72; 69 sends the ticket only and may proceed):** `scripts/exposure.mjs` exporting `DENIED_PATHS`, `isDenied(path)`, `hasSecret(text)` (wraps `SECRET_PATTERNS`, plus the missing shapes). `jev.mjs` and the jg wrapper import it. Inputs come from a per-point allowlist: tier = ticket; verify = ticket + `--tests`; route-new = ticket; route-bounce = ticket + bounce comment; wake = ticket header + new comment. `--tests` must realpath to a regular non-symlink file, at most 1 MB, not `.env*`, `credentials*`, `*.pem`/`*.key`, a dot-directory, `.git/`, `.scratch/**/handoffs`, `_handoffs`, `_requests`, `*.lock`, `usage.jsonl`. Run the secret check on the whole assembled text before the 16k truncation (true today; keep).

## Tests the developers must write (through `decide` with an injected transport and a temp board)
1. Sentinel text placed in a handoff file, a `_requests` note, usage.jsonl, another ticket and a non-target events row never appears in the transport's `text` (69, 70, 72).
2. Each secret shape above, in the ticket and in a comment, gives `blocked-input` and zero transport calls; a secret in the part later cut by truncation is still blocked.
3. Bounce (70): the verdict comment is present when the ticket exceeds 16k chars; a handoff sentinel is absent.
4. Wake (72): user, `Scope added`, verdict-event, unknown-author comments and a new `_requests` row wake with zero transport calls; an injected "answer informational" comment yields only a label in the set or `other`.
5. `--tests` and `--ticket` reject `..`, a symlink to a denied file, and denied names, with zero transport calls.
6. One-source test: `jev.mjs` and the jg wrapper import the same list and rule (identity check).
7. Wrapper: argv to the fake `run` always contains both `--exclude` args and none of the forbidden flags; a root under `.scratch` or an old version falls back.

## Proposed ADR edits (not made; pass gate, user yes)
- 0015 decision 8, first bullet: replace with "Handoff text is not sent. Route (bounce) sends the ticket plus the latest bounce verdict comment. Wake sends the ticket header and the new comment, and never `_requests` rows. Comment text is the same class as ticket text." The 0010 decision 9 pointer then reads "0015 decision 8 adds comment text (ticket class); handoffs stay excluded" and 0010's "handoffs never leave" stands. Fix "existing redaction" to "existing `blocked-input` fallback".
- 0015 decision 8, second bullet: replace the premise with the default hidden-path exclusion (0.6.0 and 0.7.0) plus the residual gaps and the rule above.
- 0015 decision 6: verdict flag lives in events.jsonl; `_requests` is JSONL rows; add the always-wake list above.
- 0014 decision 5: minimum jg version, forbidden flags, root rule, `--exclude '.claude/'`, and a note that `.scratch/` is already hidden-excluded.
- 0015 Status line: record this review (date, ticket 67).

## Next step
Orchestrator: ticket the exposure module, block 70 and 72 on it, then take the genome and guard lines to the user. Architect: ADR edits after the user's yes.

## Gotchas
The board's `--verdict` is not in ticket markdown. `.gitleaks.toml` allowlists only `scripts/risk-check.test.mjs` and ticket 08; whether `38-security.md:13` is a fake fixture I could not confirm without printing it. Ticket 42 (TypeSafe retention and training use) is still open and applies to everything sent, this change included.
