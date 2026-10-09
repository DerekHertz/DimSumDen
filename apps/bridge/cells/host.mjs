// organism-infra/140 (ADR 0016 decisions 2 to 4): the steering host. It owns the live-agent map, the one synchronous
// reservation, the kill escalation and the sessions.jsonl audit. Policy values come from policy.mjs and are injected;
// the usage reading and the board gate are injected too, so this module knows nothing about files other than its own
// registry, and nothing about HTTP. Two entries share one reservation:
//   dispatch(input)  the route entry: relay-hop roles are refused, and the ticket must hold the dispatch gate
//   start(input)     the internal entry (the relay runner): relay-hop roles allowed, no gate check; never a route
// Both resolve { ok: true, status: 201, agent, usageUnknown? } or { ok: false, status, error }.
import { randomBytes, randomUUID } from "node:crypto";
import { hasSecret } from "../../../scripts/exposure.mjs";
import {
  AGENT_ID_RE, KILL_GRACE_MS, LIVE_STATES, MAX_CONCURRENT_AGENTS, MODES, REF_RE, RELAY_HOP_ROLES, ROLES, SESSION_CAP,
  USAGE_REFUSE_AT, APPROVAL_TTL_MS, SHUTDOWN_SPAWN_WAIT_MS,
} from "./policy.mjs";
import { createSessions } from "./sessions.mjs";
import { createApprovalStore } from "./approvals.mjs";

const HISTORY_CAP = 200; // ended agents kept in the snapshot, oldest dropped first
const EVENT_DRAIN_MS = 250; // how long to wait for the event stream to end after the process exits

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

export function createHost({ root, runtime, policy = {}, readUsage = async () => null, checkGate = async () => "ok", onChange = () => {} }) {
  const maxConcurrent = Math.min(policy.maxConcurrent ?? MAX_CONCURRENT_AGENTS, SESSION_CAP);
  const sessionCap = Math.min(policy.sessionCap ?? SESSION_CAP, SESSION_CAP);
  const graceMs = policy.killGraceMs ?? KILL_GRACE_MS;
  const spawnWaitMs = Math.min(policy.spawnWaitMs ?? SHUTDOWN_SPAWN_WAIT_MS, SHUTDOWN_SPAWN_WAIT_MS);
  const sessions = createSessions(root);
  const agents = new Map(); // id -> record; insertion order is snapshot order
  const liveByRef = new Map(); // ref -> record, for every reserved or running agent
  const pending = new Set(); // spawns in flight
  let shuttingDown = false;
  let shutdownPromise = null;

  const view = (a) => ({
    id: a.id, ref: a.ref, role: a.role, mode: a.mode, runtime: a.runtimeId, sessionId: a.sessionId, state: a.state,
    startedAt: a.startedAt, lastEventAt: a.lastEventAt, tool: a.tool, tokens: a.tokens, capabilities: a.capabilities,
    resume: a.resume, reason: a.reason,
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
      syncWaiting(agents.get(approval.agentId));
    },
  });
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
        resume: resumeFor(h.sessionId), reason: h.reason, proc: null,
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

  async function admit(input, { route }) {
    const bad = checkShape(input);
    if (bad) return bad;
    const { ref, role } = input;
    const mode = input.mode ?? null;
    if (!runtime) return refuse(503, "no runtime is configured");
    if (shuttingDown) return refuse(503, "the bridge is shutting down");
    if (route) {
      if (RELAY_HOP_ROLES.includes(role)) return refuse(409, `${role} is a relay-hop role: dispatch the orchestrator, which runs the relay`);
      const gate = await checkGate(ref);
      if (gate === "unknown") return refuse(404, "no such ticket");
      if (gate !== "ok") return refuse(409, "the ticket has no dispatch gate");
    }
    const usage = await readUsage();
    if (typeof usage === "number" && usage >= USAGE_REFUSE_AT) return refuse(429, `five-hour usage is ${usage}% (limit ${USAGE_REFUSE_AT}%)`);

    // From here to the registration of the reservation there is no await: this is the one synchronous step.
    if (shuttingDown) return refuse(503, "the bridge is shutting down");
    if (liveByRef.has(ref)) return refuse(409, "this ticket already has a live agent");
    if (liveByRef.size >= maxConcurrent) return refuse(429, `max_concurrent_cells (${maxConcurrent}) reached`);
    if (liveByRef.size >= sessionCap) return refuse(429, `the ${sessionCap}-session cap is reached`);
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
    liveByRef.set(ref, agent);
    const run = spawnAgent(agent, route ? "POST /agents" : "start()", usage === null);
    pending.add(run);
    run.finally(() => pending.delete(run));
    return run;
  }

  async function spawnAgent(agent, routeName, usageUnknown) {
    const args = {
      role: agent.role, ...(agent.mode ? { mode: agent.mode } : {}), ref: agent.ref, cwd: root, sessionId: agent.sessionId,
      prompt: promptFor(agent),
    };
    let proc;
    try {
      proc = await runtime.spawn(args);
    } catch (err) {
      liveByRef.delete(agent.ref);
      console.error(`bridge: runtime failed to spawn ${agent.role} for ${agent.ref}: ${err?.message ?? err}`);
      return refuse(502, "the runtime failed to start the agent");
    }
    agent.proc = proc;
    agents.set(agent.id, agent);
    trimHistory();
    agent.finished = watch(agent);
    try {
      await sessions.append({ event: "spawn", agentId: agent.id, ref: agent.ref, role: agent.role, sessionId: agent.sessionId, route: routeName });
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

  // The prompt is a fixed template over validated fields only; no client string reaches it.
  const promptFor = (a) =>
    `You are the ${a.role} cell${a.mode ? ` in ${a.mode} mode` : ""} for ticket ${a.ref}. ` +
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
    await sessions
      .append({ event: "end", agentId: agent.id, ref: agent.ref, state: agent.state, ...(agent.reason ? { reason: agent.reason } : {}) })
      .catch((err) => console.error(`bridge: could not write sessions.jsonl: ${err.stack ?? err}`));
  }

  function apply(agent, event) {
    if (!event || typeof event !== "object" || agent.exited) return;
    let changed = true;
    if (event.type === "tool-start") {
      const name = clean(event.name, 100);
      if (!name) return;
      agent.tool = { name, summary: clean(event.summary, 200) ?? "" };
    } else if (event.type === "tool-end") agent.tool = null;
    else if (event.type === "usage") {
      if (!nonNegative(event.input) || !nonNegative(event.output)) return;
      agent.tokens = { input: event.input, output: event.output };
    } else if (event.type === "permission-request") {
      if (!agent.capabilities.approve) return;
      approvals.hold(agent.id, event, { accepting: !agent.stopRequested && !shuttingDown });
      return;
    } else if (event.type === "state") {
      if (!LIVE_STATES.includes(event.state) || agent.stopRequested) return;
      agent.reportedState = event.state;
      agent.state = approvals.pending(agent.id) > 0 ? "waiting_on_user" : event.state;
    } else if (event.type === "done") agent.doneOk = event.ok === true;
    else changed = false;
    if (!changed) return;
    agent.lastEventAt = new Date().toISOString();
    publish(agent);
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
    if (liveByRef.get(agent.ref) === agent) liveByRef.delete(agent.ref);
    publish(agent);
  }

  // Kill escalation (ADR 0016 decision 2): stdin close, grace, SIGTERM, grace, SIGKILL. The host owns the order
  // and the timers; the process only offers the primitives. Idempotent: a second call joins the first.
  function terminate(agent, reason = "stopped") {
    if (agent.killing) return agent.killing;
    agent.stopRequested = true;
    agent.reason ??= reason;
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
    agent.killing = (async () => {
      approvals.settleAgent(agent.id, reason === "bridge-shutdown" ? "bridge-shutdown" : "agent-stopped"); // answers deny while the child can hear
      step(() => agent.proc.closeInput());
      if (await exitedWithin(graceMs)) return;
      step(() => agent.proc.signal("SIGTERM"));
      if (await exitedWithin(graceMs)) return;
      step(() => agent.proc.signal("SIGKILL"));
      await exitedWithin(graceMs); // bounded, so shutdown cannot hang; finalize still waits for the real exit
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
    dispatch: (input) => admit(input, { route: true }),
    start: (input) => admit(input, { route: false }),
    stop,
    shutdown,
    killAllSync,
    snapshot: () => [...agents.values()].map(view),
    approvals: () => approvals.list(),
    approval: (id) => approvals.read(id),
    decide: (id, body) => approvals.decide(id, body),
  };
}
