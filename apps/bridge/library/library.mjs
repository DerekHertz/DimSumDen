// den-mvp outcome 4 (spec section 3, ADR 0025): the library as the bridge keeps it. The catalog says what a role may
// use; this adds what was seen: how each connection stood when an agent last started with it, and each use of one of
// its tools. Both go to an append-only log in the bridge's state directory (outside every worktree) and are read back
// at start. A use line holds the tool's name and the decision, never the tool's input or its result.
//   connectionsFor(role)   the connections a run of that role is started with: the catalog and the role file both name them
//   decide(role, tool, input)   catalog.decideTool, then two checks on what the call would send
//   noteStatus / noteUse   what the host saw
//   view()                 connections and skills for the library panel
import { appendFile, chmod, mkdir, readFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { hasSecret } from "../../../scripts/exposure.mjs";
import { CONNECTION_STATES } from "../cells/claude-adapter.mjs";
import { AGENT_ID_RE, ROLES } from "../cells/policy.mjs";
import { DEN_ROOT, connectionsFor, decideTool, loadCatalog, toolsOfRoleFile } from "./catalog.mjs";

export const AUTO_INPUT_MAX_BYTES = 2048; // a read with more input than this is asked, not allowed by the bridge
const REFUSE_SECRET = "The input looks like it holds a secret, so the den does not send it to a connection.";
const REFUSE_INPUT = "The den could not read the input of that call.";
const LOG_READ_BYTES = 1024 * 1024; // of the log, the newest part that is read back
const DECISIONS = ["allowed", "asked", "refused"];
const TOOL_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const SKILLS_MAX = 100;
const SKILL_NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const flat = (v, max) => String(v).replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const ts = (v) => (typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null);

// What the CLI's word for a connection means here, and the sentence the panel shows with it.
const STATE_OF = { connected: "connected", failed: "failed", "needs-auth": "needs-sign-in", pending: "starting", disabled: "unavailable", unknown: "unavailable" };
const REASON_OF = {
  failed: (role) => `It could not be started or reached when the ${role} last started.`,
  "needs-sign-in": () => "The service asked for a sign-in, and the den holds no credential for it.",
  starting: () => "It was still starting when the agent began.",
  unavailable: () => "The agent's runtime reported it as not available.",
};
const NOT_SEEN = "No agent has started with it yet.";
const roleFileReason = (role) => `The role file .claude/agents/${role}.md does not name it, so the ${role} cannot see its tools.`;

/** A skill's name and description from the top of its SKILL.md, or null. */
export function skillOf(text) {
  const front = typeof text === "string" ? /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, "\n")) : null;
  if (!front) return null;
  const name = /^name:[ \t]*(.+)$/m.exec(front[1])?.[1].trim();
  const description = /^description:[ \t]*(.+)$/m.exec(front[1])?.[1];
  if (!name || !SKILL_NAME_RE.test(name)) return null;
  return { name, description: description ? flat(description.replace(/^["']|["']$/g, ""), 300) : "" };
}

export function createLibrary({ catalog = loadCatalog(), stateDir, denRoot = DEN_ROOT, now = () => new Date() } = {}) {
  const file = typeof stateDir === "string" ? path.join(stateDir, "library.jsonl") : null;
  const known = new Map(catalog.connections.map((c) => [c.name, c]));
  const status = new Map(); // connection -> { state, role, at }
  const uses = new Map(); // connection -> { count, lastAt, lastRole, lastTool }
  let ready = file === null ? Promise.resolve() : mkdir(stateDir, { recursive: true, mode: 0o700 }).catch(() => {});

  const applyStatus = (r) => {
    if (!known.has(r.connection) || !ROLES.includes(r.role) || !ts(r.at) || !Object.hasOwn(STATE_OF, r.status)) return;
    status.set(r.connection, { state: STATE_OF[r.status], role: r.role, at: r.at });
  };
  const applyUse = (r) => {
    const c = known.get(r.connection);
    if (!c || !ROLES.includes(r.role) || !ts(r.at) || !DECISIONS.includes(r.decision)) return;
    const tool = typeof r.tool === "string" && TOOL_RE.test(r.tool) && Object.hasOwn(c.tools, r.tool) ? r.tool : null;
    const u = uses.get(c.name) ?? { count: 0, refused: 0, lastAt: null, lastRole: null, lastTool: null };
    if (r.decision === "refused") u.refused += 1;
    else Object.assign(u, { count: u.count + 1, lastAt: r.at, lastRole: r.role, lastTool: tool });
    uses.set(c.name, u);
  };
  // What an earlier bridge wrote. Every field is checked again here: the log is a record, not an authority.
  if (file !== null) {
    try {
      const raw = readFileSync(file);
      const text = raw.subarray(Math.max(0, raw.length - LOG_READ_BYTES)).toString("utf8");
      for (const line of text.split("\n")) {
        let r;
        try {
          r = JSON.parse(line);
        } catch {
          continue;
        }
        if (r === null || typeof r !== "object") continue;
        if (r.kind === "status") applyStatus(r);
        else if (r.kind === "use") applyUse(r);
      }
    } catch {
      // no log yet
    }
  }
  const write = (record) => {
    if (file === null) return;
    ready = ready
      .then(() => appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 }))
      .then(() => chmod(file, 0o600))
      .catch((err) => console.error(`bridge: could not write the library log: ${err?.message ?? err}`));
  };
  const roleFile = async (role) => {
    try {
      return await readFile(path.join(denRoot, ".claude", "agents", `${role}.md`), "utf8");
    } catch {
      return "";
    }
  };
  // The role file is read from the den's own checkout. It is the second key: the CLI hides a connection's tools from
  // a role whose file does not name it, so such a run is started without that connection.
  const namedBy = async (role) => toolsOfRoleFile(await roleFile(role));

  return {
    catalog,
    async connectionsFor(role) {
      const targets = connectionsFor(catalog, role);
      if (targets.length === 0) return targets;
      const named = await namedBy(role);
      return named === null ? targets : targets.filter((t) => named.has(t.name));
    },
    /**
     * The answer to one call, from the catalog and then from what the call would send. A call whose input looks like it
     * holds a secret is refused whatever the tool is. A read whose input is long is asked instead of allowed: a read on
     * a remote service still sends its input there, so the automatic answer is kept for inputs the size of a question.
     */
    decide(role, tool, input) {
      const verdict = decideTool(catalog, role, tool);
      if (verdict === null || verdict.kind === "refuse") return verdict;
      let sent = "";
      try {
        sent = JSON.stringify(input) ?? "";
      } catch {
        return { ...verdict, kind: "refuse", reason: REFUSE_INPUT };
      }
      if (hasSecret(sent)) return { ...verdict, kind: "refuse", reason: REFUSE_SECRET };
      return verdict.kind === "allow" && Buffer.byteLength(sent) > AUTO_INPUT_MAX_BYTES ? { ...verdict, kind: "ask" } : verdict;
    },
    /** What a child's start-up line said about its connections. Names outside the catalog are dropped. */
    noteStatus(role, servers) {
      if (!ROLES.includes(role) || !Array.isArray(servers)) return false;
      const at = now().toISOString();
      let changed = false;
      for (const s of servers) {
        const record = { kind: "status", at, role, connection: s?.name, status: CONNECTION_STATES.includes(s?.status) ? s.status : "unknown" };
        if (!known.has(record.connection)) continue;
        const before = status.get(record.connection)?.state;
        applyStatus(record);
        if (before !== status.get(record.connection)?.state) write(record); // a state that has not changed is not written again
        changed = true;
      }
      return changed;
    },
    /** One tool call and what the bridge answered. The input is never passed here. */
    noteUse({ role, runId, connection, tool, decision } = {}) {
      if (!known.has(connection) || !DECISIONS.includes(decision)) return false;
      const record = { kind: "use", at: now().toISOString(), role, ...(AGENT_ID_RE.test(runId) ? { runId } : {}), connection, tool: typeof tool === "string" && TOOL_RE.test(tool) ? tool : null, decision };
      applyUse(record);
      write(record);
      return true;
    },
    async view() {
      const named = new Map();
      const skillRoles = [];
      await Promise.all(ROLES.map(async (role) => {
        const text = await roleFile(role);
        named.set(role, toolsOfRoleFile(text));
        const tools = /^tools:[ \t]*(.*)$/m.exec(text)?.[1];
        if (tools === undefined ? text !== "" : tools.split(",").some((t) => t.trim() === "Skill")) skillRoles.push(role);
      }));
      const connections = catalog.connections.map((c) => {
        const seen = status.get(c.name);
        const u = uses.get(c.name);
        return {
          kind: "connection", name: c.name, title: c.title, purpose: c.purpose,
          where: c.host !== null ? { kind: "remote", host: c.host } : { kind: "local" },
          credential: c.credential,
          roles: c.roles.map((role) => {
            const n = named.get(role);
            const usable = n === null || n.has(c.name);
            return { role, usable, ...(usable ? {} : { reason: roleFileReason(role) }) };
          }),
          tools: Object.entries(c.tools).map(([name, capability]) => ({ name, capability })),
          status: seen ? { state: seen.state, at: seen.at, role: seen.role, ...(REASON_OF[seen.state] ? { reason: REASON_OF[seen.state](seen.role) } : {}) } : { state: "not-seen", reason: NOT_SEEN },
          uses: u ? { count: u.count, refused: u.refused, lastAt: u.lastAt, lastRole: u.lastRole, lastTool: u.lastTool } : { count: 0, refused: 0, lastAt: null, lastRole: null, lastTool: null },
        };
      });
      const skills = [];
      try {
        const dir = path.join(denRoot, ".claude", "skills");
        const entries = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory() && SKILL_NAME_RE.test(e.name)).map((e) => e.name).sort().slice(0, SKILLS_MAX);
        for (const name of entries) {
          let skill = null;
          try {
            skill = skillOf(await readFile(path.join(dir, name, "SKILL.md"), "utf8"));
          } catch {
            // a directory with no SKILL.md is not a skill
          }
          if (skill) skills.push({ kind: "skill", name: skill.name, description: skill.description, roles: skillRoles.slice().sort((a, b) => ROLES.indexOf(a) - ROLES.indexOf(b)) });
        }
      } catch {
        // no skills directory
      }
      return { connections, skills };
    },
    /** Resolves when every write so far is on disk (tests and shutdown). */
    flush: () => ready,
  };
}
