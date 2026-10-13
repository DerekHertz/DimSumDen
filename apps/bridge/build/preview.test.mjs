// den-mvp/09 (ADR 0026 decision 5): the preview listener, over real HTTP beside a real bridge.
//   table     every row of routes.mjs that is not a listed read is a 403 on the preview, with and without each token
//   tokens    the den's token is refused on the preview, and the preview's on the den
//   listener  Host, Origin, the built files, the policy, closing
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startBridge } from "../server.mjs";
import { makeStateFixture } from "../bridge-fixture.mjs";
import { CODE, authed, login, origin, send } from "../bridge-auth-helpers.mjs";
import { PREVIEW_READS, ROUTES } from "../routes.mjs";
import { PREVIEW_CSP, openPreview } from "./preview.mjs";

const concrete = (route) => route.replace(/:\w+/g, "x1");
const directive = (csp, name) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(name + " ")) ?? null;

describe("the preview listener", () => {
  let fx, tmp, dir, bridge, preview, target, denToken, previewToken, outsideFile;
  // What a page of the preview itself would send: its own Origin, JSON, and (when given) a token.
  const own = (token) => ({ Origin: origin(target), ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  const tokens = () => [["no token", undefined], ["the den's token", denToken], ["the preview's token", previewToken]];

  before(async () => {
    fx = await makeStateFixture();
    tmp = await mkdtemp(path.join(tmpdir(), "den-preview-"));
    dir = path.join(tmp, "job-1");
    const dist = path.join(dir, "apps/ui/dist");
    await mkdir(path.join(dist, "assets"), { recursive: true });
    await writeFile(path.join(dist, "index.html"), "<!doctype html><title>preview</title>");
    await writeFile(path.join(dist, "assets", "app.js"), "export const x = 1;");
    outsideFile = path.join(tmp, "outside.txt");
    await writeFile(outsideFile, "not part of the build");
    await writeFile(path.join(dir, "package.json"), "{}"); // in the preview's folder, not in its built files
    await symlink(outsideFile, path.join(dist, "assets", "link.txt"));
    bridge = await startBridge({ root: fx.root, port: 0, uiDir: dist, auth: { launchCode: CODE } });
    preview = await openPreview({ id: "job-1", dir, reads: bridge.previewReads });
    const url = new URL(preview.url);
    target = { port: Number(url.port) };
    previewToken = new URLSearchParams(url.hash.slice(1)).get("preview");
    denToken = await login(bridge);
  });
  after(async () => {
    await preview.close();
    await bridge.close();
    await fx.cleanup();
    await rm(tmp, { recursive: true, force: true });
  });

  test("the url is on 127.0.0.1, on a port of its own, and carries the token only in its fragment", () => {
    const url = new URL(preview.url);
    assert.equal(url.hostname, "127.0.0.1");
    assert.notEqual(target.port, bridge.port);
    assert.equal(url.pathname + url.search, "/");
    assert.match(previewToken, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(previewToken, denToken);
  });

  test("the list of reads is written out: each is a GET row that changes nothing, and the bridge hands over exactly those", () => {
    for (const route of PREVIEW_READS) {
      const row = ROUTES.find((r) => r.method === "GET" && r.path === route);
      assert.ok(row, `${route} is a GET row`);
      assert.equal(row.mutating, false, route);
    }
    assert.deepEqual(Object.keys(bridge.previewReads), PREVIEW_READS);
  });

  describe("every row of routes.mjs that is not a listed read is a 403", () => {
    // Read from ROUTES itself: a mutating route added there is in this table without anyone remembering to add it.
    const refused = ROUTES.filter((row) => !(row.method === "GET" && PREVIEW_READS.includes(row.path)));
    test("the table holds every mutating row and every read that is not on the list", () => {
      assert.deepEqual(ROUTES.filter((row) => row.mutating && !refused.includes(row)), []);
      assert.ok(refused.some((row) => row.method === "GET"), "a read that is not on the list is in the table");
      assert.ok(refused.length >= 18);
    });
    for (const row of refused) {
      test(`${row.method} ${row.path}`, async () => {
        for (const [name, token] of tokens()) {
          const res = await send(target, { method: row.method, path: concrete(row.path), headers: own(token), ...(row.method === "GET" ? {} : { body: {} }) });
          assert.equal(res.status, 403, `${row.method} ${row.path} with ${name}`);
        }
      });
    }
    test("a refused POST /session did not reach the den's handler: a launch code sent to the preview is still good on the den", async () => {
      const code = bridge.newLaunchCode();
      const res = await send(target, { method: "POST", path: "/session", headers: own(), body: { code } });
      assert.equal(res.status, 403);
      assert.equal(res.body?.token, undefined);
      assert.equal(typeof (await login(bridge, code)), "string");
    });
    test("any other method is a 403, on a read, a file and a path that is nothing", async () => {
      for (const method of ["PUT", "PATCH", "DELETE", "OPTIONS", "POST"]) {
        for (const p of ["/state", "/", "/assets/app.js", "/nothing"]) {
          const res = await send(target, { method, path: p, headers: own(previewToken), ...(method === "OPTIONS" ? {} : { body: {} }) });
          assert.equal(res.status, 403, `${method} ${p}`);
        }
      }
    });
    test("HEAD of a read is a 403; a GET of a path that is a route only for POST is a 403, not the page", async () => {
      assert.equal((await send(target, { method: "HEAD", path: "/state" })).status, 403);
      for (const p of ["/session", "/agents", "/deliveries/x1/close"]) assert.equal((await send(target, { path: p })).status, 403, p);
    });
  });

  describe("the listed reads and the two tokens", () => {
    test("the reads that need no token on the den answer here too, with the den's own data", async () => {
      const [here, there] = await Promise.all([send(target, { path: "/state" }), send(bridge, { path: "/state" })]);
      assert.equal(here.status, 200);
      assert.deepEqual(here.body.tickets, there.body.tickets);
      assert.equal((await send(target, { path: "/library" })).status, 200);
    });
    test("a read that needs a token: none and the den's are refused, the preview's is taken", async () => {
      for (const p of ["/meetings/x1", "/conversations/developer"]) {
        assert.equal((await send(target, { path: p })).status, 401, `${p} with no token`);
        assert.equal((await send(target, { path: p, headers: own(denToken) })).status, 401, `${p} with the den's token`);
        const res = await send(target, { path: p, headers: own(previewToken) });
        assert.ok(res.status === 200 || res.status === 404, `${p} with the preview's token was answered by the read (${res.status})`);
        assert.match(res.headers["content-type"], /application\/json/);
      }
    });
    test("the preview's token is refused on the den's port, for a read and for a change", async () => {
      assert.equal((await send(bridge, { path: "/meetings/x1", headers: authed(bridge, previewToken) })).status, 401);
      assert.equal((await send(bridge, { path: "/conversations/developer", headers: authed(bridge, previewToken) })).status, 401);
      assert.equal((await send(bridge, { method: "POST", path: "/agents", headers: authed(bridge, previewToken), body: {} })).status, 401);
      assert.notEqual((await send(bridge, { path: "/meetings/x1", headers: authed(bridge, denToken) })).status, 401); // the den's own still works
    });
    test("each preview has its own token: another preview's is refused", async () => {
      const other = await openPreview({ id: "job-2", dir, reads: bridge.previewReads });
      try {
        const otherToken = new URLSearchParams(new URL(other.url).hash.slice(1)).get("preview");
        assert.notEqual(otherToken, previewToken);
        assert.equal((await send(target, { path: "/meetings/x1", headers: own(otherToken) })).status, 401);
      } finally {
        await other.close();
      }
    });
    test("the event stream is served, and carries the policy", async () => {
      const first = await new Promise((resolve, reject) => {
        const req = http.get({ host: "127.0.0.1", port: target.port, path: "/events" }, (res) => {
          res.once("data", (chunk) => {
            resolve({ status: res.statusCode, type: res.headers["content-type"], csp: res.headers["content-security-policy"], text: String(chunk) });
            req.destroy();
          });
        });
        req.on("error", reject);
      });
      assert.equal(first.status, 200);
      assert.match(first.type, /text\/event-stream/);
      assert.match(first.text, /^event: snapshot/);
      assert.equal(first.csp, PREVIEW_CSP);
    });
  });

  describe("Host and Origin", () => {
    test("a request with another Host is refused", async () => {
      for (const host of ["evil.example", `evil.example:${target.port}`, `127.0.0.1:${bridge.port}`, "127.0.0.1", `[::1]:${target.port}`]) {
        assert.equal((await send(target, { path: "/state", host })).status, 403, host);
        assert.equal((await send(target, { path: "/", host })).status, 403, host);
      }
      assert.equal((await send(target, { path: "/state", host: `localhost:${target.port}` })).status, 200);
    });
    test("a request with another Origin is refused, the den's included", async () => {
      for (const from of [origin(bridge), "http://evil.example", "null", `https://127.0.0.1:${target.port}`]) {
        assert.equal((await send(target, { path: "/state", headers: { Origin: from } })).status, 403, from);
        assert.equal((await send(target, { path: "/assets/app.js", headers: { Origin: from } })).status, 403, from);
        assert.equal((await send(target, { path: "/meetings/x1", headers: { Origin: from, Authorization: `Bearer ${previewToken}` } })).status, 403, from);
      }
    });
  });

  describe("the built files", () => {
    test("index.html and a built file are served with the policy: connect-src is this listener and nothing on the network", async () => {
      for (const p of ["/", "/assets/app.js", "/some/page"]) {
        const res = await send(target, { path: p });
        assert.equal(res.status, 200, p);
        assert.equal(res.headers["content-security-policy"], PREVIEW_CSP);
        assert.equal(res.headers["x-content-type-options"], "nosniff");
      }
      assert.equal(directive(PREVIEW_CSP, "connect-src"), "connect-src 'self' blob:");
      assert.equal(directive(PREVIEW_CSP, "default-src"), "default-src 'self'");
      assert.equal(directive(PREVIEW_CSP, "script-src"), "script-src 'self'");
      assert.equal(directive(PREVIEW_CSP, "form-action"), "form-action 'none'");
      assert.doesNotMatch(PREVIEW_CSP, /https?:|\*|unsafe-eval/);
      assert.match((await send(target, { path: "/some/page" })).text, /<title>preview<\/title>/);
      assert.match((await send(target, { path: "/assets/app.js" })).headers["content-type"], /javascript/);
    });
    test("HEAD of a file has no body; a missing file with an extension is a 404", async () => {
      const head = await send(target, { method: "HEAD", path: "/assets/app.js" });
      assert.equal(head.status, 200);
      assert.equal(head.text, "");
      assert.equal((await send(target, { path: "/assets/gone.js" })).status, 404);
    });
    test("nothing outside the built files is served: not the preview's own folder, not by a link, not by a path that climbs", async () => {
      assert.equal((await send(target, { path: "/assets/link.txt" })).status, 403);
      assert.equal((await send(target, { path: "/package.json" })).status, 404);
      for (const p of ["/../package.json", "/..%2f..%2fpackage.json", "/assets/%2e%2e/%2e%2e/%2e%2e/package.json", "/assets/..%5c..%5cpackage.json", "/%00", "/%E0%A4%A"]) {
        const res = await send(target, { path: p });
        assert.equal(res.status, 403, p);
        assert.doesNotMatch(res.text, /\{\}|not part of the build/);
      }
    });
  });

  describe("opening and closing", () => {
    test("reads that are not exactly the listed handlers are not taken", async () => {
      const reads = bridge.previewReads;
      await assert.rejects(openPreview({ id: "job-3", dir, reads: { ...reads, "/agents": () => {} } }), TypeError);
      await assert.rejects(openPreview({ id: "job-3", dir, reads: { "/state": reads["/state"] } }), TypeError);
      await assert.rejects(openPreview({ id: "job-3", dir }), TypeError);
      await assert.rejects(openPreview({ id: "../job", dir, reads }), TypeError);
      await assert.rejects(openPreview({ id: "job-3", dir: "relative", reads }), TypeError);
      await assert.rejects(openPreview({ id: "job-3", dir: path.join(tmp, "no-such-preview"), reads }), { code: "ENOENT" });
    });
    test("closing the preview closes the port and ends an open event stream", async () => {
      const mine = await openPreview({ id: "job-4", dir, reads: bridge.previewReads });
      const port = Number(new URL(mine.url).port);
      const ended = new Promise((resolve, reject) => {
        const req = http.get({ host: "127.0.0.1", port, path: "/events" }, (res) => {
          res.once("data", () => mine.close());
          res.on("data", () => {});
          res.on("close", resolve);
        });
        req.on("error", (err) => (err.code === "ECONNRESET" ? resolve() : reject(err)));
      });
      await ended;
      await mine.close(); // a second call is the same close
      const refused = await new Promise((resolve) => {
        const socket = net.connect(port, "127.0.0.1");
        socket.once("connect", () => (socket.destroy(), resolve(false)));
        socket.once("error", (err) => resolve(err.code));
      });
      assert.equal(refused, "ECONNREFUSED");
      assert.equal((await send(bridge, { path: "/state" })).status, 200); // the den is untouched
    });
  });
});
