// den-mvp outcome 4: the library card says what each connection is, how it stood, who gets it and what each tool does.
import { test } from "node:test";
import assert from "node:assert/strict";
import { libraryModel, statusOf, usesLine } from "./library-model.mjs";
import { applyEvent } from "../state/apply-event.mjs";
import { createBridgeClient } from "../state/bridge-client.mjs";

const NOW = Date.parse("2026-10-13T12:00:00Z");
const connection = (more = {}) => ({
  kind: "connection", name: "context7", title: "Docs lookup", purpose: "Current documentation.", where: { kind: "remote", host: "mcp.context7.com" }, credential: "none",
  roles: [{ role: "scout", usable: true }, { role: "developer", usable: false, reason: "The role file does not name it." }],
  tools: [{ name: "query-docs", capability: "read" }, { name: "save", capability: "change" }, { name: "post", capability: "publish" }],
  status: { state: "not-seen", reason: "No agent has started with it yet." }, uses: { count: 0, refused: 0, lastAt: null, lastRole: null, lastTool: null }, ...more,
});

test("a connection's row: where it is, its credential, its roles with the reason one cannot use it, and what each tool does", () => {
  const m = libraryModel({ connections: [connection()], skills: [{ kind: "skill", name: "tdd", description: "Test first.", roles: ["developer", "qa"] }] }, NOW);
  assert.equal(m.summary, "1 connection · 1 skill");
  const [c] = m.connections;
  assert.deepEqual([c.title, c.where, c.credential], ["Docs lookup", "A remote service at mcp.context7.com", "No credential"]);
  assert.deepEqual(c.roles, [{ role: "scout", usable: true, reason: null }, { role: "developer", usable: false, reason: "The role file does not name it." }]);
  assert.deepEqual(c.tools.map((t) => t.note), ["reads; allowed without asking", "changes something; asks you each time", "publishes; asks you each time"]);
  assert.equal(c.uses, null);
  assert.deepEqual(m.skills, [{ name: "tdd", description: "Test first.", roles: ["developer", "qa"] }]);
  assert.equal(libraryModel({ connections: [connection({ where: { kind: "local" } })] }, NOW).connections[0].where, "Runs on this machine, from the den's own code");
});

test("status is a label, a tone and a reason; an unknown state reads as unavailable, never as connected", () => {
  assert.deepEqual(statusOf({ state: "not-seen", reason: "No agent has started with it yet." }, NOW), { label: "Not checked yet", tone: "wait", detail: "No agent has started with it yet." });
  assert.deepEqual(statusOf({ state: "connected", at: "2026-10-13T11:57:00Z", role: "scout" }, NOW), { label: "Connected", tone: "ok", detail: "Seen 3 min ago, when the scout started." });
  const failed = statusOf({ state: "failed", at: "2026-10-13T12:00:00Z", role: "developer", reason: "It could not be started or reached when the developer last started." }, NOW);
  assert.deepEqual([failed.label, failed.tone], ["Failed", "bad"]);
  assert.match(failed.detail, /could not be started.*Seen just now/);
  assert.equal(statusOf({ state: "needs-sign-in", reason: "The service asked for a sign-in." }, NOW).label, "Needs sign-in");
  for (const state of ["weird", undefined, 4]) assert.deepEqual([statusOf({ state }, NOW).label, statusOf({ state }, NOW).tone], ["Unavailable", "bad"]);
});

test("the use line counts calls and refusals and names the last caller", () => {
  assert.equal(usesLine({ count: 0, refused: 0 }), null);
  assert.equal(usesLine({ count: 1, refused: 0, lastRole: "scout", lastTool: "query-docs" }), "1 call, last by the scout (query-docs).");
  assert.equal(usesLine({ count: 3, refused: 2, lastRole: "developer", lastTool: null }), "3 calls, last by the developer. 2 calls refused.");
  assert.equal(usesLine({ count: 0, refused: 1 }), "0 calls. 1 call refused.");
});

test("before the data arrives, and on a body that is not the library's, the model is empty and says so", () => {
  assert.deepEqual(libraryModel(null, NOW), { loaded: false, connections: [], skills: [], summary: "" });
  const odd = libraryModel({ connections: [null, 4, { title: "no name" }, connection({ roles: "scout", tools: null, credential: "x", title: 5 })], skills: "tdd" }, NOW);
  assert.equal(odd.connections.length, 1);
  assert.deepEqual([odd.connections[0].title, odd.connections[0].roles, odd.connections[0].tools, odd.connections[0].credential], ["context7", [], [], "Credential held outside the den"]);
});

test("a library change frame bumps the revision the card reloads on, and the client reads GET /library", async () => {
  const next = applyEvent({ seq: 4, tickets: [] }, { seq: 5, type: "library" });
  assert.equal(next.libraryRev, 1);
  assert.equal(applyEvent(next, { seq: 6, type: "library" }).libraryRev, 2);
  const calls = [];
  const client = createBridgeClient({ fetch: async (url, init) => { calls.push([url, init.method]); return { ok: true, status: 200, json: async () => ({ connections: [], skills: [] }) }; } });
  assert.deepEqual(await client.getLibrary(), { connections: [], skills: [] });
  assert.deepEqual(calls, [["/library", "GET"]]);
  const bad = createBridgeClient({ fetch: async () => ({ ok: true, status: 200, json: async () => ({ nope: 1 }) }) });
  await assert.rejects(bad.getLibrary(), /unreadable/);
});
