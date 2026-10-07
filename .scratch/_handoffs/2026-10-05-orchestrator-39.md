# Orchestrator handoff 39 (2026-10-05, MacBook): 106 security pre-build review bounced; compacting to continue

State, not rules; the genome wins. The active milestone is den-v1 (T/F/A/D, ADR 0019 decisions 1 and 8). The split line is ~120k tokens (ADR 0019 decision 8).

## Done this session
- organism-infra/106: `security` re-reviewed ADR 0016 decision 6 before build. Verdict **bounce** (design bounce, counts 1 toward fails-twice). Handoff `.scratch/organism-infra/handoffs/106-security.md` (duplicate `106-security-2.md`). Ticket back at `ready-for-agent`, no lock. Cell logged (90,989 tokens, 318s, final context 89k); advisory-outcome logged.
  - F1 high until new spike S8: child opens `/tmp/cc-socks/<pid>.sock` with send-now/interrupt, which contradicts "only the bridge holds stdin" (6.3, 6.5).
  - F2–F6 medium: launch-URL token leak (use a one-time launch code; the user starts the bridge); nested `control_request` (accept only `can_use_tool`, ignore `permission_suggestions`); argv allowlist test, not a denylist; restrict setting sources and pass the deny rule inline via `--settings`; SIGKILL escalation and a shutdown handler (new spike S4b).
  - F7–F8 low: auth before lookup, mask `tool.summary`, no token-off path; S6 unresolved, so rerun it in a real worktree. Scrub the committed S1/S3 fixtures (home paths, username). Bridge `.scratch/_run/` mode 0700, `sessions.jsonl` 0600.
  - Split order (security): (1) auth gate incl. `POST /requests` and UI token, with table-driven tests from one route registry; (2) host + fake runtime + routes; (3) adapter last, after S8 and the S6 rerun. 409 keyed to the HTTP entry; relay hops only via an internal host entry.
- 136 lock force-released (user yes). It stays parked; partial work stays only in worktree `agent-aa4acad29a81bddf3`.
- Incidents logged: verbose pgrep output; dispatch prompt said to run cell-start from the main checkout (wrong: inside the worktree); `release --keep-status` after a design-only review left the ticket claimed (use `--status ready-for-agent`); security ended at 89k context.
- The user switched Claude accounts via /login mid-session. Readings after the switch: 5-hour 27% (resets 2026-10-06T02:00Z), weekly 4%.

## Next
1. Propose an `architect` dispatch on 106: amend ADR 0016 decision 6 (and decisions 2, 3, 7) for F1–F8; define spikes S8, S4b and the S6 rerun for the user to run via `conformance.mjs` (they need the owner's login); draft the three-ticket split in security's order for user approval.
2. Then den-v1/02, 126, 127, 135, 128. The character-director retirement is deferred (user: low priority).

## Owed
- `pipeline-retro` (owed since handoff 36), with items from handoff 38 plus this session's incidents.
- Leftover worktrees: two for 124 (merged, PR #154), detached `ui-review`, about 22 `worktree-agent-*` branches. Run the `worktree-gc` dry run and show it to the user.
- `.scratch/usage.jsonl` and this handoff are uncommitted on main.
