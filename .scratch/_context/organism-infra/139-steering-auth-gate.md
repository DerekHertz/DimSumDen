Jevgrep: 11 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 1 file(s).
- "apps/bridge/server.mjs" — implementation, caller, helper; source below
- "apps/bridge/bridge-requests.test.mjs" — caller, test, fixture, helper; source below
- "apps/ui/src/panel/gates-model.mjs" — implementation, caller, helper; source below
- "apps/ui/src/panel/gates-model.test.mjs" — caller, test, fixture, helper; source below
- "apps/ui/src/overlay/floating-cards.test.mjs" — caller, test, fixture, helper; source below
- "apps/ui/src/overlay/Cards.jsx" — caller, helper; locations only
- "apps/bridge/bridge-state.test.mjs" — test, fixture, helper; source omitted
- "docs/adr/0016-ui-steering-channel.md" — caller, helper; locations only
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md" — helper; locations only
- "apps/bridge/bridge-metrics.test.mjs" — test; source below
- "apps/bridge/requests-log.mjs" — helper; source below
End file list. Declaration locations follow source.

Source block "apps/bridge/server.mjs" lines 18-187:
```
// 07 security forward: the panel renders agent text; forbid inline and foreign script.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'";

export async function startBridge({ root, port = 4317, uiDir = DEFAULT_UI_DIR } = {}) {
  let actualPort = port;
  const hub = createHub(root);
  let postChain = Promise.resolve();
  await hub.ready;
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error(`bridge: request failed: ${err.stack ?? err}`);
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("internal error");
    }
  });
  async function handle(req, res) {
    const host = req.headers.host;
    if (host !== `127.0.0.1:${actualPort}` && host !== `localhost:${actualPort}`) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("forbidden");
      return;
    }
    let pathname;
    try {
      pathname = new URL(req.url, "http://x").pathname;
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("bad request target");
      return;
    }
    if (req.method === "GET" && pathname === "/state") {
      const snap = await hub.snapshot();
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(snap));
      return;
    }
    if (req.method === "GET" && pathname === "/metrics") {
      const [usageLines, eventLines] = await Promise.all(["usage.jsonl", "events.jsonl"].map((f) => readRows(path.join(root, ".scratch", f))));
      return reply(res, 200, computeMetrics({ usageLines, eventLines }));
    }
    if (req.method === "GET" && pathname === "/events") {
      await hub.connect(req, res);
      return;
    }
    if (req.method === "POST" && pathname === "/requests") {
      // Serialised so two racing POSTs cannot both pass the pending-request check.
      const run = postChain.then(() => postRequest(req, res));
      postChain = run.catch(() => {});
      await run;
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(pathname, req, res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  }
  const readRows = (file) => readFile(file, "utf8").then(parseJsonl, () => []);
  const reply = (res, status, obj, extra = {}) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra });
    res.end(JSON.stringify(obj));
  };
  // POST /requests (ADR 0011 decision 6): validate, then append one Gate request. Nothing executes.
  async function postRequest(req, res) {
    if (!/^application\/json\s*(;|$)/i.test(req.headers["content-type"] ?? "")) {
      return reply(res, 403, { error: "content-type must be application/json" });
    }
    const origin = req.headers.origin;
    if (origin !== undefined && origin !== `http://127.0.0.1:${actualPort}` && origin !== `http://localhost:${actualPort}`) {
      return reply(res, 403, { error: "foreign origin" });
    }
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > MAX_BODY) return reply(res, 413, { error: "body too large" }, { Connection: "close" });
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) return reply(res, 413, { error: "body too large" }, { Connection: "close" });
      chunks.push(chunk);
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return reply(res, 400, { error: "malformed JSON" });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply(res, 400, { error: "body must be an object" });
    const { kind, ref, note } = body;
    if (!REQUEST_KINDS.includes(kind)) return reply(res, 400, { error: "unknown kind" });
    if (typeof ref !== "string" || !ref) return reply(res, 400, { error: "ref must be a string" });
    if (note !== undefined && (typeof note !== "string" || note.length > 500)) {
      return reply(res, 400, { error: "note must be a string of at most 500 characters" });
    }
    const snap = await hub.snapshot();
    const ticket = snap.tickets.find((t) => t.ref === ref);
    if (!ticket) return reply(res, 404, { error: "no such ticket" });
    if (!ticket.gate || !kind.startsWith(`${ticket.gate}-`)) return reply(res, 409, { error: "kind does not match the ticket's gate" });
    if (ticket.request) return reply(res, 409, { error: "a request is already pending for this ticket" });
    const request = { id: randomUUID(), ts: new Date().toISOString(), kind, ref, ...(note !== undefined ? { note } : {}) };
    await appendRequestLine(root, request);
    reply(res, 201, { request });
  }
  // Static UI build (ADR 0011 decision 2): unknown paths serve index.html; traversal is a 403.
  async function serveStatic(pathname, req, res) {
    let rel;
    try {
      // URL parsing already collapses "/../"; check the raw target so traversal is a 403, not a quiet remap.
      const rawPath = decodeURIComponent(req.url.split(/[?#]/)[0]);
      if (rawPath.split(/[\\/]/).includes("..")) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("forbidden");
        return;
      }
      rel = decodeURIComponent(pathname);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("bad request target");
      return;
    }
    const base = path.resolve(uiDir);
    const target = path.resolve(base, "." + (rel.startsWith("/") ? rel : "/" + rel));
    if (rel.includes("\0") || (target !== base && !target.startsWith(base + path.sep))) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("forbidden");
      return;
    }
    let file = target;
    let body;
    try {
      body = await readFile(file);
    } catch {
      if (path.extname(rel)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found");
        return;
      }
      file = path.join(base, "index.html");
      try {
        body = await readFile(file);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("ui not built: run npm run ui:build");
        return;
      }
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(file), "Cache-Control": "no-store", "Content-Security-Policy": CSP });
    res.end(req.method === "HEAD" ? undefined : body);
  }
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, resolve);
  });
  actualPort = server.address().port;
  return {
    url: `http://${HOST}:${actualPort}`,
    port: actualPort,
    close: () =>
      new Promise((resolve) => {
        hub.close();
        server.close(() => resolve());
        server.closeAllConnections?.();
      }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { resolveRoot } = await import("../organism-infra/board-service.mjs");
```

Source block "apps/bridge/bridge-requests.test.mjs" lines 8-19:
```
import { startBridge } from "./server.mjs";
import { makeStateFixture, FEATURE, PENDING_ID } from "./bridge-fixture.mjs";

const DISPATCH_REF = `${FEATURE}/02-ready-p0`; // gate "dispatch" in the fixture
const MERGE_REF = `${FEATURE}/04-review`; // gate "merge", but its request is already pending

let fx;
let bridge;
let file;

beforeEach(async () => {
  fx = await makeStateFixture();
```

Source block "apps/bridge/bridge-requests.test.mjs" lines 25-31:
```
  await fx.cleanup();
});

const lines = async () => (await readFile(file, "utf8")).split("\n").filter(Boolean);
const safeJson = (s) => {
  try {
    return JSON.parse(s);
```

Source block "apps/bridge/bridge-requests.test.mjs" lines 34-153:
```
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

```

Source block "apps/ui/src/panel/gates-model.mjs" lines 27-47:
```
  return { show: length >= NOTE_SHOW_FROM, text: `${length}/${NOTE_MAX}` };
}

export async function submitGate({ fetch, ref, kind, note }) {
  const payload = { kind, ref };
  const trimmed = typeof note === "string" ? note.trim() : "";
  if (trimmed) payload.note = trimmed;
  try {
    const res = await fetch("/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    if (res.status === 409) return { ok: false, status: 409, message: "Couldn't send: already pending (409)", retryable: false };
    return { ok: false, status: res.status, message: `Couldn't send: request failed (${res.status})`, retryable: true };
  } catch (e) {
    return { ok: false, status: 0, message: `Couldn't send: ${e?.message ?? "network error"}`, retryable: true };
  }
}

```

Source block "apps/ui/src/panel/gates-model.test.mjs" lines 11-27:
```
import { gatesModel, noteCounter, submitGate } from "./gates-model.mjs";
import { applyEvent } from "../state/apply-event.mjs";

const t = (over) => ({
  ref: "fx/00-x", feature: "fx", title: "T", type: "feature", status: "ready-for-agent", ready: true,
  priority: "P2", effectivePriority: "P2", bumps: 0, bumped: false, readySince: null,
  blockedBy: [], blockedReason: null, holder: null, lastCell: null, gate: null, request: null, handoff: null,
  ...over,
});
const snap = (tickets, extra = {}) => ({
  schema: 1, seq: 1, generatedAt: "2026-09-29T06:00:00.000Z", sessions: 9, tickets, frontier: [],
  usage: null, requests: [], ...extra,
});
const REQ = { id: "6f1c1b7e-0d55-4c3a-9b52-1f5d7e0a9a10", kind: "merge-approve", ts: "2026-09-29T05:58:00.000Z" };

test("no gated tickets: section hidden, no cards", () => {
  const g = gatesModel(snap([t({ ref: "fx/01-a" }), t({ ref: "fx/02-b" })]));
```

Source block "apps/ui/src/panel/gates-model.test.mjs" lines 70-93:
```
  assert.deepEqual(c.pending, { verdict: "reject", text: "Rejection sent, waiting for the orchestrator" });
});

test("a handled request clears its pending mark (ticket event with request null)", () => {
  const before = snap([t({ ref: "fx/01-a", gate: "merge", request: REQ })]);
  assert.notEqual(gatesModel(before).cards[0].pending, null);
  const handled = applyEvent(before, {
    seq: 2, type: "ticket", ref: "fx/01-a", ticket: t({ ref: "fx/01-a", gate: "merge", request: null }),
  });
  assert.equal(gatesModel(handled).cards[0].pending, null);
});

test("a handled merge whose ticket loses its gate drops the card and hides the section", () => {
  const before = snap([t({ ref: "fx/01-a", gate: "merge", request: REQ })]);
  const after = applyEvent(before, {
    seq: 2, type: "ticket", ref: "fx/01-a", ticket: t({ ref: "fx/01-a", status: "resolved", gate: null, request: null }),
  });
  const g = gatesModel(after);
  assert.equal(g.visible, false);
  assert.equal(g.count, 0);
});

test("gatesModel does not mutate the snapshot", () => {
  const s = snap([t({ gate: "merge", request: REQ })]);
```

Source block "apps/ui/src/panel/gates-model.test.mjs" lines 104-160:
```
});

// --- submitGate ---
const fakeFetch = (respond) => {
  const calls = [];
  const fn = async (url, init) => { calls.push({ url, init }); return respond(url, init); };
  fn.calls = calls;
  return fn;
};
const json = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("submitGate POSTs exactly one JSON request line body to /requests", async () => {
  const f = fakeFetch(() => json(201, { request: { id: "x" } }));
  const r = await submitGate({ fetch: f, ref: "fx/01-a", kind: "merge-approve", note: "ship it" });
  assert.deepEqual(r, { ok: true });
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "/requests");
  assert.equal(f.calls[0].init.method, "POST");
  assert.equal(f.calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(f.calls[0].init.body), { kind: "merge-approve", ref: "fx/01-a", note: "ship it" });
});

test("submitGate omits an empty or whitespace note", async () => {
  for (const note of [undefined, "", "   "]) {
    const f = fakeFetch(() => json(201));
    await submitGate({ fetch: f, ref: "fx/01-a", kind: "dispatch-reject", note });
    assert.deepEqual(JSON.parse(f.calls[0].init.body), { kind: "dispatch-reject", ref: "fx/01-a" });
  }
});

test("409 reports 'already pending' and is not retryable", async () => {
  const f = fakeFetch(() => json(409, { error: "pending" }));
  const r = await submitGate({ fetch: f, ref: "fx/01-a", kind: "merge-approve" });
  assert.equal(r.ok, false);
  assert.equal(r.status, 409);
  assert.equal(r.message, "Couldn't send: already pending (409)");
  assert.equal(r.retryable, false);
});

test("other 4xx errors are retryable and carry the status", async () => {
  const f = fakeFetch(() => json(404, { error: "no such ticket" }));
  const r = await submitGate({ fetch: f, ref: "fx/01-a", kind: "merge-approve" });
  assert.equal(r.ok, false);
  assert.equal(r.status, 404);
  assert.match(r.message, /^Couldn't send: /);
  assert.match(r.message, /404/);
  assert.equal(r.retryable, true);
});

test("a network failure is a retryable error, not a throw", async () => {
  const f = fakeFetch(() => { throw new TypeError("fetch failed"); });
  const r = await submitGate({ fetch: f, ref: "fx/01-a", kind: "merge-approve" });
  assert.equal(r.ok, false);
  assert.match(r.message, /^Couldn't send: /);
  assert.equal(r.retryable, true);
});

```

Source block "apps/ui/src/overlay/floating-cards.test.mjs" lines 146-152:
```
  };
}

const header = (card) => card.locator("button[aria-expanded]").first();
const zoomValue = async (zoom) => Number(await zoom.getAttribute("data-zoom"));
const token = (page, name) =>
  page.evaluate((n) => {
```

Source block "apps/ui/src/overlay/floating-cards.test.mjs" lines 158-172:
```
    return c;
  }, name);
const colourOf = (locator) => locator.evaluate((el) => getComputedStyle(el).color);
const withApp = (opts, fn) => async () => {
  const app = await openApp(opts);
  try {
    await fn(app);
    assert.deepEqual(app.errors, [], "no page errors");
  } finally {
    await app.context.close();
  }
};

// ---- Layout: floating cards, no sidebar, positions from digest section 4 ---------------------------------

```

Source block "apps/ui/src/overlay/floating-cards.test.mjs" lines 764-774:
```
  assert.equal(dom.h1, 1, "one h1");
}));

async function expectPost(posts, want) {
  const deadline = Date.now() + 20000; // organism-infra/104: same load ceiling as the page default timeout
  while (Date.now() < deadline && posts.length === 0) await new Promise((r) => setTimeout(r, 50));
  assert.equal(posts.length, 1, `exactly one POST /requests, got ${JSON.stringify(posts)}`);
  assert.equal(posts[0].kind, want.kind);
  assert.equal(posts[0].ref, want.ref);
}

```

Source block "apps/bridge/bridge-metrics.test.mjs" lines 8-22:
```
import { startBridge } from "./server.mjs";
import { makeStateFixture } from "./bridge-fixture.mjs";

const statusWithHost = (port, host) =>
  new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path: "/metrics", headers: { Host: host } }, (r) => {
      r.resume();
      resolve(r.statusCode);
    }).on("error", reject);
  });

const METRICS_CLI = fileURLToPath(new URL("../../scripts/metrics.mjs", import.meta.url));

test("GET /metrics is 200 JSON, exactly what metrics.mjs --json prints for the same root", async () => {
  const fx = await makeStateFixture();
```

Source block "apps/bridge/requests-log.mjs" lines 1-10:
```
// Gate requests log (ADR 0011 decision 6). One append-only JSONL file; a request is pending
// until a later {handled, ts, outcome} line names its id. Shared by the bridge (snapshot, POST)
// and scripts/requests.mjs, so both agree on what "pending" means.
import { readFile, appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const REQUEST_KINDS = ["merge-approve", "merge-reject", "dispatch-approve", "dispatch-reject"];
const HANDLED_KEPT = 10;

export const requestsFile = (root) => path.join(root, ".scratch", "_requests", "requests.jsonl");
```

Source block "apps/bridge/requests-log.mjs" lines 58-66:
```
  return order.filter((r) => r.state === "pending" || keep.has(r));
}

export async function appendRequestLine(root, obj) {
  const file = requestsFile(root);
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(obj) + "\n");
}

```

Declaration locations:
- "apps/bridge/server.mjs"
  source@7-7
  source@8-8
  source@9-9
  DEFAULT_UI_DIR@14-14
  HOST@16-16
  MAX_BODY@17-17
  CSP@19-19
  startBridge@21-184
  source@186-191
- "apps/bridge/bridge-requests.test.mjs"
  source@3-3
  source@4-4
  source@5-5
  source@6-6
  source@7-7
  source@8-8
  source@9-9
  DISPATCH_REF@11-11
  MERGE_REF@12-12
  fx@14-14
  bridge@15-15
  file@16-16
  source@18-22
  source@23-26
  lines@28-28
  safeJson@29-35
  post@37-57
  handlePending@60-61
  source@63-115

Output truncated at the byte limit (24576 bytes); 2995 original bytes omitted.

End context.
