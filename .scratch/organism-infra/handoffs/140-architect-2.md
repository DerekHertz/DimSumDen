# 140 architect (hop 2): herald flip, and a kernel note on the steering host

```json
{
  "ticket": "organism-infra/140-steering-host-core",
  "cell": "architect",
  "current_step": "Task 1 done: herald is dispatchable from the route; test flipped and ADR 0016 decision 3 amended, committed at d92cf29 on tests/140-steering-host-core (base c2d959c, not pushed). Task 2 done: kernel note below (recommendation only; tests and the ADR untouched beyond Task 1). Tests are still red only for missing features. Ticket released at ready-for-agent for the developer hop.",
  "artifacts": [
    "docs/adr/0016-ui-steering-channel.md (tests/140-steering-host-core @ d92cf29)",
    "apps/bridge/cells/host-core.test.mjs (tests/140-steering-host-core @ d92cf29)"
  ],
  "decisions": [
    "herald flip: the 409-for-herald test is replaced by 'herald dispatches (201, role herald, one spawn)', and herald joins the 'every role of the first slice dispatches' loop. ADR 0016 decision 3 lists herald among the non-relay roles, the 409 table row no longer mentions it, and a dated amendment bullet (2026-10-06) records the user's decision. The 400 'one of the nine' row and RELAY_HOP_ROLES (developer, qa, security) are unchanged.",
    "Kernel note (below): keep the host as one deep module; apply minimality as a review test, not as a package split. Policy (role table, usage gate, cap and grace values) is injected; routes and status-code mapping stay outside; the sessions file gets its own module behind the host. All of this is internal and invisible to the 140 tests, so 140's scope does not change.",
    "Exokernel framing: partial fit as a metaphor (genomes as library OS), a poor fit as an architecture, because the host cannot enforce secure bindings against cells that share the user's OS account, and because an exokernel host would own worktrees and locks, which ADR 0011 (no Board write paths in the bridge) forbids."
  ],
  "failures": [],
  "pending": [
    {"item": "Make the tests pass on tests/140-steering-host-core (head d92cf297705569849437433e8f4fe49a5694449e). Notes from the first architect handoff still apply (runtime.resumeCommand, fake contract in the host-core.test.mjs header, minimal fixed prompt template, cwd is the main checkout). Optional, from the kernel note: keep the policy values and the role table in policy.mjs, have the host return typed refusal reasons for the routes to map to status codes, and put sessions.jsonl append and replay behind a small module", "owner": "developer"},
    {"item": "User approves the ADR 0016 amendments (fourth amendment from hop 1 plus the herald amendment) at merge; nothing pushed", "owner": "user"},
    {"item": "Unassigned items from hop 1 are covered by follow-ups 153 and 154 per the ticket comment; nothing new here", "owner": "orchestrator"}
  ]
}
```

## State

Head SHA on `tests/140-steering-host-core`: **d92cf297705569849437433e8f4fe49a5694449e** (one commit on top of c2d959c). Changed: the herald test and role loop in `host-core.test.mjs`, and ADR 0016 decision 3. I ran `node --check` on the test file only; the suite is still red for the missing `runtime.mjs` and `bridge.host`, as before, and I did not re-run it. Not pushed.

## Kernel note: Liedtke's minimality rule applied to the host

Rule: a concept stays in the kernel only if moving it out, so that competing implementations could exist, would prevent required functionality. Applied to what 140 puts in `host.mjs`:

| Responsibility | Verdict | Why |
|---|---|---|
| Reservation (one synchronous step: one live agent per ref, live slot, 8-session slot) | **Keep in** | Atomicity is the invariant. Two implementations of it would race, which is the thing the concurrent-dispatch test forbids. |
| Caps (the check) | **Keep in** | The check must sit inside the same synchronous step as the reservation. |
| Caps (the values: 2, 8, grace times) | **Move out** | They are policy numbers in `policy.mjs`, injected. `sessionCap` can already only lower the hard 8. Mechanism in, number out. |
| Usage gate (five-hour reading of 90 or more) | **Move out** (as an injected admission hook) | No kernel invariant depends on it; the reading is already injected in the tests and a null reading allows. The host asks one `admit` predicate inside the reservation step and knows nothing about usage files. |
| 409 role policy (relay-hop roles refused on the route) | **Move out** (keep the entry-point distinction in) | Which roles an entry may start is a table, not a mechanism: the herald flip was one line. What the kernel must keep is two entries of different authority: the token-authenticated route and the in-process `start()`. That is a capability distinction: holding a reference to `start()` is the authority. |
| Kill escalation (close stdin, grace, SIGTERM, grace, SIGKILL; `terminated` only after `exited`; shutdown kills all) | **Keep in** | Forced revocation is the one thing a library cannot be trusted to do for itself, and releasing the reservation depends on it. The signal primitive itself stays in the adapter (process-group kill); the order and timers are the host's. |
| `sessions.jsonl` append (spawn, stop, end, with the route) | **Keep in** | Only the host knows who started what through which entry, so the write belongs at that point. |
| `sessions.jsonl` replay, validation, `bridge-restart-unverified` marking | **Move out** (own module) | History is derivable and untrusted input; nothing in dispatch needs it. A two-method module (`append(event)`, `replay()`) behind the host gives it locality without a new seam. |
| Routes and status-code mapping | **Move out** | The routes are thin adapters over the host. The host should return typed refusal reasons (cap, usage, gate, relay-hop, shutting down) and the routes map them to 400, 404, 409, 429, 503. The ADR's status table then lives in one place. |

Result: the minimal kernel is reserve, spawn through the runtime, force-terminate, append audit, and a live-agent snapshot, behind an interface of about five calls (`dispatch`, `start`, `stop`, `snapshot`, `shutdown`). Everything else is injected policy or an adapter. This is mostly the shape ADR 0016 already has, so I recommend adopting minimality as a **review test** for the host, not as a package split. Per `codebase-design`, do not add seams nobody varies: the policy hook, the usage reading and the runtime already have two implementations (real and test fake), so they are real seams; a separate "kernel package" would have one.

### Exokernel framing: partial fit as a metaphor, not as the architecture

- **Fits:** genomes and `organism-protocol` really are library code each cell links in (claim, handoff, gates, relay behaviour). The host does allocate process slots and gates the token budget. The ADR 0019 relay runner is a user-level server that talks to the kernel through the privileged internal `start()`, and the UI route is a client with a token. That is a microkernel shape, and it is a sound one.
- **Does not fit, 1: no enforcement.** An exokernel's secure bindings assume the library OS cannot forge them. Cells run as the user's OS account with a shell: they can write lock files and `sessions.jsonl`, run `claude` themselves, or `curl` the bridge (ADR 0016 threat model (b) and the known residual). The host protects against the UI, races and runaway counts, not against a hostile cell. Until cells are genuinely sandboxed, "kernel" is an organising principle, not a protection boundary.
- **Does not fit, 2: the host does not own worktrees or locks.** In 140 a cell makes its own worktree (`cell-start`) and its own lock (`board claim`). An exokernel host would allocate both, which means the bridge writing the Board, and ADR 0011 gives the bridge zero Board write paths. That is an ADR conflict, and not something 140 should decide.
- **Direction of travel is the opposite:** ADR 0019 moves the relay state machine and Jev routing into the bridge. That is a monolith-leaning move; it stays healthy only if the relay runner remains a client of the host's five calls, with no reaching into the live map.
- **SPIN and L3/L4:** not worth adopting. SPIN's safe in-kernel extensions rely on a type-safe language to confine them; JavaScript cannot confine an injected policy, so keep policy injection for structure only. L4's gains are IPC speed; here the traffic is HTTP and pipes to processes that run for minutes, so only the minimality idea transfers.

## Questions for the user (not decided here; none changes 140)

1. **Should the host ever own worktree and lock allocation** (the real exokernel step)? It would put Board writes in the bridge, against ADR 0011, and overlaps follow-up 153 (worktree per agent). It needs its own ADR if you want it.
2. **Do you want cells treated as untrusted in earnest** (a separate OS user, or a sandbox profile for spawned cells)? Without it, no kernel framing gives more than structure, and decision 6's "known residual" stays open.

(Hop 1's questions 1 and 2 stand: question 1, herald, is now answered and applied; question 2, the dispatch gate allowing one dispatch at a time in practice, is unchanged.)

## Failed calls

- Bash, `node scripts/cell-start.mjs ...` from the main checkout: "cell-start: this is the main checkout; run cell-start only inside a cell worktree". Ran it again from the existing detached worktree at c2d959c (`.claude/worktrees/agent-ab430e2c85fedd0e2`), which worked. Genuine guardrail; the dispatch did not say which worktree to use.
- Grep tool: "No such tool available in this session" (twice). Used `grep` through Bash. Fixable friction (the genome lists Grep).
