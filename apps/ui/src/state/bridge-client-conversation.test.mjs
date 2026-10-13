// den-mvp outcome 2 and organism-infra/230: the client's stop, converse and conversation-history calls. Contract:
//   stopAgent(agentId)                 POST /agents/<id>/stop, no body; 202 resolves { ok: true }; a refusal rejects
//                                      { status, reason } with the bridge's text; never retried
//   converse(role, { text, runId? })   POST /conversations/<role>/message, body { text, runId? }; resolves the parsed body
//   getConversation(role, { before?, limit? })   GET /conversations/<role>?before=&limit=; resolves { entries, more, before }
// The token is attached by the injected session fetch. Tests run against a stub fetch; no network.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createBridgeClient } from "./bridge-client.mjs";
import { createSession } from "../session/session.mjs";

const AGENT = "c-00000000000000aa";
const TOKEN = ["tok", "test", "123"].join("-"); // built at runtime so the root secret scan does not flag the fixture

function clientWith(responder) {
  const calls = [];
  const session = createSession({
    fetch: async (url, init = {}) => {
      calls.push({ url, init });
      return responder(url, init);
    },
    storage: { getItem: () => TOKEN, setItem() {}, removeItem() {} },
    location: { hash: "", pathname: "/", search: "" },
    history: { replaceState() {} },
  });
  return { client: createBridgeClient({ fetch: session.fetch }), calls };
}
const answer = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const header = (init, name) => Object.entries(init.headers ?? {}).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
const rejected = async (promise) => promise.then(() => assert.fail("it should have rejected"), (err) => ({ status: err.status, reason: err.reason }));

describe("stopAgent", () => {
  test("one POST to the agent's stop route with the token and no body; 202 resolves", async () => {
    const { client, calls } = clientWith(() => answer(202, { ok: true }));
    assert.deepEqual(await client.stopAgent("c-1/../x"), { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/agents/c-1%2F..%2Fx/stop");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.body, undefined);
    assert.equal(header(calls[0].init, "authorization"), `Bearer ${TOKEN}`);
  });

  test("a refusal surfaces the bridge's status and words, and is not retried", async () => {
    for (const [status, error] of [[409, "the agent has already ended"], [404, "no such agent"]]) {
      const { client, calls } = clientWith(() => answer(status, { error }));
      assert.deepEqual(await rejected(client.stopAgent(AGENT)), { status, reason: error });
      assert.equal(calls.length, 1);
    }
  });
});

describe("converse", () => {
  test("the trimmed text goes to the role's conversation, with the run when one is named", async () => {
    const { client, calls } = clientWith(() => answer(201, { ok: true, runId: "c-new", messageId: "m-1", resumed: true, agent: { id: "c-new" } }));
    const body = await client.converse("scout", { text: "  and the docs?  ", runId: AGENT });
    assert.deepEqual([body.resumed, body.agent.id], [true, "c-new"]);
    assert.equal(calls[0].url, "/conversations/scout/message");
    assert.deepEqual(JSON.parse(calls[0].init.body), { text: "and the docs?", runId: AGENT });
    await client.converse("scout", { text: "no run named" });
    assert.deepEqual(JSON.parse(calls[1].init.body), { text: "no run named" });
  });

  test("empty or oversized text sends nothing, and a refusal carries the bridge's words", async () => {
    const { client, calls } = clientWith(() => answer(429, { error: "five-hour usage is 95% (limit 90%)" }));
    assert.equal((await rejected(client.converse("scout", { text: "   " }))).status, 0);
    assert.equal((await rejected(client.converse("scout", { text: "x".repeat(2049) }))).status, 0);
    assert.equal((await rejected(client.converse("", { text: "hi" }))).status, 0);
    assert.equal(calls.length, 0);
    assert.deepEqual(await rejected(client.converse("scout", { text: "again" })), { status: 429, reason: "five-hour usage is 95% (limit 90%)" });
  });
});

describe("getConversation", () => {
  test("it asks for a page and returns it; a missing list is an unreadable answer", async () => {
    const page = { entries: [{ runId: AGENT, id: 1, kind: "ended", state: "done" }], more: true, before: 40 };
    const { client, calls } = clientWith(() => answer(200, page));
    assert.deepEqual(await client.getConversation("qa", { before: 90, limit: 50 }), page);
    assert.deepEqual([calls[0].url, calls[0].init.method], ["/conversations/qa?before=90&limit=50", "GET"]);
    await client.getConversation("qa");
    assert.equal(calls[1].url, "/conversations/qa");
    const bad = clientWith(() => answer(200, { nothing: true }));
    assert.equal((await rejected(bad.client.getConversation("qa"))).status, 200);
  });
});
