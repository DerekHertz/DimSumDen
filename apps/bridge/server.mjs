// Localhost bridge (ADR 0011 decision 2). Tickets 04 and 05: GET /state and GET /events, plus
// the loopback binding and Host-header hardening that apply to every route.
// SSE, /metrics, POST /requests and static files arrive in tickets 05 and 06.
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createHub } from "./watch.mjs";

const HOST = "127.0.0.1";

export async function startBridge({ root, port = 4317, uiDir } = {}) {
  let actualPort = port;
  const hub = createHub(root);
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
    if (req.method === "GET" && pathname === "/events") {
      await hub.connect(req, res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
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
