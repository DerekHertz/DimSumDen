// Localhost bridge (ADR 0011 decision 2). Tickets 04 and 05: GET /state and GET /events, plus
// the loopback binding and Host-header hardening that apply to every route.
// SSE, /metrics, POST /requests and static files arrive in tickets 05 and 06.
import http from "node:http";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { REQUEST_KINDS, appendRequestLine } from "./requests-log.mjs";
import { createHub } from "./watch.mjs";
import { computeMetrics, parseJsonl } from "../../scripts/metrics.mjs";
import { contentTypeFor } from "../ci-cd/dev-server.mjs";

const DEFAULT_UI_DIR = fileURLToPath(new URL("../ui/dist", import.meta.url));

const HOST = "127.0.0.1";
const MAX_BODY = 4096;
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
  const root = resolveRoot(process.cwd(), process.env);
  const bridge = await startBridge({ root, port: Number(process.env.PORT) || 4317 });
  console.log(`bridge listening on ${bridge.url} (root ${root})`);
}
