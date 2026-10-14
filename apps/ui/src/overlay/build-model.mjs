// den-mvp/12 (ADR 0026 decisions 7 to 9): the pure pieces behind the den's own build. No DOM, no fetch; Cards.jsx renders
// what these return. `build` is the snapshot's key: { live: { sha, at }, previous: { sha } | null, rolledBack: { sha } | null },
// or null when the den runs from the checkout.
const SHA_RE = /^[0-9a-f]{40,64}$/;
const live = (build) => (build && SHA_RE.test(build.live?.sha ?? "") ? build : null);
const defaultWhen = (at) => new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** A commit id as the den shows it. */
export const shortSha = (sha) => (typeof sha === "string" ? sha.slice(0, 7) : "");

/** The line that says which build is live and since when, or null when no release is served. */
export function buildLine(build, { when = defaultWhen } = {}) {
  const b = live(build);
  if (!b) return null;
  const at = typeof b.live.at === "string" && !Number.isNaN(Date.parse(b.live.at)) ? b.live.at : null;
  return `Den build ${shortSha(b.live.sha)}${at ? `, live since ${when(at)}` : ""}`;
}

/** Is the live build another one than the build this page was made from? `own` is the live build when the page loaded. */
export const newVersionReady = (own, build) => Boolean(SHA_RE.test(own ?? "") && live(build) && build.live.sha !== own);

/** After a roll back: the line that says so, or null. */
export function behindLine(build) {
  const b = live(build);
  return b && SHA_RE.test(b.rolledBack?.sha ?? "") ? `The live build is behind main: build ${shortSha(b.rolledBack.sha)} was rolled back.` : null;
}

/** On an approval card while a roll back is in effect: what going live brings with it, or null. */
export function rolledBackNote(build) {
  const b = live(build);
  return b && SHA_RE.test(b.rolledBack?.sha ?? "") ? `Going live will also bring back build ${shortSha(b.rolledBack.sha)}, which you rolled back.` : null;
}

/** The roll back button: whether it is shown and on, its name (both builds), and the line under it. First match wins. */
export function rollbackState({ build, steer, inflight } = {}) {
  const b = live(build);
  const to = b && SHA_RE.test(b.previous?.sha ?? "") ? b.previous.sha : null;
  if (!to) return { show: false, enabled: false, to: null, name: "", detail: "", reason: null };
  const base = {
    show: true, to,
    name: `Go back from build ${shortSha(b.live.sha)} to the previous build ${shortSha(to)}`,
    detail: `Live: ${shortSha(b.live.sha)}. Previous: ${shortSha(to)}.`,
  };
  if (steer?.demo) return { ...base, enabled: false, reason: "Demo mode: actions are off" };
  if (steer?.state === "none") return { ...base, enabled: false, reason: "Not signed in to steer" };
  if (inflight) return { ...base, enabled: false, reason: "Going back…" };
  return { ...base, enabled: true, reason: null };
}
