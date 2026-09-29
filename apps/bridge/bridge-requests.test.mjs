// dimsumden-ui-v0/06: POST /requests through startBridge (ADR 0011 decision 6 and the hardening paragraph
// of decision 2). The seam is startBridge({root, port: 0}) plus HTTP; the requests file is observed on disk.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { startBridge } from "./server.mjs";
import { makeStateFixture, FEATURE, PENDING_ID } from "./bridge-fixture.mjs";

const DISPATCH_REF = `${FEATURE}/02-ready-p0`; // gate "dispatch" in the fixture
const MERGE_REF = `${FEATURE}/04-review`; // gate "merge", but its request is already pending

let fx;
let bridge;
let file;

beforeEach(async () => {
  fx = await makeStateFixture();
  file = path.join(fx.root, ".scratch", "_requests", "requests.jsonl");
  bridge = await startBridge({ root: fx.root, port: 0 });
});
afterEach(async () => {
  await bridge.close();
  await fx.cleanup();
});

const lines = async () => (await readFile(file, "utf8")).split("\n").filter(Boolean);
const safeJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};

function post(body, { headers = {}, raw = false, host } = {}) {
  return new Promise((resolve, reject) => {
    const payload = raw ? body : JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port: bridge.port,
        path: "/requests",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), ...(host ? { Host: host } : {}), ...headers },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, body: d ? safeJson(d) : null }));
      },
    );
    req.on("error", (e) => (e.code === "ECONNRESET" || e.code === "EPIPE" ? resolve({ status: 413, body: null }) : reject(e)));
    req.end(payload);
  });
}

// Mark the fixture's pending merge request handled, so the merge gate is free to be requested.
const handlePending = () =>
  appendFile(file, JSON.stringify({ handled: PENDING_ID, ts: "2026-09-29T05:59:00.000Z", outcome: "merged" }) + "\n");

describe("POST /requests: valid", () => {
  test("a valid dispatch request returns 201, is assigned id and ts, and appends exactly one line", async () => {
    const before = (await lines()).length;
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "go" });
    assert.equal(res.status, 201);
    const r = res.body.request;
    assert.match(r.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.ok(!Number.isNaN(Date.parse(r.ts)));
    assert.equal(r.kind, "dispatch-approve");
    assert.equal(r.ref, DISPATCH_REF);
    assert.equal(r.note, "go");
    const after = await lines();
    assert.equal(after.length, before + 1);
    assert.deepEqual(JSON.parse(after.at(-1)), r);
  });

  test("note is optional and omitted from the line when absent", async () => {
    const res = await post({ kind: "dispatch-reject", ref: DISPATCH_REF });
    assert.equal(res.status, 201);
    assert.equal("note" in JSON.parse((await lines()).at(-1)), false);
  });

  test("an empty board has no such ref: 404 and no requests file is created", async () => {
    const empty = await makeStateFixture({ empty: true });
    const b = await startBridge({ root: empty.root, port: 0 });
    try {
      const res = await fetch(`${b.url}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dispatch-approve", ref: DISPATCH_REF }),
      });
      assert.equal(res.status, 404);
      await assert.rejects(readFile(path.join(empty.root, ".scratch", "_requests", "requests.jsonl")));
    } finally {
      await b.close();
      await empty.cleanup();
    }
  });

  test("a merge request is accepted once the earlier one is handled", async () => {
    await handlePending();
    const res = await post({ kind: "merge-reject", ref: MERGE_REF });
    assert.equal(res.status, 201);
  });

  test("the snapshot shows the new request as the ticket's pending request", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF });
    const snap = await (await fetch(`${bridge.url}/state`)).json();
    const t = snap.tickets.find((x) => x.ref === DISPATCH_REF);
    assert.equal(t.request.id, res.body.request.id);
    assert.equal(t.request.kind, "dispatch-approve");
  });
});

describe("POST /requests: invalid writes nothing", () => {
  async function rejects(body, status, opts) {
    const before = await readFile(file, "utf8");
    const res = await post(body, opts);
    assert.equal(res.status, status, JSON.stringify(res.body));
    assert.equal(await readFile(file, "utf8"), before, "file must be unchanged");
  }

  test("unknown kind is 400", () => rejects({ kind: "merge-yolo", ref: DISPATCH_REF }, 400));
  test("missing kind is 400", () => rejects({ ref: DISPATCH_REF }, 400));
  test("malformed JSON is 400", () => rejects("{not json", 400, { raw: true }));
  test("non-string note is 400", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, note: 5 }, 400));
  test("note over 500 characters is 400", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "x".repeat(501) }, 400));
  test("note of exactly 500 characters is accepted", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF, note: "x".repeat(500) });
    assert.equal(res.status, 201);
  });
  test("ref not in the snapshot is 404", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/99-nope` }, 404));
  test("a resolved ticket is not in the snapshot: 404", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/01-done` }, 404));
  test("kind that does not match the ticket's gate is 409", () => rejects({ kind: "merge-approve", ref: DISPATCH_REF }, 409));
  test("a ticket with no gate is 409", () => rejects({ kind: "dispatch-approve", ref: `${FEATURE}/08-plain` }, 409));
  test("a second request while one is pending for the ref is 409", () => rejects({ kind: "merge-approve", ref: MERGE_REF }, 409));
  test("a duplicate of a request just accepted is 409 and adds nothing", async () => {
    assert.equal((await post({ kind: "dispatch-approve", ref: DISPATCH_REF })).status, 201);
    await rejects({ kind: "dispatch-reject", ref: DISPATCH_REF }, 409);
  });
  test("body over 4 KB is 413", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF, pad: "x".repeat(5000) }, 413));
  test("wrong Content-Type is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { headers: { "Content-Type": "text/plain" } }));
  test("a foreign Origin is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { headers: { Origin: "http://evil.example" } }));
  test("a foreign Host header is 403", () => rejects({ kind: "dispatch-approve", ref: DISPATCH_REF }, 403, { host: "evil.example" }));

  test("a same-origin Origin header is accepted", async () => {
    const res = await post({ kind: "dispatch-approve", ref: DISPATCH_REF }, { headers: { Origin: `http://127.0.0.1:${bridge.port}` } });
    assert.equal(res.status, 201);
  });
});
