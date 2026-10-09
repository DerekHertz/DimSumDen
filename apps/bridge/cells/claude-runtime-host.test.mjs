// organism-infra/143: the Claude runtime wired into the bridge, end to end over HTTP.
//
// Part 1: startBridge({ runtime: createClaudeRuntime(...stub...) }): POST /agents spawns the child, the snapshot shows its
// tool and tokens, a can_use_tool request becomes an approval, an allow reaches the child, and a stop ends the child and
// everything in its process group.
// Part 2: `node apps/bridge/server.mjs` as a subprocess. The production entry must construct the default Claude runtime,
// or POST /agents is 503 "no runtime is configured" in production (the gap 142 left). DEN_CLAUDE_BIN points at the stub.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { startBridge } from "../server.mjs";
import { makeStateFixture } from "../bridge-fixture.mjs";
import { CODE, login, authed, send } from "../bridge-auth-helpers.mjs";
import { DISPATCH_REF, until, sleep } from "./host-test-helpers.mjs";
import { LIVE_STATES } from "./policy.mjs";
import { makeStub, alive } from "./claude-stub.mjs";

const SERVER = fileURLToPath(new URL("../server.mjs", import.meta.url));
const cleanups = [];
afterEach(async () => {
  for (const fn of cleanups.splice(0).reverse()) await fn();
});

async function loadCreate() {
  try {
    return (await import("./claude-runtime.mjs")).createClaudeRuntime;
  } catch (err) {
    assert.fail(`apps/bridge/cells/claude-runtime.mjs does not exist yet (missing feature): ${err.message}`);
  }
}

// A bridge over the real Claude runtime, the stub as the binary.
async function boot(stubOpts) {
  const createClaudeRuntime = await loadCreate();
  const stub = await makeStub(stubOpts);
  const fx = await makeStateFixture();
  const runtime = createClaudeRuntime({ env: { PATH: process.env.PATH, HOME: process.env.HOME, DEN_CLAUDE_BIN: stub.bin } });
  const bridge = await startBridge({ root: fx.root, port: 0, auth: { launchCode: CODE }, runtime, policy: { killGraceMs: 150 } });
  const token = await login(bridge);
  const headers = authed(bridge, token);
  const post = (p, body = {}) => send(bridge, { method: "POST", path: p, body, headers });
  const agent = async (id) => (await send(bridge, { path: "/state" })).body.agents?.find((a) => a.id === id);
  cleanups.push(async () => {
    const start = await stub.start();
    const gc = await stub.grandchildPid();
    for (const pid of [start?.pid, gc]) if (pid && alive(pid)) process.kill(pid, "SIGKILL");
    await bridge.close();
    await fx.cleanup();
  });
  return { stub, bridge, headers, post, agent, state: async () => (await send(bridge, { path: "/state" })).body };
}

describe("startBridge over the real Claude runtime", () => {
  test("POST /agents dispatches; the snapshot shows the tool and the tokens; the agent can be approved", async () => {
    const t = await boot({ mode: "approve" });
    const res = await t.post("/agents", { ref: DISPATCH_REF, role: "architect" });
    assert.ok([201, 202].includes(res.status), `dispatch answered ${res.status} ${res.text}`);
    const { id, capabilities } = res.body.agent;
    assert.equal(capabilities.approve, true);
    assert.equal(capabilities.send, false);
    const a = await until(async () => {
      const cur = await t.agent(id);
      return cur?.tool?.name === "Bash" && cur.tokens ? cur : null;
    }, { ms: 5000, what: "the agent to show a tool and tokens" });
    assert.deepEqual(a.tokens, { input: 10, output: 20 });

    const approval = await until(async () => (await t.state()).approvals?.find((x) => x.agentId === id), { ms: 5000, what: "the approval" });
    assert.equal(approval.tool, "Bash");
    const detail = await send(t.bridge, { path: `/approvals/${approval.id}`, headers: t.headers });
    assert.equal(detail.status, 200);
    const decided = await t.post(`/approvals/${approval.id}`, { decision: "allow" });
    assert.equal(decided.status, 200);

    await until(async () => !LIVE_STATES.includes((await t.agent(id)).state), { ms: 5000, what: "the agent to end" });
    assert.equal((await t.agent(id)).state, "done");
    const resp = (await t.stub.stdinLines()).find((l) => l.type === "control_response");
    assert.equal(resp?.response.response.behavior, "allow");
    assert.deepEqual(resp.response.response.updatedInput, { command: "npm test" });
  });

  test("POST /agents/:id/stop ends a stubborn child and its grandchild, and the agent is terminated", async () => {
    const t = await boot({ mode: "hang", grandchild: "ignoreTerm", ignoreTerm: true });
    const res = await t.post("/agents", { ref: DISPATCH_REF, role: "architect" });
    assert.ok([201, 202].includes(res.status), `dispatch answered ${res.status} ${res.text}`);
    const { id } = res.body.agent;
    const gc = await until(() => t.stub.grandchildPid(), { ms: 5000, what: "the grandchild pid" });
    const { pid } = await until(() => t.stub.start(), { what: "the child to start" });
    const stopped = await t.post(`/agents/${id}/stop`, {});
    assert.equal(stopped.status, 202, "ADR 0016 status table: the kill sequence has started");
    await until(async () => (await t.agent(id)).state === "terminated", { ms: 6000, what: "the agent to be terminated" });
    await until(() => !alive(pid) && !alive(gc), { ms: 3000, what: "the child and grandchild to be gone" });
  });
});

describe("the production entry (node apps/bridge/server.mjs)", () => {
  test("wires the default Claude runtime: DEN_CLAUDE_BIN is honoured and dispatch is not a 503", { timeout: 30000 }, async () => {
    const stub = await makeStub({ mode: "hang" });
    const fx = await makeStateFixture();
    const port = await new Promise((resolve) => {
      const s = net.createServer().listen(0, "127.0.0.1", () => {
        const { port } = s.address();
        s.close(() => resolve(port));
      });
    });
    const child = spawn(process.execPath, [SERVER], {
      cwd: fx.root,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, PORT: String(port), ORGANISM_ROOT: fx.root, DEN_CLAUDE_BIN: stub.bin },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    cleanups.push(async () => {
      const start = await stub.start();
      if (start?.pid && alive(start.pid)) process.kill(start.pid, "SIGKILL");
      if (child.exitCode === null) child.kill("SIGKILL");
      await fx.cleanup();
    });
    await until(() => /#code=\S+/.test(out) || child.exitCode !== null, { ms: 10000, what: "the launch code line" });
    const m = out.match(/#code=(\S+)/);
    assert.ok(m, `the server exited before it printed a code (stderr: ${err.slice(0, 300)})`);
    const bridge = { port };
    const token = await login(bridge, m[1]);
    const res = await send(bridge, { method: "POST", path: "/agents", body: { ref: DISPATCH_REF, role: "architect" }, headers: authed(bridge, token) });
    assert.notEqual(res.status, 503, `production dispatch answered 503: ${res.text}`);
    assert.ok([201, 202].includes(res.status), `dispatch answered ${res.status} ${res.text}`);
    await until(async () => (await stub.start()) !== undefined, { ms: 5000, what: "the stub binary named by DEN_CLAUDE_BIN to be launched" });
    await sleep(50);
    child.kill("SIGTERM");
  });
});
