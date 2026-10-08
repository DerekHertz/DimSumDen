// Localhost bridge (ADR 0011 decision 2). Tickets 04 and 05: GET /state and GET /events, plus
// the loopback binding and Host-header hardening that apply to every route.
// SSE, /metrics, POST /requests and static files arrive in tickets 05 and 06.
import http from "node:http";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { createHost } from "./cells/host.mjs";
import { REQUEST_KINDS, appendRequestLine } from "./requests-log.mjs";
import { createHub } from "./watch.mjs";
import { createAuth } from "./auth.mjs";
import { matchRoute } from "./routes.mjs";
import { computeMetrics, parseJsonl } from "../../scripts/metrics.mjs";
import { contentTypeFor } from "../ci-cd/dev-server.mjs";

const DEFAULT_UI_DIR = fileURLToPath(new URL("../ui/dist", import.meta.url));

const HOST = "127.0.0.1";
const MAX_BODY = 4096;
// 07 security forward: the panel renders agent text; forbid inline and foreign script.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'";

// Process-level handlers (ADR 0016 decision 2, process lifetime): the bridge owns its children, so a signal, a crash
// or an exit ends them. Returns the function that removes every handler it installed.
function installProcessHandlers(host) {
  const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
  const onSignal = (sig) => {
    host.shutdown().finally(() => process.exit(128 + (os.constants.signals[sig] ?? 15)));
  };
  const handlers = signals.map((sig) => [sig, () => onSignal(sig)]);
  const onCrash = (err) => {
    process.stderr.write(`bridge: uncaught exception: ${err?.stack ?? err}\n`);
    host.shutdown().finally(() => process.exit(1));
  };
  const onExit = () => host.killAllSync();
  for (const [sig, fn] of handlers) process.on(sig, fn);
  process.on("uncaughtException", onCrash);
  process.on("exit", onExit);
  return () => {
    for (const [sig, fn] of handlers) process.off(sig, fn);
    process.off("uncaughtException", onCrash);
    process.off("exit", onExit);
  };
}

// runtime: a CellRuntime (organism-infra/140). With none, POST /agents is 503 and no process-level handler is
// installed. policy: test-only overrides of cells/policy.mjs (the production entry point passes none).
export async function startBridge({ root, port = 4317, uiDir = DEFAULT_UI_DIR, auth: authOptions, runtime, policy } = {}) {
  let actualPort = port;
  const auth = createAuth(authOptions);
  let host;
  const hub = createHub(root, { agents: () => host.snapshot(), approvals: () => host.approvals() });
  host = createHost({
    root,
    runtime,
    policy,
    onChange: (change) => hub.publish(change),
    readUsage: async () => (await hub.snapshot()).usage?.fiveHour ?? null,
    checkGate: async (ref) => {
      const ticket = (await hub.snapshot()).tickets.find((t) => t.ref === ref);
      return !ticket ? "unknown" : ticket.gate === "dispatch" ? "ok" : "nogate";
    },
  });
  await host.ready;
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
    // Default deny (ADR 0016 decision 6.1): a request no registry row matches is a 404. Reads of the UI build
    // (GET, HEAD) fall through to the static files.
    const route = matchRoute(req.method, pathname);
    if (!route) {
      if (req.method === "GET" || req.method === "HEAD") return serveStatic(pathname, req, res);
      return reply(res, 404, { error: "not found" });
    }
    if (route.auth !== "none" && !passesGate(req, res, route)) return;
    const handler = HANDLERS[`${route.method} ${route.path}`];
    if (!handler) return reply(res, 404, { error: "not found" });
    await handler(req, res);
  }
  // Gate order: Origin and Content-Type (403), then the session token (401). All before the body is read, so an
  // unauthenticated caller learns nothing about ids or validation.
  function passesGate(req, res, route) {
    const origin = req.headers.origin;
    // A browser sends no Origin on a same-origin GET, so a token-gated read checks it only when present.
    if (!(req.method === "GET" && origin === undefined) && origin !== `http://127.0.0.1:${actualPort}` && origin !== `http://localhost:${actualPort}`) {
      reply(res, 403, { error: "foreign or missing origin" });
      return false;
    }
    if (req.method !== "GET" && !/^application\/json\s*(;|$)/i.test(req.headers["content-type"] ?? "")) {
      reply(res, 403, { error: "content-type must be application/json" });
      return false;
    }
    if (route.auth === "token" && !auth.verify(req.headers.authorization)) {
      reply(res, 401, { error: "unauthorized" });
      return false;
    }
    return true;
  }
  const HANDLERS = {
    "GET /state": async (req, res) => reply(res, 200, await hub.snapshot()),
    "GET /metrics": async (req, res) => {
      const [usageLines, eventLines] = await Promise.all(["usage.jsonl", "events.jsonl"].map((f) => readRows(path.join(root, ".scratch", f))));
      reply(res, 200, computeMetrics({ usageLines, eventLines }));
    },
    "GET /events": (req, res) => hub.connect(req, res),
    "POST /session": (req, res) => postSession(req, res),
    "POST /requests": async (req, res) => {
      // Serialised so two racing POSTs cannot both pass the pending-request check.
      const run = postChain.then(() => postRequest(req, res));
      postChain = run.catch(() => {});
      await run;
    },
    "POST /agents": (req, res) => postAgent(req, res),
    "POST /agents/:id/stop": (req, res) => stopAgent(req, res),
    "GET /approvals/:id": (req, res) => {
      const approval = host.approval(new URL(req.url, "http://x").pathname.split("/")[2]);
      reply(res, approval ? 200 : 404, approval ?? { error: "no such approval" });
    },
    "POST /approvals/:id": async (req, res) => {
      const body = await readJsonObject(req, res);
      if (!body) return;
      const result = await host.decide(new URL(req.url, "http://x").pathname.split("/")[2], body);
      if (!result.ok) return reply(res, result.status, { error: result.error });
      reply(res, 200, { approval: result.approval });
    },
  };
  const readRows = (file) => readFile(file, "utf8").then(parseJsonl, () => []);
  const reply = (res, status, obj, extra = {}) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra });
    res.end(JSON.stringify(obj));
  };
  // Read a body of at most MAX_BODY bytes. Replies 413 itself and returns undefined when it is too large.
  async function readBody(req, res) {
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > MAX_BODY) return void reply(res, 413, { error: "body too large" }, { Connection: "close" });
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) return void reply(res, 413, { error: "body too large" }, { Connection: "close" });
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  // Read a JSON object body of at most MAX_BODY bytes. Replies 413 or 400 itself and returns undefined on failure.
  async function readJsonObject(req, res) {
    const raw = await readBody(req, res);
    if (!raw) return;
    let body;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      return void reply(res, 400, { error: "malformed JSON" });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return void reply(res, 400, { error: "body must be an object" });
    return body;
  }
  // POST /session (ADR 0016 decision 6.2): exchange the one-time launch code for a session token.
  async function postSession(req, res) {
    const body = await readJsonObject(req, res);
    if (!body) return;
    if (typeof body.code !== "string") return reply(res, 400, { error: "code must be a string" });
    const { status, token } = auth.redeem(body.code);
    if (status === 200) return reply(res, 200, { token });
    reply(res, status, { error: status === 429 ? "too many sessions" : "invalid launch code" });
  }
  // POST /requests (ADR 0011 decision 6): validate, then append one Gate request. Nothing executes.
  async function postRequest(req, res) {
    const body = await readJsonObject(req, res);
    if (!body) return;
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
  // POST /agents (ADR 0016 decision 3): the only HTTP way an agent starts. Only ref, role and mode are read from
  // the body; the host validates them, applies the policy and answers with a status from its table.
  async function postAgent(req, res) {
    const body = await readJsonObject(req, res);
    if (!body) return;
    const result = await host.dispatch({ ref: body.ref, role: body.role, mode: body.mode });
    if (!result.ok) return reply(res, result.status, { error: result.error });
    reply(res, result.status, { agent: result.agent, ...(result.usageUnknown ? { usageUnknown: true } : {}) });
  }
  // POST /agents/:id/stop: takes no body, but the 4 KB cap still applies before anything is looked up.
  async function stopAgent(req, res) {
    if (!(await readBody(req, res))) return;
    const id = new URL(req.url, "http://x").pathname.split("/")[2];
    const result = await host.stop(id);
    if (!result.ok) return reply(res, result.status, { error: result.error });
    reply(res, result.status, { ok: true });
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
  const uninstallProcessHandlers = runtime ? installProcessHandlers(host) : () => {};
  return {
    url: `http://${HOST}:${actualPort}`,
    port: actualPort,
    newLaunchCode: auth.newLaunchCode,
    host: { start: host.start, shutdown: host.shutdown },
    close: async () => {
      await host.shutdown();
      uninstallProcessHandlers();
      await new Promise((resolve) => {
        hub.close();
        server.close(() => resolve());
        server.closeAllConnections?.();
      });
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { resolveRoot } = await import("../organism-infra/board-service.mjs");
  const root = resolveRoot(process.cwd(), process.env);
  const bridge = await startBridge({ root, port: Number(process.env.PORT) || 4317 });
  console.log(`bridge listening on ${bridge.url} (root ${root})`);
  // The only place the launch code is shown (ADR 0016 decision 6.2): once, in a URL fragment the browser never sends.
  console.log(`to steer, open (one use, 5 minutes): ${bridge.url}/#code=${bridge.newLaunchCode()}`);
}
