// den-mvp/38: Bao acts through the bridge. A run given the den connection holds a token; the den script calls
// POST /den-tools/<tool> with it, and the bridge does the work. Board writes go straight through; filing a ticket and
// starting a delivery need the user's own allow of that exact call, and resolving needs a merged pull request.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { makeBridge, until, DISPATCH_REF, FEATURE, send } from "./host-test-helpers.mjs";
import { parseCatalog } from "../library/catalog.mjs";
import { createLibrary } from "../library/library.mjs";

const DEN = { name: "den", title: "The den", purpose: "Bao's hands on the den.", script: "apps/bridge/library/servers/den.mjs", credential: "run", roles: ["orchestrator"],
  tools: { board_resolve: "board", board_comment: "board", board_file: "change", start_delivery: "change" } };
const MERGED = 7;
const gitHost = { mergeCommit: async ({ number }) => { if (number !== MERGED) throw new Error("the pull request is not merged"); return "a".repeat(40); } };

let t;
afterEach(async () => {
  await t?.close();
  t = null;
});

async function desk() {
  t = await makeBridge({ runtimeConfig: { send: true }, gitHost, library: createLibrary({ catalog: parseCatalog({ connections: [DEN] }) }) });
  const res = await t.post("/conversations/orchestrator/message", { text: "resolve the merged tickets" });
  assert.ok([200, 201].includes(res.status), res.text);
  const run = await until(() => t.fake.spawns.find((s) => s.args.role === "orchestrator"), { what: "Bao's desk run" });
  const tool = (name, body, token = run.args.runCredential?.token) => send(t.bridge, {
    method: "POST", path: `/den-tools/${name}`, body,
    headers: { Origin: `http://127.0.0.1:${t.bridge.port}`, Authorization: `Bearer ${token}` },
  });
  return { run, tool };
}

describe("Bao's den tools", () => {
  test("the desk run is given the bridge's address and a token of its own", async () => {
    const { run } = await desk();
    assert.match(run.args.runCredential.url, /^http:\/\/127\.0\.0\.1:\d+$/);
    assert.match(run.args.runCredential.token, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(run.args.connections.some((c) => c.name === "den" && c.credential === "run"));
  });

  test("a wrong token, and the run's token after it ended, are refused", async () => {
    const { run, tool } = await desk();
    assert.equal((await tool("board_comment", { ref: DISPATCH_REF, text: "hi" }, "x".repeat(43))).status, 401);
    run.exit({ code: 0 });
    await until(async () => (await tool("board_comment", { ref: DISPATCH_REF, text: "hi" })).status === 401, { what: "the ended run's token to be refused" });
  });

  test("a comment goes straight on the board, as the orchestrator", async () => {
    const { tool } = await desk();
    const res = await tool("board_comment", { ref: DISPATCH_REF, text: "looked at this from the desk" });
    assert.equal(res.status, 200, res.text);
    const file = await readFile(path.join(t.fx.root, ".scratch", FEATURE, "issues", `${DISPATCH_REF.split("/")[1]}.md`), "utf8");
    assert.match(file, /looked at this from the desk/);
  });

  test("resolve refuses an unmerged pull request and resolves on a merged one", async () => {
    const { tool } = await desk();
    const no = await tool("board_resolve", { ref: DISPATCH_REF, pr: 8 });
    assert.equal(no.status, 409);
    assert.match(no.body.error, /not merged/);
    const yes = await tool("board_resolve", { ref: DISPATCH_REF, pr: MERGED });
    assert.equal(yes.status, 200, yes.text);
    assert.match(yes.body.text, /resolved/);
  });

  test("filing a ticket needs the user's allow of that exact call, and the allow is used once", async () => {
    const { run, tool } = await desk();
    const call = { feature: FEATURE, title: "Transcript renders markdown", text: "Render the agent's markdown." };
    assert.equal((await tool("board_file", call)).status, 403, "no allow yet");
    run.emit({ type: "permission-request", requestId: "r-1", tool: "mcp__den__board_file", input: call });
    const approval = await until(async () => (await t.state()).approvals.find((a) => a.tool === "mcp__den__board_file" && a.state === "pending"), { what: "the ask" });
    await send(t.bridge, { path: `/approvals/${approval.id}`, headers: t.headers });
    assert.equal((await t.post(`/approvals/${approval.id}`, { decision: "allow" })).status, 200);
    assert.equal((await tool("board_file", { ...call, title: "Something else" })).status, 403, "an allow covers only the call the user saw");
    const res = await tool("board_file", call);
    assert.equal(res.status, 200, res.text);
    const filed = res.body.text.match(/filed (\S+) at ready-for-human/)[1];
    const files = await readdir(path.join(t.fx.root, ".scratch", FEATURE, "issues"));
    const body = await readFile(path.join(t.fx.root, ".scratch", FEATURE, "issues", files.find((f) => filed.endsWith(f.replace(/\.md$/, "")))), "utf8");
    assert.match(body, /\*\*Status:\*\* ready-for-human/);
    assert.equal((await tool("board_file", call)).status, 403, "the allow was used up");
  });

  test("start_delivery is refused without the user's allow", async () => {
    const { tool } = await desk();
    const res = await tool("start_delivery", { ref: DISPATCH_REF });
    assert.equal(res.status, 403);
  });

  test("a role the catalog does not give the den connection is refused", async () => {
    t = await makeBridge({ library: createLibrary({ catalog: parseCatalog({ connections: [DEN] }) }) });
    await t.dispatch("architect");
    const run = await until(() => t.fake.spawns[0], { what: "the run" });
    assert.equal(run.args.runCredential, undefined, "a run without the den connection gets no token");
  });
});
