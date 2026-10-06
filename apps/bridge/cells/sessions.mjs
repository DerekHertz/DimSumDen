// organism-infra/140 (ADR 0016 decision 4 and 6.9): the append-only registry at .scratch/_run/sessions.jsonl.
// Two calls: append(event) and replay(). The file is untrusted input (any cell on the account can write it), so
// replay validates every field, drops what fails, and returns plain data only. Nothing read here is ever signalled.
import { mkdir, chmod, appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { AGENT_ID_RE, REF_RE, ROLES, UUID_RE } from "./policy.mjs";

const END_STATES = ["terminated", "done", "failed"];
const MAX_REASON = 200;

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const validTs = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));

// Returns a clean line or null. Unknown keys (a pid, a command, a cwd) are not copied.
export function validateLine(raw) {
  if (!isObject(raw) || !validTs(raw.ts) || !AGENT_ID_RE.test(raw.agentId) || typeof raw.ref !== "string" || !REF_RE.test(raw.ref)) return null;
  const base = { ts: raw.ts, agentId: raw.agentId, ref: raw.ref };
  if (raw.event === "spawn") {
    if (!ROLES.includes(raw.role) || typeof raw.sessionId !== "string" || !UUID_RE.test(raw.sessionId)) return null;
    return { ...base, event: "spawn", role: raw.role, sessionId: raw.sessionId };
  }
  if (raw.event === "stop") return { ...base, event: "stop" };
  if (raw.event === "end") {
    if (!END_STATES.includes(raw.state)) return null;
    const reason = typeof raw.reason === "string" ? raw.reason.slice(0, MAX_REASON).replace(/[^\x20-\x7e]/g, "?") : null;
    return { ...base, event: "end", state: raw.state, reason };
  }
  return null;
}

export function createSessions(root) {
  const dir = path.join(root, ".scratch", "_run");
  const file = path.join(dir, "sessions.jsonl");
  let ensured = null;
  let chain = Promise.resolve();

  // Dir 0700, file 0600, set explicitly so a pre-existing looser mode is tightened too.
  const ensure = () =>
    (ensured ??= (async () => {
      await mkdir(dir, { recursive: true, mode: 0o700 });
      await chmod(dir, 0o700);
      await appendFile(file, "", { mode: 0o600 });
      await chmod(file, 0o600);
    })().catch((err) => {
      ensured = null;
      throw err;
    }));

  return {
    file,
    // Appends are serialised so lines land in the order they were issued.
    append(event) {
      const run = chain.then(async () => {
        await ensure();
        await appendFile(file, JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n");
      });
      chain = run.catch(() => {});
      return run;
    },
    // -> [{ agentId, ref, role, sessionId, startedAt, endedAt, state, reason }], oldest first. `state` is the end
    // state, or "terminated" with reason "bridge-restart-unverified" for a spawn that never got an end line.
    async replay() {
      let text;
      try {
        text = await readFile(file, "utf8");
      } catch {
        return [];
      }
      const agents = new Map();
      for (const rawLine of text.split("\n")) {
        if (!rawLine.trim()) continue;
        let parsed;
        try {
          parsed = JSON.parse(rawLine);
        } catch {
          continue;
        }
        const line = validateLine(parsed);
        if (!line) continue;
        if (line.event === "spawn") {
          if (!agents.has(line.agentId)) {
            agents.set(line.agentId, {
              agentId: line.agentId, ref: line.ref, role: line.role, sessionId: line.sessionId,
              startedAt: line.ts, endedAt: null, state: "terminated", reason: "bridge-restart-unverified",
            });
          }
        } else if (line.event === "end") {
          const a = agents.get(line.agentId);
          if (a && !a.ended) {
            Object.assign(a, { endedAt: line.ts, state: line.state, reason: line.reason, ended: true });
          }
        }
      }
      return [...agents.values()].map(({ ended, ...a }) => a);
    },
  };
}
