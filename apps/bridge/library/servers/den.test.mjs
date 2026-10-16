// den-mvp/38: the den script forwards each tool call to the bridge with its run's token, and does nothing else.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

test("tools/call goes to POST /den-tools/<tool> with the run's token; a refusal comes back as an error result", async () => {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c)).on("end", () => {
      seen.push({ url: req.url, auth: req.headers.authorization, origin: req.headers.origin, body: JSON.parse(body) });
      const ok = req.url.endsWith("board_comment");
      res.writeHead(ok ? 200 : 403, { "Content-Type": "application/json" });
      res.end(JSON.stringify(ok ? { text: "commented on fx/02" } : { error: "the user has not allowed starting this delivery" }));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  const token = "t".repeat(43);
  const child = spawn(process.execPath, [new URL("./den.mjs", import.meta.url).pathname], { env: { DEN_BRIDGE_URL: url, DEN_RUN_TOKEN: token }, stdio: ["pipe", "pipe", "inherit"] });
  const replies = new Map();
  createInterface({ input: child.stdout }).on("line", (l) => { const m = JSON.parse(l); replies.get(m.id)?.(m); });
  const rpc = (id, method, params) => new Promise((r) => { replies.set(id, r); child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`); });
  try {
    assert.equal((await rpc(1, "initialize", { protocolVersion: "2025-06-18" })).result.serverInfo.name, "den");
    assert.deepEqual((await rpc(2, "tools/list")).result.tools.map((t) => t.name), ["board_resolve", "board_comment", "board_file", "start_delivery", "release_propose"]);
    const ok = await rpc(3, "tools/call", { name: "board_comment", arguments: { ref: "fx/02", text: "hi" } });
    assert.deepEqual(ok.result, { content: [{ type: "text", text: "commented on fx/02" }] });
    const no = await rpc(4, "tools/call", { name: "start_delivery", arguments: { ref: "fx/02" } });
    assert.equal(no.result.isError, true);
    assert.match(no.result.content[0].text, /Refused \(403\): the user has not allowed/);
    assert.equal((await rpc(5, "tools/call", { name: "rm_rf", arguments: {} })).error.code, -32602);
    assert.deepEqual(seen.map((s) => [s.url, s.auth, s.origin]), [["/den-tools/board_comment", `Bearer ${token}`, url], ["/den-tools/start_delivery", `Bearer ${token}`, url]]);
    assert.deepEqual(seen[0].body, { ref: "fx/02", text: "hi" });
  } finally {
    child.kill();
    server.close();
  }
});
