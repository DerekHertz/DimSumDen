// den-mvp/09 (ADR 0026 decision 5): the listener one preview is served from. The built files of a preview are code
// nobody has reviewed, running in the user's browser, so they get a port of their own (a separate origin: the den's
// session token is out of reach) and a listener that can change nothing.
//   openPreview({ id, dir, reads }) -> { url, close }
// `id` is the delivery's job id; `dir` is the preview's folder, a tree shaped like this repository whose built files are
// in apps/ui/dist; `reads` is the bridge's `previewReads`: one read handler for each path in routes.mjs PREVIEW_READS,
// and nothing else. That is the listener's whole reach into the bridge: it is given no handler that changes anything,
// and a request it has no read or file for is a 403.
//   - GET of a path on PREVIEW_READS: answered by its read handler. A read that needs a token on the den needs this
//     preview's token here (401 without it). The den's token is not known to this listener, nor this one to the den.
//   - GET or HEAD of any other path that is no route of the bridge: the built files.
//   - Everything else (another method, a route not on the list, another Host or Origin, a path out of the folder): 403.
// The token is read-only and made per preview. It is in the fragment of `url`, which a browser never sends.
import http from "node:http";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { contentTypeFor } from "../../ci-cd/dev-server.mjs";
import { PREVIEW_READS, isRoutePath, matchRoute } from "../routes.mjs";
import { UI_DIST } from "./releases.mjs";

const HOST = "127.0.0.1";
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
// The den's policy, with no form and no frame: a connection goes to this listener or to a blob the page made itself
// (the glb textures load that way, as in the den), never to the den's port or the network.
export const PREVIEW_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; frame-src 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'";

const digest = (s) => createHash("sha256").update(String(s)).digest();

export async function openPreview({ id, dir, reads } = {}) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw new TypeError("openPreview: id must be a job id");
  if (typeof dir !== "string" || !path.isAbsolute(dir)) throw new TypeError("openPreview: dir must be an absolute path");
  const given = Object.keys(reads ?? {});
  if (given.length !== PREVIEW_READS.length || !PREVIEW_READS.every((route) => typeof reads[route] === "function")) {
    throw new TypeError("openPreview: reads must be one handler for each path in PREVIEW_READS, and nothing else");
  }
  // Only the listed handlers are kept: nothing else of the caller's object is reachable from a request.
  const handlers = new Map(PREVIEW_READS.map((route) => [route, reads[route]]));
  const base = await realpath(path.join(dir, UI_DIST)); // throws when the preview has no built files

  const token = randomBytes(32).toString("base64url");
  const tokenHash = digest(token);
  const holdsToken = (header) => {
    const m = /^Bearer ([A-Za-z0-9_-]{1,512})$/.exec(typeof header === "string" ? header : "");
    return m !== null && timingSafeEqual(digest(m[1]), tokenHash);
  };

  let port;
  const plain = (res, status, text) => {
    res.writeHead(status, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
    res.end(text);
  };
  const refuse = (res) => plain(res, 403, "forbidden");

  async function handle(req, res) {
    // On every answer, the reads included: a read handler's own headers are added to these.
    res.setHeader("Content-Security-Policy", PREVIEW_CSP);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    const own = [`${HOST}:${port}`, `localhost:${port}`];
    if (!own.includes(req.headers.host)) return refuse(res);
    // A browser sends no Origin on a same-origin GET; one that is sent must be this listener's.
    const origin = req.headers.origin;
    if (origin !== undefined && !own.some((host) => origin === `http://${host}`)) return refuse(res);
    if (req.method !== "GET" && req.method !== "HEAD") return refuse(res);
    let pathname;
    try {
      pathname = new URL(req.url, "http://x").pathname;
    } catch {
      return refuse(res);
    }
    const row = matchRoute(req.method, pathname);
    if (row && handlers.has(row.path)) {
      if (row.auth === "token" && !holdsToken(req.headers.authorization)) return plain(res, 401, "unauthorized");
      return handlers.get(row.path)(req, res);
    }
    if (row || isRoutePath(pathname)) return refuse(res);
    return serveStatic(pathname, req, res);
  }

  // A file of the build by its real path: "outside" when a link leads out of the built folder, undefined when there is none.
  async function readBuilt(file) {
    let real;
    try {
      real = await realpath(file);
    } catch {
      return undefined;
    }
    if (real !== base && !real.startsWith(base + path.sep)) return "outside";
    return readFile(real).catch(() => undefined);
  }

  // The built files, as the den serves its own: an unknown path with no extension is index.html.
  async function serveStatic(pathname, req, res) {
    let rel;
    try {
      // URL parsing already collapses "/../"; check the raw target so traversal is a 403, not a quiet remap.
      if (decodeURIComponent(req.url.split(/[?#]/)[0]).split(/[\\/]/).includes("..")) return refuse(res);
      rel = decodeURIComponent(pathname);
    } catch {
      return refuse(res);
    }
    let file = path.resolve(base, "." + rel);
    if (rel.includes("\0") || (file !== base && !file.startsWith(base + path.sep))) return refuse(res);
    let body = await readBuilt(file);
    if (body === undefined && !path.extname(rel)) {
      file = path.join(base, "index.html");
      body = await readBuilt(file);
    }
    if (body === "outside") return refuse(res);
    if (body === undefined) return plain(res, 404, "not found");
    res.writeHead(200, { "Content-Type": contentTypeFor(file), "Cache-Control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : body);
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(`bridge: preview ${id}: request failed: ${err?.stack ?? err}`);
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("internal error");
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, resolve);
  });
  port = server.address().port;

  let closed;
  // Closes the port and every open connection (an event stream included). Safe to call again.
  const close = () => (closed ??= new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  }));
  return { url: `http://${HOST}:${port}/#preview=${token}`, close };
}
