// organism-infra/139: the UI's session. It reads the launch code from the URL fragment (#code=...), redeems it at
// POST /session, keeps the session token so a page reload does not need a new code, and sends the token as
// `Authorization: Bearer <token>` on its requests.
//
// Reload mechanism chosen in qa specify (ADR 0016 decision 7): the token is kept in sessionStorage (per tab, gone
// when the tab closes, never sent by the browser on its own, so there is no ambient credential to forge a request
// with). Not a cookie, not localStorage (shared across tabs and outliving the tab), never the launch code, and
// never the URL. The module takes its browser pieces as parameters so this file needs no browser:
//
//   createSession({ fetch, storage, location, history }) -> {
//     start():  Promise<{ state: "ready" } | { state: "none", message: string }>   // never rejects
//     fetch(url, init): Promise<Response>      // adds the Bearer header; with no session it does not touch the network
//                                              // and resolves { ok: false, status: 401 }; a 401 from the bridge ends the session
//     state:    "starting" | "ready" | "none"  // read after start() and after a fetch
//   }
//   storage is a Storage (getItem, setItem, removeItem); location is { hash, pathname, search };
//   history is { replaceState(state, title, url) }.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createSession } from "./session.mjs";

const CODE = "launch-code-0123456789abcdef0123456789abcdef0123456";
// Built at run time so no secret-looking literal sits in the tracked source (organism-infra/166 root scan).
const TOKEN = "session" + "-token-0123456789abcdef0123456789abcdef0123";

const fakeStorage = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    values: () => [...m.values()],
    size: () => m.size,
  };
};
const fakeLocation = (hash = "", pathname = "/", search = "") => ({ hash, pathname, search });
const fakeHistory = () => {
  const urls = [];
  return { urls, replaceState: (_s, _t, url) => urls.push(url) };
};
const json = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const recorder = (respond) => {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, init });
    return respond(url, init, calls.length);
  };
  fn.calls = calls;
  return fn;
};
const redeemsAs = (token = TOKEN) => recorder((url) => (url === "/session" ? json(200, { token }) : json(200)));
const neverCalled = () => recorder(() => assert.fail("no request should have been made"));
const headerOf = (init, name) => {
  const h = init.headers ?? {};
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? h[key] : undefined;
};
const oneLine = (s) => typeof s === "string" && s.trim().length > 0 && !/[\r\n]/.test(s) && s.length <= 140;

describe("redeeming the launch code from the fragment", () => {
  test("POSTs { code } as JSON to /session exactly once, with no Authorization header, and is ready", async () => {
    const f = redeemsAs();
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    assert.deepEqual(await s.start(), { state: "ready" });
    assert.equal(s.state, "ready");
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].url, "/session");
    assert.equal(f.calls[0].init.method, "POST");
    assert.equal(headerOf(f.calls[0].init, "Content-Type"), "application/json");
    assert.equal(headerOf(f.calls[0].init, "Authorization"), undefined, "there is no token yet");
    assert.deepEqual(JSON.parse(f.calls[0].init.body), { code: CODE });
  });

  test("finds the code among other fragment parameters", async () => {
    const f = redeemsAs();
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#foo=1&code=${CODE}&bar=2`), history: fakeHistory() });
    await s.start();
    assert.equal(JSON.parse(f.calls[0].init.body).code, CODE);
  });

  test("removes the fragment from the address bar, keeping path and query", async () => {
    const h = fakeHistory();
    const s = createSession({ fetch: redeemsAs(), storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`, "/den", "?a=1"), history: h });
    await s.start();
    assert.ok(h.urls.length >= 1, "replaceState was called");
    for (const url of h.urls) {
      assert.equal(url, "/den?a=1");
      assert.ok(!String(url).includes("code") && !String(url).includes("#"));
    }
  });

  test("removes the fragment even when the redemption fails", async () => {
    const h = fakeHistory();
    const s = createSession({ fetch: recorder(() => json(401)), storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: h });
    await s.start();
    assert.ok(h.urls.length >= 1);
    assert.ok(h.urls.every((u) => !String(u).includes("code")));
  });

  test("a new code in the fragment beats a stored token", async () => {
    const storage = fakeStorage();
    await createSession({ fetch: redeemsAs("old-token"), storage, location: fakeLocation(`#code=first`), history: fakeHistory() }).start();
    const f = redeemsAs("new-token");
    const s = createSession({ fetch: f, storage, location: fakeLocation(`#code=second`), history: fakeHistory() });
    await s.start();
    assert.equal(f.calls.length, 1, "the new code is redeemed");
    await s.fetch("/requests", { method: "POST", body: "{}" });
    assert.equal(headerOf(f.calls.at(-1).init, "Authorization"), "Bearer new-token");
  });
});

describe("a page reload keeps the session (user decision 2026-10-05)", () => {
  test("a second page load with no fragment reuses the stored token and asks for no new code", async () => {
    const storage = fakeStorage();
    const first = createSession({ fetch: redeemsAs(), storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    await first.start();

    const reload = neverCalled();
    const second = createSession({ fetch: reload, storage, location: fakeLocation(""), history: fakeHistory() });
    assert.deepEqual(await second.start(), { state: "ready" });
    assert.equal(reload.calls.length, 0, "no POST /session on reload");
  });

  test("the reloaded page sends the same Bearer token", async () => {
    const storage = fakeStorage();
    await createSession({ fetch: redeemsAs(), storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() }).start();
    const f = recorder(() => json(201, {}));
    const second = createSession({ fetch: f, storage, location: fakeLocation(""), history: fakeHistory() });
    await second.start();
    await second.fetch("/requests", { method: "POST", body: "{}" });
    assert.equal(headerOf(f.calls[0].init, "Authorization"), `Bearer ${TOKEN}`);
  });

  test("the token is stored; the launch code never is", async () => {
    const storage = fakeStorage();
    await createSession({ fetch: redeemsAs(), storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() }).start();
    assert.ok(storage.values().includes(TOKEN), "the token is in storage so a reload can find it");
    assert.ok(storage.values().every((v) => !v.includes(CODE)), "the launch code must not be kept");
  });

  test("a failed redemption stores nothing", async () => {
    const storage = fakeStorage();
    await createSession({ fetch: recorder(() => json(401)), storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() }).start();
    assert.equal(storage.size(), 0);
  });

  test("if storage is unavailable the session still works in memory", async () => {
    const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };
    const f = redeemsAs();
    const s = createSession({ fetch: f, storage: broken, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    assert.deepEqual(await s.start(), { state: "ready" });
    await s.fetch("/requests", { method: "POST", body: "{}" });
    assert.equal(headerOf(f.calls.at(-1).init, "Authorization"), `Bearer ${TOKEN}`);
  });
});

describe("no session: one line of copy, nothing sent", () => {
  test("no fragment and nothing stored: state none, one non-empty line, no request made", async () => {
    const f = neverCalled();
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(""), history: fakeHistory() });
    const r = await s.start();
    assert.equal(r.state, "none");
    assert.ok(oneLine(r.message), `message must be one short line, got ${JSON.stringify(r.message)}`);
    assert.equal(s.state, "none");
    assert.equal(f.calls.length, 0);
  });

  for (const status of [401, 403, 429, 500]) {
    test(`a refused redemption (${status}) is state none with the same one line, and nothing is stored`, async () => {
      const storage = fakeStorage();
      const s = createSession({ fetch: recorder(() => json(status)), storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
      const r = await s.start();
      assert.equal(r.state, "none");
      assert.ok(oneLine(r.message));
      assert.equal(storage.size(), 0);
    });
  }

  test("a network failure during redemption is state none, not a throw", async () => {
    const f = recorder(() => { throw new TypeError("fetch failed"); });
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    const r = await s.start();
    assert.equal(r.state, "none");
    assert.ok(oneLine(r.message));
  });

  test("a response with no token string is state none", async () => {
    for (const body of [{}, { token: 5 }, { token: "" }, null]) {
      const s = createSession({ fetch: recorder(() => json(200, body)), storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
      assert.equal((await s.start()).state, "none", JSON.stringify(body));
    }
  });

  test("with no session, fetch makes no network call and resolves a 401", async () => {
    const f = neverCalled();
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(""), history: fakeHistory() });
    await s.start();
    const res = await s.fetch("/requests", { method: "POST", body: "{}" });
    assert.equal(res.ok, false);
    assert.equal(res.status, 401);
    assert.equal(f.calls.length, 0, "an unauthenticated /requests must never be sent");
  });
});

describe("sending the token", () => {
  test("adds Authorization: Bearer <token> and keeps the url, method, body and other headers", async () => {
    const f = redeemsAs();
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    await s.start();
    await s.fetch("/requests", { method: "POST", headers: { "Content-Type": "application/json", "X-Other": "1" }, body: '{"a":1}' });
    const { url, init } = f.calls.at(-1);
    assert.equal(url, "/requests", "the token is never put in the url");
    assert.equal(init.method, "POST");
    assert.equal(init.body, '{"a":1}');
    assert.equal(headerOf(init, "Content-Type"), "application/json");
    assert.equal(headerOf(init, "X-Other"), "1");
    assert.equal(headerOf(init, "Authorization"), `Bearer ${TOKEN}`);
  });

  test("a request made while the code is still being redeemed waits for it and then carries the token", async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    const f = recorder(async (url) => (url === "/session" ? (await gate, json(200, { token: TOKEN })) : json(201)));
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    const started = s.start();
    const sent = s.fetch("/requests", { method: "POST", body: "{}" });
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(f.calls.filter((c) => c.url === "/requests").length, 0, "nothing is sent before the session exists");
    release();
    await started;
    assert.equal((await sent).status, 201);
    const sentCall = f.calls.find((c) => c.url === "/requests");
    assert.equal(headerOf(sentCall.init, "Authorization"), `Bearer ${TOKEN}`);
  });

  test("a 401 from the bridge ends the session: state none, the stored token is dropped, a reload does not reuse it", async () => {
    const storage = fakeStorage();
    const f = recorder((url) => (url === "/session" ? json(200, { token: TOKEN }) : json(401)));
    const s = createSession({ fetch: f, storage, location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    await s.start();
    const res = await s.fetch("/requests", { method: "POST", body: "{}" });
    assert.equal(res.status, 401, "the caller still sees the 401");
    assert.equal(s.state, "none");
    assert.ok(!storage.values().includes(TOKEN));

    const reload = neverCalled();
    const second = createSession({ fetch: reload, storage, location: fakeLocation(""), history: fakeHistory() });
    assert.equal((await second.start()).state, "none");
    assert.equal(reload.calls.length, 0);
  });

  test("a 2xx or 4xx other than 401 keeps the session", async () => {
    const f = recorder((url) => (url === "/session" ? json(200, { token: TOKEN }) : json(409)));
    const s = createSession({ fetch: f, storage: fakeStorage(), location: fakeLocation(`#code=${CODE}`), history: fakeHistory() });
    await s.start();
    assert.equal((await s.fetch("/requests", { method: "POST", body: "{}" })).status, 409);
    assert.equal(s.state, "ready");
  });
});
