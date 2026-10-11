// organism-infra/140 (ADR 0016 decisions 2 to 4): the steering host. It owns the live-agent map, the one synchronous
// reservation, the kill escalation and the sessions.jsonl audit. Policy values come from policy.mjs and are injected;
// the usage reading and the board gate are injected too, so this module knows nothing about files other than its own
// registry, and nothing about HTTP. (den-v1 loop S4: `recordRun(run)` is injected as well; it is called once per agent,
// after the end line is written, with the run record.) Three entries share one reservation:
//   dispatch(input)  the route entry: relay-hop roles are refused, and the ticket must hold the dispatch gate
//   start(input)     the internal entry (the relay runner): relay-hop roles allowed, no gate check; never a route
//   direct(input)    the den's entry (POST /tasks): any role, on a ticket the caller writes once the host has room
// All resolve { ok: true, status: 201, agent, usageUnknown? } or { ok: false, status, error }.
// den-v1 loop S5: message(id, { text }) writes one user message to a running agent (see "messages" below).
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { hasSecret } from "../../../scripts/exposure.mjs";
import {
  AGENT_ID_RE, KILL_GRACE_MS, LIVE_STATES, MAX_CONCURRENT_AGENTS, MODES, REF_RE, RELAY_HOP_ROLES, ROLES, SESSION_CAP,
  USAGE_REFUSE_AT, APPROVAL_TTL_MS, SHUTDOWN_SPAWN_WAIT_MS, DIRECT_MODE,
  TRANSCRIPT_AGENTS, TRANSCRIPT_ENTRIES, TRANSCRIPT_RESULT_MAX, TRANSCRIPT_TEXT_MAX, REPLY_EXCERPT_MAX, USAGE_MESSAGES,
  MESSAGE_MAX_BYTES, MESSAGE_QUEUE_MAX, MESSAGE_SETTLE_MS,
} from "./policy.mjs";
import { createSessions } from "./sessions.mjs";
import { createApprovalStore, cleanText } from "./approvals.mjs";
import { createWorkspaces } from "./workspace.mjs";
import { TIERS, readCost, readCount, readModel, readTiers } from "./run-record.mjs";

const HISTORY_CAP = 200; // ended agents kept in the snapshot, oldest dropped first
const EVENT_DRAIN_MS = 250; // how long to wait for the event stream to end after the process exits

const ENTRY_ROUTES = { dispatch: "POST /agents", start: "start()", direct: "POST /tasks" }; // the audit's `route`
const refuse = (status, error) => ({ ok: false, status, error });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nonNegative = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;

// Cell output is untrusted text (ADR 0016 6.4, 6.8): control and bidirectional-override characters are replaced,
// the length is capped, and anything that matches a secret pattern is masked whole.
function clean(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").slice(0, max);
  return hasSecret(text) ? "[masked: possible secret]" : text;
}

// Transcript text (den-v1 loop S2): the same rule, for text that is read as written. Secrets are masked span by span
// and control and bidirectional characters are shown as escapes (newlines and tabs stay), then the length is capped.
// `more` is what the runtime already cut. Returns null for anything that is not readable text.
function cleanBody(value, max, more = 0) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const text = cleanText(value);
  const dropped = Math.max(0, text.length - max) + (Number.isInteger(more) && more > 0 ? more : 0);
  return dropped ? `${text.slice(0, max)}\n[clipped: ${dropped} more characters]` : text;
}

// The final reply as the card shows it (den-v1 loop S4): cleaned the same way, on one line, cut short.
function excerpt(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const flat = cleanText(value).replace(/\s+/g, " ").trim();
  return flat.length > REPLY_EXCERPT_MAX ? `${flat.slice(0, REPLY_EXCERPT_MAX)}…` : flat;
}

export function createHost({ root, runtime, policy = {}, readUsage = async () => null, checkGate = async () => "ok", onChange = () => {}, recordRun = async () => {} }) {
  const maxConcurrent = Math.min(policy.maxConcurrent ?? MAX_CONCURRENT_AGENTS, SESSION_CAP);
  const sessionCap = Math.min(policy.sessionCap ?? SESSION_CAP, SESSION_CAP);
  const graceMs = policy.killGraceMs ?? KILL_GRACE_MS;
  const spawnWaitMs = Math.min(policy.spawnWaitMs ?? SHUTDOWN_SPAWN_WAIT_MS, SHUTDOWN_SPAWN_WAIT_MS);
  const messageSettleMs = Math.min(policy.messageSettleMs ?? MESSAGE_SETTLE_MS, MESSAGE_SETTLE_MS);
  const sessions = createSessions(root);
  const workspaces = createWorkspaces(root);
  const agents = new Map(); // id -> record; insertion order is snapshot order
  const liveByRef = new Map(); // ref -> record, for every reserved or running agent
  const pending = new Set(); // spawns in flight
  const transcripts = new Map(); // agentId -> { entries, dropped, next }, for the newest TRANSCRIPT_AGENTS agents
  let shuttingDown = false;
  let shutdownPromise = null;

  const view = (a) => ({
    id: a.id, ref: a.ref, role: a.role, mode: a.mode, runtime: a.runtimeId, sessionId: a.sessionId, state: a.state,
    startedAt: a.startedAt, lastEventAt: a.lastEventAt, tool: a.tool, tokens: a.tokens, capabilities: a.capabilities,
    resume: a.resume, reason: a.reason, worktree: a.worktree ?? null, branch: a.branch ?? null,
    model: a.model ?? null, usage: a.usage ?? null, costUsd: a.costUsd ?? null, reply: a.reply ?? null, durationMs: a.durationMs ?? null,
  });
  const publish = (a) => onChange({ type: "agent", agent: view(a) });
  // Held permission requests (organism-infra/141). The store knows no process; these callbacks are its only way out.
  const approvals = createApprovalStore({
    ttlMs: Math.min(policy.approvalTtlMs ?? APPROVAL_TTL_MS, APPROVAL_TTL_MS),
    canAnswer: (id) => !!agents.get(id)?.proc && !agents.get(id).exited,
    isLive: (id) => { const a = agents.get(id); return !!a?.proc && !a.exited && !a.stopRequested; },
    answer: (id, requestId, verdict) => agents.get(id).proc.decide(requestId, verdict),
    audit: ({ approval, decision, note }) =>
      sessions.append({ event: "decision", agentId: approval.agentId, ref: agents.get(approval.agentId)?.ref, approvalId: approval.id, decision, route: "POST /approvals/:id", ...(note ? { note } : {}) }),
    onChange: (approval) => {
      onChange({ type: "approval", approval });
      notePermission(agents.get(approval.agentId), approval);
      syncWaiting(agents.get(approval.agentId));
    },
  });

  // ---- transcript (den-v1 loop S2, amendment 10) --------------------------------------------
  // Each entry goes out once as a change frame and is kept in a small per-agent buffer that rides the snapshot, so
  // a reloaded page can refill its panel. An entry's `id` is its number in that agent's transcript; revise() sends
  // the same id again with new fields. Entries hold cleaned text only, and never a tool's input.
  function record(agent, entry) {
    let buffer = transcripts.get(agent.id);
    if (!buffer) {
      transcripts.set(agent.id, (buffer = { entries: [], dropped: 0, next: 1 }));
      for (const [id] of transcripts) {
        if (transcripts.size <= TRANSCRIPT_AGENTS) break;
        const other = agents.get(id);
        if (id !== agent.id && !(other?.proc && !other.exited)) transcripts.delete(id);
      }
    }
    const full = { id: buffer.next, at: new Date().toISOString(), ...entry };
    buffer.next += 1;
    buffer.entries.push(full);
    if (buffer.entries.length > TRANSCRIPT_ENTRIES) {
      buffer.entries.shift();
      buffer.dropped += 1;
    }
    onChange({ type: "transcript", agentId: agent.id, entry: full });
    return full.id;
  }
  function revise(agent, id, patch) {
    const buffer = transcripts.get(agent.id);
    const at = buffer ? buffer.entries.findIndex((e) => e.id === id) : -1;
    if (at < 0) return; // already dropped from the buffer: no page shows it either
    const full = { ...buffer.entries[at], ...patch };
    buffer.entries[at] = full;
    onChange({ type: "transcript", agentId: agent.id, entry: full });
  }
  // A running tool's entry is closed by its result (matched by the runtime's tool id), by a bare tool-end (the
  // latest one still running), or when the agent ends.
  function closeTool(agent, toolId, patch) {
    const open = agent.openTools;
    const key = typeof toolId === "string" && toolId !== "" ? (open.has(toolId) ? toolId : null) : [...open.keys()].at(-1) ?? null;
    if (key === null) return;
    revise(agent, open.get(key), patch);
    open.delete(key);
  }
  function notePermission(agent, approval) {
    if (!agent) return;
    const known = agent.permissionEntries.get(approval.id);
    if (known !== undefined) {
      revise(agent, known, { status: approval.state });
      if (approval.state !== "pending") agent.permissionEntries.delete(approval.id);
    } else if (approval.state === "pending") agent.permissionEntries.set(approval.id, record(agent, { kind: "permission", name: approval.tool, status: "pending" }));
  }
  const transcriptView = () =>
    Object.fromEntries([...transcripts].map(([id, b]) => [id, { entries: b.entries.slice(), dropped: b.dropped }]));
  // An agent with a pending approval waits on the user; once none is pending it shows the state its runtime reported.
  function syncWaiting(agent) {
    if (!agent || agent.exited || agent.stopRequested || !agent.proc) return;
    const want = approvals.pending(agent.id) > 0 ? "waiting_on_user" : agent.reportedState;
    if (agent.state === want) return;
    agent.state = want;
    agent.lastEventAt = new Date().toISOString();
    publish(agent);
  }
  const resumeFor = (sessionId) => (runtime ? runtime.resumeCommand(sessionId) : null);

  async function replay() {
    for (const h of await sessions.replay()) {
      agents.set(h.agentId, {
        id: h.agentId, ref: h.ref, role: h.role, mode: null, runtimeId: runtime?.id ?? null, sessionId: h.sessionId,
        state: h.state, startedAt: h.startedAt, lastEventAt: h.endedAt ?? h.startedAt, tool: null, tokens: null,
        capabilities: { stop: false, approve: false, send: false, handover: runtime?.capabilities?.handover === true },
        resume: resumeFor(h.sessionId), reason: h.reason, worktree: h.worktree, branch: h.branch, proc: null,
        model: h.model, usage: h.usage, costUsd: h.costUsd, durationMs: h.durationMs,
      });
    }
    trimHistory();
  }
  const ready = replay().catch((err) => console.error(`bridge: sessions replay failed: ${err.stack ?? err}`));

  function trimHistory() {
    for (const [id, a] of agents) {
      if (agents.size <= HISTORY_CAP) return;
      if (!liveByRef.has(a.ref) || liveByRef.get(a.ref) !== a) agents.delete(id);
    }
  }

  // Shape check shared by both entries. Returns a refusal or null.
  function checkShape(input) {
    if (!input || typeof input !== "object") return refuse(400, "body must be an object");
    const { ref, role, mode } = input;
    if (typeof role !== "string" || !ROLES.includes(role)) return refuse(400, `role must be one of: ${ROLES.join(", ")}`);
    if (typeof ref !== "string" || !REF_RE.test(ref)) return refuse(400, "ref must look like <feature>/<NN>-<slug>");
    if (mode !== undefined && (typeof mode !== "string" || !MODES.includes(mode))) return refuse(400, `mode must be one of: ${MODES.join(", ")}`);
    return null;
  }

  // The refusals that depend on no ticket. admit() applies them in this order; direct() asks them all before a
  // ticket is written.
  const down = () => (!runtime ? refuse(503, "no runtime is configured") : shuttingDown ? refuse(503, "the bridge is shutting down") : null);
  const overUsage = (usage) =>
    typeof usage === "number" && usage >= USAGE_REFUSE_AT ? refuse(429, `five-hour usage is ${usage}% (limit ${USAGE_REFUSE_AT}%)`) : null;
  const full = () =>
    liveByRef.size >= maxConcurrent ? refuse(429, `max_concurrent_cells (${maxConcurrent}) reached`)
      : liveByRef.size >= sessionCap ? refuse(429, `the ${sessionCap}-session cap is reached`) : null;

  // entry: "dispatch" | "start" | "direct" (the three entries in the header).
  async function admit(input, { entry }) {
    const bad = checkShape(input);
    if (bad) return bad;
    const { ref, role } = input;
    const mode = entry === "direct" ? DIRECT_MODE : input.mode ?? null;
    const notUp = down();
    if (notUp) return notUp;
    if (entry === "dispatch") {
      if (RELAY_HOP_ROLES.includes(role)) return refuse(409, `${role} is a relay-hop role: dispatch the orchestrator, which runs the relay`);
      const gate = await checkGate(ref);
      if (gate === "unknown") return refuse(404, "no such ticket");
      if (gate !== "ok") return refuse(409, "the ticket has no dispatch gate");
    }
    const usage = await readUsage();
    const over = overUsage(usage);
    if (over) return over;

    // From here to the registration of the reservation there is no await: this is the one synchronous step.
    if (shuttingDown) return refuse(503, "the bridge is shutting down");
    if (liveByRef.has(ref)) return refuse(409, "this ticket already has a live agent");
    const noRoom = full();
    if (noRoom) return noRoom;
    const agent = {
      id: `c-${randomBytes(8).toString("hex")}`, ref, role, mode, runtimeId: runtime.id, sessionId: randomUUID(), state: "working",
      startedAt: new Date().toISOString(), lastEventAt: null, tool: null, tokens: null,
      capabilities: {
        stop: runtime.capabilities?.stop === true, approve: runtime.capabilities?.approve === true,
        send: runtime.capabilities?.send === true, handover: runtime.capabilities?.handover === true,
      },
      resume: null, reason: null, proc: null, reportedState: "working", exited: false, killing: null, stopRequested: false, doneOk: null,
    };
    agent.lastEventAt = agent.startedAt;
    agent.openTools = new Map(); // the runtime's tool id (or a local key) -> transcript entry id, while running
    agent.permissionEntries = new Map(); // approval id -> transcript entry id
    agent.usageByMessage = new Map(); // message id -> the tiers last counted for it
    agent.messages = new Map(); // id of a message written and not yet taken -> its transcript entry id
    liveByRef.set(ref, agent);
    const run = spawnAgent(agent, ENTRY_ROUTES[entry], usage === null);
    pending.add(run);
    run.finally(() => pending.delete(run));
    return run;
  }

  // The den's entry (ADR 0016 decision 3, amendment 9). The ticket does not exist yet: `createTicket(role)` writes it
  // and resolves { ref }, and it is called only once the role is known and the host has room, so a refused task
  // writes nothing. Calls run one at a time, so two tasks posted at once cannot both write a ticket for one free
  // slot. Any role may be started: the ticket is one the caller wrote for this request, so there is no gate to check.
  // A refusal after the ticket is written (the spawn failed, or a dispatch took the slot meanwhile) names the ticket.
  let directChain = Promise.resolve();
  function direct(input) {
    const run = directChain.then(() => directOne(input));
    directChain = run.catch(() => {});
    return run;
  }
  async function directOne(input) {
    const { role, createTicket } = input && typeof input === "object" ? input : {};
    if (typeof role !== "string" || !ROLES.includes(role)) return refuse(400, `role must be one of: ${ROLES.join(", ")}`);
    const early = down() ?? overUsage(await readUsage()) ?? full();
    if (early) return early;
    let ref;
    try {
      ({ ref } = await createTicket(role));
    } catch (err) {
      console.error(`bridge: could not write a ticket for a ${role} task: ${err?.message ?? err}`);
      return refuse(500, "could not write the task's ticket");
    }
    return { ...(await admit({ ref, role }, { entry: "direct" })), ticket: { ref } };
  }

  async function spawnAgent(agent, routeName, usageUnknown) {
    // The agent's own worktree and branch (ADR 0016 decision 3, amendment 7): no agent runs in the repo root, and
    // without a worktree nothing is spawned.
    let workspace;
    try {
      workspace = await workspaces.create({ ref: agent.ref, agentId: agent.id });
    } catch (err) {
      liveByRef.delete(agent.ref);
      console.error(`bridge: could not create a worktree for ${agent.ref}: ${err?.message ?? err}`);
      return refuse(500, "could not create the agent's worktree");
    }
    agent.worktree = workspace.worktree;
    agent.branch = workspace.branch;
    const args = {
      role: agent.role, ...(agent.mode ? { mode: agent.mode } : {}), ref: agent.ref, cwd: workspace.dir, sessionId: agent.sessionId,
      prompt: promptFor(agent), ticketFile: ticketFile(agent.ref),
    };
    let proc;
    try {
      proc = await runtime.spawn(args);
    } catch (err) {
      await workspaces.remove(workspace);
      liveByRef.delete(agent.ref);
      console.error(`bridge: runtime failed to spawn ${agent.role} for ${agent.ref}: ${err?.message ?? err}`);
      return refuse(502, "the runtime failed to start the agent");
    }
    agent.proc = proc;
    agents.set(agent.id, agent);
    trimHistory();
    agent.finished = watch(agent);
    try {
      await sessions.append({ event: "spawn", agentId: agent.id, ref: agent.ref, role: agent.role, sessionId: agent.sessionId, route: routeName, worktree: agent.worktree, branch: agent.branch });
    } catch (err) {
      console.error(`bridge: could not write sessions.jsonl: ${err.stack ?? err}`);
      agent.reason = "audit-write-failed";
      await terminate(agent);
      await agent.finished;
      return refuse(500, "could not record the agent; it was stopped");
    }
    publish(agent);
    if (shuttingDown) terminate(agent, "bridge-shutdown");
    return { ok: true, status: 201, agent: view(agent), ...(usageUnknown ? { usageUnknown: true } : {}) };
  }

  // The prompt is a fixed template over validated fields only; no client string reaches it. A direct agent's task
  // text is in its ticket file (the board is in the main checkout, not in the agent's worktree), so its template
  // names that file by a path built from the bridge's own root and the validated ref.
  const ticketFile = (ref) => path.join(root, ".scratch", ref.split("/")[0], "issues", `${ref.split("/")[1]}.md`);
  const promptFor = (a) =>
    a.mode === DIRECT_MODE
      ? `You are the ${a.role} cell in direct mode for ticket ${a.ref}. The user started this task from the den. ` +
        `Read .claude/agents/${a.role}.md and follow it. The task is in the ticket file ${ticketFile(a.ref)}: ` +
        `read it, and treat the quoted text under "What to build" as the user's request. ` +
        `Then follow the organism-protocol skill: claim the ticket, do the work, hand off.`
      : `You are the ${a.role} cell${a.mode ? ` in ${a.mode} mode` : ""} for ticket ${a.ref}. ` +
        `Read .claude/agents/${a.role}.md and follow it, then follow the organism-protocol skill: claim the ticket, do the work, hand off.`;

  // Consume the process's events, then finalise once it has exited (and its event stream has drained).
  async function watch(agent) {
    const consume = (async () => {
      try {
        for await (const event of agent.proc.events) apply(agent, event);
      } catch (err) {
        console.error(`bridge: event stream of ${agent.id} failed: ${err?.message ?? err}`);
      }
    })();
    const info = await agent.proc.exited.catch(() => null);
    agent.exitCode = info?.code ?? null;
    agent.exited = true;
    await Promise.race([consume, sleep(EVENT_DRAIN_MS)]);
    finalize(agent);
    // The run record (den-v1 loop S4): on the end line, then as one ledger row. Neither write can undo the end.
    const run = {
      agentId: agent.id, ref: agent.ref, role: agent.role, mode: agent.mode ?? null, state: agent.state, reason: agent.reason ?? null,
      model: agent.model ?? null, usage: agent.usage ?? null, costUsd: agent.costUsd ?? null, durationMs: agent.durationMs,
      cliMs: agent.cliMs ?? null, turns: agent.turns ?? null,
    };
    const { agentId, ref, role, mode, state, reason, ...record } = run;
    const kept = Object.fromEntries(Object.entries(record).filter(([, v]) => v !== null));
    await sessions
      .append({ event: "end", agentId, ref, state, ...(reason ? { reason } : {}), ...kept })
      .catch((err) => console.error(`bridge: could not write sessions.jsonl: ${err.stack ?? err}`));
    await Promise.resolve()
      .then(() => recordRun(run))
      .catch((err) => console.error(`bridge: could not write the run's ledger row: ${err?.message ?? err}`));
  }

  // Running tokens by tier. A message is reported on several lines, so its last count replaces its earlier one.
  function countUsage(agent, event) {
    const tiers = readTiers(event.tiers);
    if (!tiers || agent.usage?.final) return;
    const key = typeof event.message === "string" && event.message !== "" && event.message.length <= 200 ? event.message : null;
    const before = key ? agent.usageByMessage.get(key) : undefined;
    agent.usage = { ...Object.fromEntries(TIERS.map((k) => [k, (agent.usage?.[k] ?? 0) - (before?.[k] ?? 0) + tiers[k]])), final: false };
    if (!key) return;
    agent.usageByMessage.set(key, tiers);
    // A message this old stays counted; only its chance to be corrected goes.
    if (agent.usageByMessage.size > USAGE_MESSAGES) agent.usageByMessage.delete(agent.usageByMessage.keys().next().value);
  }

  function apply(agent, event) {
    if (!event || typeof event !== "object" || agent.exited) return;
    let changed = true;
    if (event.type === "tool-start") {
      const name = clean(event.name, 100);
      if (!name) return;
      agent.tool = { name, summary: clean(event.summary, 200) ?? "" };
      const entry = record(agent, { kind: "tool", name, summary: agent.tool.summary, status: "running" });
      const usable = typeof event.id === "string" && event.id !== "" && event.id.length <= 200 && !agent.openTools.has(event.id);
      agent.openTools.set(usable ? event.id : `#${entry}`, entry);
      // A tool call that never ends is forgotten once its entry has left the buffer anyway.
      if (agent.openTools.size > TRANSCRIPT_ENTRIES) agent.openTools.delete(agent.openTools.keys().next().value);
    } else if (event.type === "tool-end") {
      agent.tool = null;
      closeTool(agent, event.id, { status: "done" });
    } else if (event.type === "tool-result") {
      // The result closes its own tool call; the tool-end that follows it then finds nothing left to close.
      const result = cleanBody(event.text, TRANSCRIPT_RESULT_MAX, event.more);
      if (typeof event.id === "string" && event.id !== "") closeTool(agent, event.id, { status: event.ok === false ? "failed" : "done", ...(result === null ? {} : { result }) });
      return touch(agent);
    } else if (event.type === "text" || event.type === "reply") {
      const text = cleanBody(event.text, TRANSCRIPT_TEXT_MAX, event.more);
      // The CLI's result line repeats the last text block as the reply; that is one row, not two.
      if (text !== null && !(event.type === "reply" && text === agent.lastText)) record(agent, { kind: "message", role: "agent", text });
      if (text !== null) agent.lastText = text;
      if (event.type === "reply") agent.reply = excerpt(event.text) ?? agent.reply; // shown once done publishes
      return touch(agent);
    } else if (event.type === "usage") {
      if (!nonNegative(event.input) || !nonNegative(event.output)) return;
      agent.tokens = { input: event.input, output: event.output };
      countUsage(agent, event);
    } else if (event.type === "model") {
      const model = readModel(event.model);
      if (!model || model === agent.model) return;
      agent.model = model;
    } else if (event.type === "message-applied") {
      // The child took a message: the turn that answers it is under way, so a wait for it (below) is over.
      const entry = typeof event.id === "string" ? agent.messages.get(event.id) : undefined;
      if (entry === undefined) return;
      agent.messages.delete(event.id);
      clearTimeout(agent.settleTimer);
      // After a done, this is a further turn: the verdict and the totals reported so far are no longer the run's last
      // word, so the running count goes on from them until that turn's own done.
      if (agent.doneOk !== null) {
        agent.doneOk = null;
        if (agent.usage?.final) agent.usage = { ...agent.usage, final: false };
      }
      revise(agent, entry, { status: "applied" });
      return touch(agent);
    } else if (event.type === "permission-request") {
      if (!agent.capabilities.approve) return;
      approvals.hold(agent.id, event, { accepting: !agent.stopRequested && !shuttingDown });
      return;
    } else if (event.type === "state") {
      if (!LIVE_STATES.includes(event.state) || agent.stopRequested) return;
      agent.reportedState = event.state;
      agent.state = approvals.pending(agent.id) > 0 ? "waiting_on_user" : event.state;
    } else if (event.type === "done") {
      agent.doneOk = event.ok === true;
      // The run's own totals (den-v1 loop S4) are truer than the running count, whose output is partial.
      const tiers = readTiers(event.tiers);
      if (tiers) agent.usage = { ...tiers, final: true };
      agent.costUsd = readCost(event.costUsd) ?? agent.costUsd ?? null;
      agent.cliMs = readCount(event.durationMs) ?? agent.cliMs ?? null;
      agent.turns = readCount(event.turns) ?? agent.turns ?? null;
      // A message still queued (den-v1 loop S5) will be taken as a further turn, whose own done ends the agent;
      // if the child never takes it, the wait ends the agent anyway.
      if (agent.messages.size === 0) release(agent);
      else {
        clearTimeout(agent.settleTimer);
        agent.settleTimer = setTimeout(() => release(agent), messageSettleMs);
        agent.settleTimer.unref?.();
      }
    } else changed = false;
    if (!changed) return;
    agent.lastEventAt = new Date().toISOString();
    publish(agent);
  }
  // A transcript-only event: the agent was heard from, but nothing the agent frame shows has changed.
  function touch(agent) {
    agent.lastEventAt = new Date().toISOString();
  }

  // The process has exited: only now is the agent over, the slot free and the resume string set.
  function finalize(agent) {
    // A done event is the cell's own verdict; with none, a clean exit is done and anything else failed.
    const ok = agent.doneOk ?? agent.exitCode === 0;
    agent.state = agent.stopRequested ? "terminated" : ok ? "done" : "failed";
    agent.tool = null;
    approvals.settleAgent(agent.id, "agent-exited");
    approvals.release(agent.id);
    agent.resume = resumeFor(agent.sessionId);
    agent.lastEventAt = new Date().toISOString();
    agent.durationMs = Math.max(0, Date.parse(agent.lastEventAt) - Date.parse(agent.startedAt));
    if (liveByRef.get(agent.ref) === agent) liveByRef.delete(agent.ref);
    for (const entry of agent.openTools.values()) revise(agent, entry, { status: "stopped" });
    agent.openTools.clear();
    clearTimeout(agent.settleTimer);
    for (const entry of agent.messages.values()) revise(agent, entry, { status: "undelivered" });
    agent.messages.clear();
    record(agent, { kind: "ended", state: agent.state });
    publish(agent);
  }

  // Kill escalation (ADR 0016 decision 2): stdin close, grace, SIGTERM, grace, SIGKILL. The host owns the order
  // and the timers; the process only offers the primitives.
  async function escalate(agent) {
    const exitedWithin = (ms) => {
      let timer;
      return Promise.race([agent.proc.exited.then(() => true, () => true), new Promise((r) => (timer = setTimeout(() => r(false), ms)))]).finally(() => clearTimeout(timer));
    };
    const step = (fn) => {
      try {
        fn();
      } catch (err) {
        console.error(`bridge: kill step failed for ${agent.id}: ${err?.message ?? err}`);
      }
    };
    step(() => agent.proc.closeInput());
    if (await exitedWithin(graceMs)) return;
    step(() => agent.proc.signal("SIGTERM"));
    if (await exitedWithin(graceMs)) return;
    step(() => agent.proc.signal("SIGKILL"));
    await exitedWithin(graceMs); // bounded, so shutdown cannot hang; finalize still waits for the real exit
  }

  // The runtime reported done (den-v1 loop S3, amendment 8): the work is over, but the live CLI stays up until its
  // stdin closes, so the host ends the process with the same sequence. Not a stop: finalize keeps the done verdict.
  function release(agent) {
    if (agent.releasing || agent.killing) return;
    agent.releasing = escalate(agent);
  }

  // A stop (user, shutdown): the same sequence, and the agent ends `terminated`. Idempotent: a second call joins the first.
  function terminate(agent, reason = "stopped") {
    if (agent.killing) return agent.killing;
    agent.stopRequested = true;
    agent.reason ??= reason;
    agent.killing = (async () => {
      approvals.settleAgent(agent.id, reason === "bridge-shutdown" ? "bridge-shutdown" : "agent-stopped"); // answers deny while the child can hear
      await (agent.releasing ?? escalate(agent)); // a release already under way is the same sequence: join it
    })();
    return agent.killing;
  }

  async function stop(id) {
    const agent = typeof id === "string" && AGENT_ID_RE.test(id) ? agents.get(id) : undefined;
    if (!agent) return refuse(404, "no such agent");
    if (!agent.proc || agent.exited || agent.state === "terminated") return refuse(409, "the agent has already ended");
    if (!agent.killing) {
      sessions.append({ event: "stop", agentId: agent.id, ref: agent.ref, route: "POST /agents/:id/stop" }).catch((err) => console.error(`bridge: could not write sessions.jsonl: ${err.stack ?? err}`));
      terminate(agent, "stopped-by-user");
    }
    return { ok: true, status: 202 };
  }

  // ---- messages (den-v1 loop S5, amendment 12) -------------------------------------------------
  // One user message to a running agent. The text is the user's own and goes to the child's stdin as typed; what the
  // page shows of it is cleaned like any other transcript text, and the audit line holds its size, never the text.
  // The entry is recorded `queued` before the write, becomes `applied` when the runtime reports the child took it,
  // and `undelivered` if the write fails or the agent ends first.
  async function message(id, body) {
    const agent = typeof id === "string" && AGENT_ID_RE.test(id) ? agents.get(id) : undefined;
    if (!agent) return refuse(404, "no such agent");
    if (!agent.proc || agent.exited) return refuse(409, "the agent has already ended");
    if (agent.stopRequested || shuttingDown) return refuse(409, "the agent is being stopped");
    if (!agent.capabilities.send || typeof agent.proc.send !== "function") return refuse(409, "this agent's runtime cannot take a message");
    if (agent.releasing) return refuse(409, "the agent has finished its work");
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return refuse(400, "text must be a non-empty string");
    const bytes = Buffer.byteLength(text);
    if (bytes > MESSAGE_MAX_BYTES) return refuse(400, `text must be at most ${MESSAGE_MAX_BYTES} bytes`);
    if (hasSecret(text)) return refuse(400, "text looks like it holds a secret; nothing was sent");
    if (agent.messages.size >= MESSAGE_QUEUE_MAX) return refuse(429, `${MESSAGE_QUEUE_MAX} messages are still waiting for this agent`);

    // From the checks above to the registration there is no await, so the cap and the state hold for this message.
    const messageId = randomUUID();
    const entry = record(agent, { kind: "message", role: "user", text: cleanBody(text, TRANSCRIPT_TEXT_MAX) ?? "", messageId, status: "queued" });
    agent.messages.set(messageId, entry);
    sessions
      .append({ event: "message", agentId: agent.id, ref: agent.ref, messageId, bytes, route: "POST /agents/:id/message" })
      .catch((err) => console.error(`bridge: could not write sessions.jsonl: ${err.stack ?? err}`));
    try {
      await agent.proc.send(messageId, text);
    } catch (err) {
      console.error(`bridge: could not write a message to ${agent.id}: ${err?.message ?? err}`);
      if (agent.messages.delete(messageId)) revise(agent, entry, { status: "undelivered" });
      return refuse(502, "the agent could not take the message");
    }
    return { ok: true, status: 202, messageId };
  }

  // Runs the kill sequence on every live agent and resolves once each has exited and been recorded. Idempotent.
  // The wait for spawns in flight is bounded (security finding 3, PR #177): past the bound the live agents are killed
  // synchronously, and a spawn that lands late is terminated by spawnAgent itself.
  function shutdown() {
    shuttingDown = true;
    return (shutdownPromise ??= (async () => {
      let timer;
      const inBound = await Promise.race([
        Promise.allSettled([...pending]).then(() => true),
        new Promise((resolve) => (timer = setTimeout(() => resolve(false), spawnWaitMs))),
      ]);
      clearTimeout(timer);
      const live = [...agents.values()].filter((a) => a.proc && !a.exited);
      if (inBound) await Promise.all(live.map((a) => terminate(a, "bridge-shutdown")));
      else {
        for (const a of live) a.reason ??= "bridge-shutdown";
        killAllSync();
      }
      await Promise.all(live.map((a) => a.finished));
    })());
  }

  // For the process 'exit' event, where nothing can be awaited: SIGKILL everything still running.
  function killAllSync() {
    for (const a of agents.values()) {
      if (!a.proc || a.exited) continue;
      try {
        a.proc.signal("SIGKILL");
      } catch {
        // nothing more can be done at exit
      }
    }
  }

  return {
    ready,
    dispatch: (input) => admit(input, { entry: "dispatch" }),
    start: (input) => admit(input, { entry: "start" }),
    direct,
    stop,
    message,
    shutdown,
    killAllSync,
    snapshot: () => [...agents.values()].map(view),
    approvals: () => approvals.list(),
    transcripts: transcriptView,
    approval: (id) => approvals.read(id),
    decide: (id, body) => approvals.decide(id, body),
  };
}
