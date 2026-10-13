// den-mvp outcome 4: the library card's view of GET /library. Two kinds of entry, named as such: a connection supplies
// tools (a Model Context Protocol server from the den's catalog), a skill is a set of instructions. Every line here is
// the bridge's own fact in plain words: where a connection is, how it stood when an agent last started with it, which
// roles get it, and what each tool does when it is called. All strings are shown as text, never as HTML.
import { relativeAge } from "./overlay-model.mjs";

const str = (v) => (typeof v === "string" ? v : "");
const list = (v) => (Array.isArray(v) ? v : []);
const STATUS = {
  connected: { label: "Connected", tone: "ok" },
  failed: { label: "Failed", tone: "bad" },
  "needs-sign-in": { label: "Needs sign-in", tone: "bad" },
  starting: { label: "Starting", tone: "wait" },
  unavailable: { label: "Unavailable", tone: "bad" },
  "not-seen": { label: "Not checked yet", tone: "wait" },
};
const TOOL_NOTE = { read: "reads; allowed without asking", change: "changes something; asks you each time", publish: "publishes; asks you each time" };
const CREDENTIAL = { none: "No credential" };
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** How a connection stood, as a label, a tone for the mark beside it, and one line of detail. */
export function statusOf(status, nowMs) {
  const known = STATUS[str(status?.state)] ?? STATUS.unavailable;
  const age = relativeAge(status?.at, nowMs);
  const when = age === null ? null : age === "now" ? "just now" : `${age} ago`;
  const seen = when && str(status?.role) ? `Seen ${when}, when the ${status.role} started.` : null;
  return { ...known, detail: [str(status?.reason), seen].filter(Boolean).join(" ") || null };
}

/** One line on how much a connection has been used, or null when it has not been. */
export function usesLine(uses) {
  const count = Number.isInteger(uses?.count) ? uses.count : 0;
  const refused = Number.isInteger(uses?.refused) ? uses.refused : 0;
  if (count === 0 && refused === 0) return null;
  const last = count > 0 && str(uses.lastRole) ? `, last by the ${uses.lastRole}${str(uses.lastTool) ? ` (${uses.lastTool})` : ""}` : "";
  return `${plural(count, "call")}${last}${refused > 0 ? `. ${plural(refused, "call")} refused.` : "."}`;
}

/**
 * The card's model. `data` is GET /library's body, or null before it has loaded.
 *   connections: [{ name, title, purpose, where, credential, status, roles: [{ role, usable, reason }], tools: [{ name, note }], uses }]
 *   skills: [{ name, description, roles }]
 */
export function libraryModel(data, nowMs = Date.now()) {
  const connections = list(data?.connections).filter((c) => c && str(c.name)).map((c) => ({
    name: c.name,
    title: str(c.title) || c.name,
    purpose: str(c.purpose),
    where: c.where?.kind === "remote" && str(c.where.host) ? `A remote service at ${c.where.host}` : "Runs on this machine, from the den's own code",
    credential: CREDENTIAL[str(c.credential)] ?? "Credential held outside the den",
    status: statusOf(c.status, nowMs),
    roles: list(c.roles).filter((r) => r && str(r.role)).map((r) => ({ role: r.role, usable: r.usable === true, reason: r.usable === true ? null : str(r.reason) || "Not usable yet." })),
    tools: list(c.tools).filter((t) => t && str(t.name)).map((t) => ({ name: t.name, note: TOOL_NOTE[str(t.capability)] ?? "asks you each time" })),
    uses: usesLine(c.uses),
  }));
  const skills = list(data?.skills).filter((s) => s && str(s.name)).map((s) => ({ name: s.name, description: str(s.description), roles: list(s.roles).filter((r) => str(r)) }));
  return { loaded: data != null, connections, skills, summary: data == null ? "" : `${plural(connections.length, "connection")} · ${plural(skills.length, "skill")}` };
}
