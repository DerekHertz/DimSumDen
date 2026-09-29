// dimsumden-ui-v0/15: every plush of a Pass type used to fetch and parse its prop glb itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAssetCache } from "./asset-cache.mjs";

test("a url is loaded once however many figures ask for it", async () => {
  const calls = [];
  const cache = createAssetCache(async (url) => {
    calls.push(url);
    return { url };
  });
  const got = await Promise.all([cache.get("/models/props/fan.glb"), cache.get("/models/props/fan.glb"), cache.get("/models/props/scroll.glb")]);
  await cache.get("/models/props/fan.glb");
  assert.deepEqual(calls, ["/models/props/fan.glb", "/models/props/scroll.glb"]);
  assert.equal(got[0], got[1], "the same parsed asset is shared");
});

test("a failed load is forgotten so the next figure retries", async () => {
  let n = 0;
  const cache = createAssetCache(async () => {
    n++;
    if (n === 1) throw new Error("offline");
    return "ok";
  });
  await assert.rejects(cache.get("/a.glb"), /offline/);
  assert.equal(await cache.get("/a.glb"), "ok");
  assert.equal(n, 2);
});
