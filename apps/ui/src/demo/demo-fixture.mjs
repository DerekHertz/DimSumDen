// den-v1/09: the recorded event stream Demo mode replays. Pure data; see README.md for how to re-record it.
//
// One pass is `loopMs` long. Each event has `at` (ms from the start of the pass); events are sorted by `at`.
//   ticket   { at, type, ref, title, status, role? }              upsert a ticket; `role` is the cell holding it (none: queued)
//   agent    { at, type, id, ref, role, state }                   a run starts, or changes state
//   tool     { at, type, agentId, name, summary, input?, result? }  a tool call (bubble); input/result also record a transcript line
//   say      { at, type, agentId, who: "agent" | "user", text }   a transcript message line
//   ask      { at, type, agentId, tool }                          the agent waits on the user (pending approval, lantern line)
//   answer   { at, type, agentId }                                the user answered; the agent carries on
//   ack      { at, type, agentId, text }                          the runtime acknowledged a message the user sent
// Agents `demo-qa` and `demo-dev-2` have no transcript lines, so the card shows F greyed for them; `demo-dev-1` has lines.
export const DEMO_FIXTURE = Object.freeze({
  loopMs: 40000,
  events: Object.freeze([
    { at: 0, type: "ticket", ref: "demo/01-login-form", title: "Login form", status: "claimed", role: "developer" },
    { at: 0, type: "agent", id: "demo-dev-1", ref: "demo/01-login-form", role: "developer", state: "working" },
    { at: 0, type: "ticket", ref: "demo/02-login-tests", title: "Login tests", status: "claimed", role: "qa" },
    { at: 0, type: "agent", id: "demo-qa", ref: "demo/02-login-tests", role: "qa", state: "working" },
    { at: 0, type: "ticket", ref: "demo/04-password-reset", title: "Password reset", status: "ready-for-agent" },
    { at: 800, type: "say", agentId: "demo-dev-1", who: "agent", text: "Reading the login spec before I touch the form." },
    { at: 2500, type: "tool", agentId: "demo-dev-1", name: "Read", summary: "src/login.js", input: { file_path: "src/login.js" }, result: "export function login(user, pass) { ... }" },
    { at: 5000, type: "tool", agentId: "demo-qa", name: "Bash", summary: "npm test" },
    { at: 7500, type: "tool", agentId: "demo-dev-1", name: "Edit", summary: "src/login.js", input: { file_path: "src/login.js" }, result: "Edited 12 lines" },
    { at: 10000, type: "ticket", ref: "demo/03-login-docs", title: "Login docs", status: "claimed", role: "developer" },
    { at: 10000, type: "agent", id: "demo-dev-2", ref: "demo/03-login-docs", role: "developer", state: "working" },
    { at: 11000, type: "tool", agentId: "demo-dev-2", name: "Grep", summary: "login docs" },
    { at: 14000, type: "ask", agentId: "demo-dev-1", tool: "Bash" },
    { at: 20000, type: "answer", agentId: "demo-dev-1" },
    { at: 20500, type: "tool", agentId: "demo-dev-1", name: "Bash", summary: "npm test", input: { command: "npm test" }, result: "12 passed" },
    { at: 24000, type: "say", agentId: "demo-dev-1", who: "user", text: "Keep the login form keyboard friendly." },
    { at: 24500, type: "ack", agentId: "demo-dev-1", text: "Keep the login form keyboard friendly." },
    { at: 26000, type: "say", agentId: "demo-dev-1", who: "agent", text: "Will do. Every control stays reachable by keyboard." },
    { at: 29000, type: "tool", agentId: "demo-qa", name: "Read", summary: "login.test.js" },
    { at: 32000, type: "tool", agentId: "demo-dev-2", name: "Write", summary: "docs/login.md" },
  ]),
});
