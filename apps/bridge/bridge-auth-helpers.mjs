// organism-infra/139: shared helpers for the auth-gate tests (not a test file itself). Everything goes over
// real HTTP to a bridge started with startBridge({ root, port: 0, auth: { launchCode, ttlMs?, now? } }).
import http from "node:http";

// 64 characters, the length of a 32-byte hex code; the tests never depend on the production format.
export const CODE = "c0de".repeat(16);

export const origin = (bridge, host = "127.0.0.1") => `http://${host}:${bridge.port}`;

// One request. `body` is an object (sent as JSON) or a string (sent raw). A header set to null is removed,
// so a test can drop Content-Type or Origin. Resolves { status, headers, text, body } and never rejects on
// a server-side reset of an oversized upload (it reports 413 the way the original requests tests did).
export function send(bridge, { method = "GET", path = "/", headers = {}, body, host } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
    const merged = {
      ...(payload !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
      ...(host ? { Host: host } : {}),
      ...headers,
    };
    for (const k of Object.keys(merged)) if (merged[k] === null) delete merged[k];
    const req = http.request({ host: "127.0.0.1", port: bridge.port, path, method, headers: merged }, (res) => {
      let text = "";
      res.on("data", (c) => (text += c));
      res.on("end", () => {
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, text, body: json });
      });
    });
    req.on("error", (e) => (e.code === "ECONNRESET" || e.code === "EPIPE" ? resolve({ status: 413, headers: {}, text: "", body: null }) : reject(e)));
    req.end(payload);
  });
}

// POST /session with a same-origin Origin, as the UI sends it.
export const redeem = (bridge, code, extra = {}) =>
  send(bridge, {
    method: "POST",
    path: "/session",
    body: { code },
    ...extra,
    headers: { Origin: origin(bridge), ...(extra.headers ?? {}) },
  });

// Redeem and return the session token, failing loudly if the bridge refuses.
export async function login(bridge, code = CODE) {
  const res = await redeem(bridge, code);
  if (res.status !== 200 || typeof res.body?.token !== "string") {
    throw new Error(`login failed: ${res.status} ${res.text}`);
  }
  return res.body.token;
}

// The full set of credentials a legitimate UI request carries.
export const authed = (bridge, token) => ({ Origin: origin(bridge), Authorization: `Bearer ${token}` });
