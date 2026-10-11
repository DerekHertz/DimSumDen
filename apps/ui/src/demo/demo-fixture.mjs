// den-v1/09: the event stream Demo mode replays. Pure data; see README.md for how to re-record it.
//
// RECORDED: the scout (`demo-scout`, ticket den/04-scout) is the live run of 2026-10-11, started from the den on
// Claude Haiku: its tool calls in order, its seven permission requests, its reply and the cost the CLI reported.
// Times are the run's, halved (76 s becomes 38 s). Changed from the run: the checkout path reads /repo; long results
// are cut with "…"; two requests that were pending together are shown one after the other; the ticket is held by the
// scout from the start (the live agent ran for 31 s before it claimed), because the demo's pandas bind by ticket; and
// the ticket's release (0.7 s before the run ended) is shown with the run's end, for the same reason.
// STAGED: the developer and qa agents (`demo-dev-1`, `demo-qa`, `demo-dev-2`, tickets demo/…) are written by hand, so
// the demo also shows a split-off panda, a message and its acknowledgement (user decision, 2026-10-10).
//
// One pass is `loopMs` long. Each event has `at` (ms from the start of the pass); events are sorted by `at`.
//   ticket   { at, type, ref, title, status, role? }              upsert a ticket; `role` is the cell holding it (none: queued)
//   agent    { at, type, id, ref, role, state, reply?, costUsd? } a run starts, or changes state; a run that ended carries its reply and cost
//   tool     { at, type, agentId, name, summary, input?, result? }  a tool call (bubble); input/result also record a transcript line
//   say      { at, type, agentId, who: "agent" | "user", text }   a transcript message line
//   ask      { at, type, agentId, tool }                          the agent waits on the user (pending approval, lantern line)
//   answer   { at, type, agentId }                                the user answered; the waiting line reads allowed and the agent carries on
//   ack      { at, type, agentId, text }                          the runtime acknowledged a message the user sent
// Agents `demo-qa` and `demo-dev-2` have no transcript lines, so the card shows R greyed for them; `demo-dev-1` and `demo-scout` have lines.
export const DEMO_FIXTURE = Object.freeze({
  loopMs: 48000,
  events: Object.freeze([
    { at: 0, type: "ticket", ref: "demo/01-login-form", title: "Login form", status: "claimed", role: "developer" },
    { at: 0, type: "agent", id: "demo-dev-1", ref: "demo/01-login-form", role: "developer", state: "working" },
    { at: 0, type: "ticket", ref: "demo/02-login-tests", title: "Login tests", status: "claimed", role: "qa" },
    { at: 0, type: "agent", id: "demo-qa", ref: "demo/02-login-tests", role: "qa", state: "working" },
    { at: 0, type: "ticket", ref: "demo/04-password-reset", title: "Password reset", status: "ready-for-agent" },
    { at: 0, type: "ticket", ref: "den/04-scout", title: "04: Den task for scout", status: "claimed", role: "scout" },
    { at: 800, type: "say", agentId: "demo-dev-1", who: "agent", text: "Reading the login spec before I touch the form." },
    { at: 1700, type: "agent", id: "demo-scout", ref: "den/04-scout", role: "scout", state: "working" },
    { at: 2500, type: "tool", agentId: "demo-dev-1", name: "Read", summary: "src/login.js", input: { file_path: "src/login.js" }, result: "export function login(user, pass) { ... }" },
    { at: 3400, type: "tool", agentId: "demo-scout", name: "Read", summary: "/repo/.claude/worktrees/den-den-04-scout-fe36a02c/.claude/agents/scout.md", input: { file_path: "/repo/.claude/worktrees/den-den-04-scout-fe36a02c/.claude/agents/scout.md" }, result: "---\nname: scout\ndescription: Cheap read-only helper that runs verbose work (full test runs, log digging, codebase surveys, doc or web lookups) and returns only a short summary. …" },
    { at: 3500, type: "tool", agentId: "demo-scout", name: "Read", summary: "/repo/.scratch/den/issues/04-scout.md", input: { file_path: "/repo/.scratch/den/issues/04-scout.md" }, result: "# 04: Den task for scout\n\n**Type:** task\n\n**Priority:** P2\n\n**Status:** ready-for-agent\n\n**Source:** den\n\n## What to build\n\nThe request, quoted as its author wrote it:\n\n> Read /repo/package.json and reply with the package name\n…" },
    { at: 4400, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 5000, type: "tool", agentId: "demo-qa", name: "Bash", summary: "npm test" },
    { at: 7500, type: "tool", agentId: "demo-dev-1", name: "Edit", summary: "src/login.js", input: { file_path: "src/login.js" }, result: "Edited 12 lines" },
    { at: 8300, type: "answer", agentId: "demo-scout" },
    { at: 8800, type: "tool", agentId: "demo-scout", name: "Bash", summary: "cd /repo && ls .scratch/den/issues/ | head -50; ls .scratch/den/issues/*.lock 2>/dev/null; rg -n -i \"lock|claim\" docs/agents/issue-tracker.md | head -20", input: { command: "cd /repo && ls .scratch/den/issues/ | head -50; ls .scratch/den/issues/*.lock 2>/dev/null; rg -n -i \"lock|claim\" docs/agents/issue-tracker.md | head -20" }, result: "01-scout.md\n02-scout.md\n03-scout.md\n04-scout.md\n8:- **Status values:** `ready-for-agent` → `claimed` → `in-review` → `resolved`. …" },
    { at: 9000, type: "ask", agentId: "demo-scout", tool: "Read" },
    { at: 10000, type: "ticket", ref: "demo/03-login-docs", title: "Login docs", status: "claimed", role: "developer" },
    { at: 10000, type: "agent", id: "demo-dev-2", ref: "demo/03-login-docs", role: "developer", state: "working" },
    { at: 11000, type: "tool", agentId: "demo-dev-2", name: "Grep", summary: "login docs" },
    { at: 11800, type: "answer", agentId: "demo-scout" },
    { at: 11900, type: "tool", agentId: "demo-scout", name: "Read", summary: "/repo/package.json", input: { file_path: "/repo/package.json" }, result: "{\n  \"name\": \"dim-sum-den\",\n  \"private\": true,\n  \"type\": \"module\",\n  …" },
    { at: 12800, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 14000, type: "ask", agentId: "demo-dev-1", tool: "Bash" },
    { at: 15400, type: "answer", agentId: "demo-scout" },
    { at: 15500, type: "tool", agentId: "demo-scout", name: "Bash", summary: "node apps/organism-infra/board.mjs claim den/04 scout 2>&1 | head -20", input: { command: "node apps/organism-infra/board.mjs claim den/04 scout 2>&1 | head -20" }, result: "claimed den/04-scout: claimed" },
    { at: 16500, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 20000, type: "answer", agentId: "demo-dev-1" },
    { at: 20500, type: "tool", agentId: "demo-dev-1", name: "Bash", summary: "npm test", input: { command: "npm test" }, result: "12 passed" },
    { at: 21900, type: "answer", agentId: "demo-scout" },
    { at: 22000, type: "tool", agentId: "demo-scout", name: "Bash", summary: "node apps/organism-infra/board.mjs handoff den/04 --template 2>&1 | head -40", input: { command: "node apps/organism-infra/board.mjs handoff den/04 --template 2>&1 | head -40" }, result: "State block for den/04-scout (fill in the placeholders, then draft the handoff under /tmp):\n…" },
    { at: 22900, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 24000, type: "say", agentId: "demo-dev-1", who: "user", text: "Keep the login form keyboard friendly." },
    { at: 24500, type: "ack", agentId: "demo-dev-1", text: "Keep the login form keyboard friendly." },
    { at: 26000, type: "say", agentId: "demo-dev-1", who: "agent", text: "Will do. Every control stays reachable by keyboard." },
    { at: 28000, type: "answer", agentId: "demo-scout" },
    { at: 28100, type: "tool", agentId: "demo-scout", name: "Bash", summary: "mkdir -p /tmp/scout-den-04 && cat > /tmp/scout-den-04/04-scout.md <<'EOF' # Handoff: den/04-scout …", input: { command: "mkdir -p /tmp/scout-den-04 && cat > /tmp/scout-den-04/04-scout.md <<'EOF' # Handoff: den/04-scout …" }, result: "published /repo/.scratch/den/handoffs/04-scout.md" },
    { at: 29000, type: "tool", agentId: "demo-qa", name: "Read", summary: "login.test.js" },
    { at: 29000, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 32000, type: "tool", agentId: "demo-dev-2", name: "Write", summary: "docs/login.md" },
    { at: 32000, type: "answer", agentId: "demo-scout" },
    { at: 32100, type: "tool", agentId: "demo-scout", name: "Bash", summary: "node apps/organism-infra/board.mjs release den/04 --status resolved 2>&1 | head -20; rm -rf /tmp/scout-den-04", input: { command: "node apps/organism-infra/board.mjs release den/04 --status resolved 2>&1 | head -20; rm -rf /tmp/scout-den-04" }, result: "board: invalid status transition: a claim held by scout cannot release den/04-scout at resolved (only the orchestrator resolves)" },
    { at: 32600, type: "ask", agentId: "demo-scout", tool: "Bash" },
    { at: 34500, type: "answer", agentId: "demo-scout" },
    { at: 37000, type: "tool", agentId: "demo-scout", name: "Bash", summary: "node apps/organism-infra/board.mjs release den/04 --status in-review 2>&1 | head -20", input: { command: "node apps/organism-infra/board.mjs release den/04 --status in-review 2>&1 | head -20" }, result: "released den/04-scout: in-review" },
    { at: 37700, type: "say", agentId: "demo-scout", who: "agent", text: "The package name is **`dim-sum-den`**, from `/repo/package.json` line 2.\n\nTicket den/04-scout was claimed, handed off, and released to `in-review`. The board refuses `resolved` for a scout claim, so the orchestrator will need to resolve it.\n\nEnvironment issues: the first `release --status resolved` was refused with \"only the orchestrator resolves\". That is the expected gate, not a fault, so I released to `in-review` instead." },
    { at: 37900, type: "agent", id: "demo-scout", ref: "den/04-scout", role: "scout", state: "done", reply: "The package name is **`dim-sum-den`**, from `/repo/package.json` line 2. Ticket den/04-scout was claimed, handed off, and released to `in-review`. The board refuses `resolved` for a scout claim, so the orchestrator will need to resolve it. Environment issues: …", costUsd: 0.00375692 },
    { at: 37900, type: "ticket", ref: "den/04-scout", title: "04: Den task for scout", status: "in-review" },
  ]),
});
