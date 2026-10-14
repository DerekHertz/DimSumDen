// den-mvp/11 (ADR 0026 decision 7): the recovery page's script. Served by the bridge from its own code; it loads nothing
// else. It signs in as the den's page does: a launch code in the fragment (#code=...) is redeemed once at POST /session,
// and the token is kept in sessionStorage under the den's own key, so a tab that was signed in to the den still is.
const KEY = "den.session-token";
const el = (id) => document.getElementById(id);
const short = (sha) => String(sha).slice(0, 12);
const when = (at) => (at ? ` (live since ${new Date(at).toLocaleString()})` : "");
const say = (text) => (el("status").textContent = text);

let token = null;
let build = null;

const stored = () => {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
};
const store = (value) => {
  try {
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch {}
};

async function signIn() {
  const code = new URLSearchParams(location.hash.replace(/^#/, "")).get("code");
  if (code) {
    history.replaceState(null, "", location.pathname + location.search);
    try {
      const res = await fetch("/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const body = res.ok ? await res.json() : null;
      if (typeof body?.token === "string" && body.token) store(body.token);
    } catch {}
  }
  token = stored();
}

function render() {
  const back = el("back");
  el("live").textContent = build ? `${short(build.live.sha)}${when(build.live.at)}` : "none: the den runs from the checkout";
  el("previous").textContent = build?.previous ? short(build.previous.sha) : "none";
  el("undone").hidden = !build?.rolledBack;
  el("undone").textContent = build?.rolledBack ? `The live build is behind main: build ${short(build.rolledBack.sha)} was rolled back.` : "";
  back.textContent = build?.previous ? `Go back to the previous build (${short(build.previous.sha)})` : "Go back to the previous build";
  back.disabled = !token || !build?.previous;
  if (!build?.previous) say("There is no previous build to go back to.");
  else if (!token) say("Read-only: open the launch link the bridge printed to use this button.");
}

async function load() {
  try {
    const res = await fetch("/state");
    build = res.ok ? ((await res.json()).build ?? null) : null;
  } catch {
    build = null;
    say("The bridge did not answer.");
  }
  render();
}

el("back").addEventListener("click", async () => {
  const to = build?.previous?.sha;
  if (!to || !token) return;
  el("back").disabled = true;
  say(`Going back to ${short(to)}…`);
  let res;
  try {
    res = await fetch("/build/rollback", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ to }) });
  } catch {
    say("The bridge did not answer. Nothing changed.");
    return render();
  }
  const body = await res.json().catch(() => null);
  if (res.status === 401) {
    store(null);
    token = null;
  }
  if (res.ok) build = body?.build ?? build;
  else await load();
  render();
  say(res.ok ? `Done: build ${short(to)} is live. Reload the den.` : `Nothing changed: ${typeof body?.error === "string" ? body.error : `the bridge answered ${res.status}`}`);
});

await signIn();
await load();
