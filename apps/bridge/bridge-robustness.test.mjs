// dimsumden-ui-v0/04 fix round: a malformed request target must not crash the bridge.
import { test } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { startBridge } from "./server.mjs";
import { makeStateFixture } from "./bridge-fixture.mjs";

function rawRequest(port, target) {
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: "127.0.0.1", port }, () => {
      s.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`);
    });
    let data = "";
    s.on("data", (d) => (data += d));
    s.on("end", () => resolve(data));
    s.on("error", reject);
    setTimeout(() => {
      s.destroy();
      reject(new Error("no response"));
    }, 3000);
  });
}

test("a raw GET // target is a 400 and the bridge keeps serving", async () => {
  const fx = await makeStateFixture({ empty: true });
  const bridge = await startBridge({ root: fx.root, port: 0 });
  try {
    const out = await rawRequest(bridge.port, "//");
    assert.match(out, /^HTTP\/1\.1 400 /);
    const res = await fetch(`${bridge.url}/state`);
    assert.equal(res.status, 200);
  } finally {
    await bridge.close();
    await fx.cleanup();
  }
});
