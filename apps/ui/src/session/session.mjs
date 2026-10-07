// organism-infra/139 (ADR 0016 decisions 6.2 and 7): the UI's steering session. The launch code arrives in the URL
// fragment (#code=...), is redeemed once at POST /session, and the token that comes back is kept in sessionStorage
// so a reload needs no new code. The code is never stored; the fragment is stripped from the address bar whether
// redemption succeeds or fails. Every steering request carries the token as `Authorization: Bearer`.
// Browser pieces are parameters so this module runs (and is tested) without a browser.
export const NO_SESSION_MESSAGE = "Read-only: open the launch link the bridge printed in its console to steer.";
export const STORAGE_KEY = "den.session-token";

const NONE = { state: "none", message: NO_SESSION_MESSAGE };

export function createSession({ fetch, storage, location, history }) {
  let token = null;
  let startPromise = null;
  const session = { state: "starting" };
  const listeners = new Set();
  const setState = (next) => {
    if (session.state === next) return;
    session.state = next;
    for (const fn of listeners) fn(next);
  };

  const read = () => {
    try {
      return storage?.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  };
  const write = (value) => {
    try {
      if (value) storage?.setItem(STORAGE_KEY, value);
      else storage?.removeItem(STORAGE_KEY);
    } catch {
      // storage is unavailable: the session lives in memory only
    }
  };
  const end = () => {
    token = null;
    write(null);
    setState("none");
  };
  const codeFromFragment = () => {
    const raw = String(location?.hash ?? "").replace(/^#/, "");
    if (!raw) return null;
    return new URLSearchParams(raw).get("code") || null;
  };
  const stripFragment = () => {
    try {
      history?.replaceState(null, "", `${location.pathname ?? "/"}${location.search ?? ""}`);
    } catch {
      // nothing more to do
    }
  };

  async function redeem(code) {
    try {
      const res = await fetch("/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return null;
      const body = await res.json();
      return typeof body?.token === "string" && body.token ? body.token : null;
    } catch {
      return null;
    }
  }

  async function run() {
    const code = codeFromFragment();
    let fresh = null;
    if (code) {
      fresh = await redeem(code);
      stripFragment();
    }
    token = fresh ?? read();
    if (fresh) write(fresh);
    setState(token ? "ready" : "none");
    return token ? { state: "ready" } : NONE;
  }

  session.subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  session.start = () => (startPromise ??= run());
  session.fetch = async (url, init = {}) => {
    await session.start();
    if (!token) return { ok: false, status: 401 };
    const res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401) end();
    return res;
  };
  return session;
}
