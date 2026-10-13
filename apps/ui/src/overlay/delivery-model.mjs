// den-mvp outcome 3: the pure pieces behind a delivery in the den. No DOM, no fetch; Cards.jsx renders what these return.
// A delivery is the bridge's job that takes one ticket from a developer to a merged pull request. The words here say what
// the bridge recorded (a verdict, a check, a merge); none claims more than that.
import { DELIVERABLE_TYPES } from "../../../bridge/delivery/types.mjs";

const LIVE = new Set(["running", "paused"]);
const shortRef = (ref) => (typeof ref === "string" ? ref.slice(ref.indexOf("/") + 1) : "");
const list = (snapshot) => (Array.isArray(snapshot?.deliveries) ? snapshot.deliveries.filter((d) => d && typeof d.id === "string") : []);

/** The delivery of a ticket that is under way or waiting, or null. */
export const deliveryOf = (snapshot, ref) => list(snapshot).find((d) => d.ref === ref && LIVE.has(d.state)) ?? null;

/** Whether Deliver is offered for a ticket, and the line under it. First match wins. */
export function deliverState({ ticket, snapshot, steer, inflight } = {}) {
  if (!DELIVERABLE_TYPES.includes(ticket?.type)) return { show: false, enabled: false, reason: null };
  if (steer?.demo) return { show: true, enabled: false, reason: "Demo mode: actions are off" };
  if (steer?.state === "none") return { show: true, enabled: false, reason: "Couldn't send: not signed in to steer" };
  if (inflight) return { show: true, enabled: false, reason: "Starting…" };
  if (deliveryOf(snapshot, ticket.ref)) return { show: true, enabled: false, reason: "Being delivered" };
  return { show: true, enabled: true, reason: null };
}

const STEP_WORDS = { developer: "the developer is working", qa: "qa is verifying the commit", security: "security is reviewing the commit", check: "running the scripted checks", publish: "opening the pull request", ci: "waiting for the checks", merge: "merging", resolve: "closing the ticket" };

/** One line saying where a delivery stands. */
export function deliveryLine(d) {
  const pr = d?.pr?.number ? `#${d.pr.number}` : null;
  if (d?.state === "merged") return `Merged${pr ? ` as ${pr}` : ""}`;
  if (d?.state === "closed") return "Closed, not merged";
  if (d?.state === "paused") return `Waiting: ${d.pause?.reason || "paused"}`;
  const words = STEP_WORDS[d?.step] ?? "starting";
  return `${words[0].toUpperCase()}${words.slice(1)}${pr && d.step !== "publish" ? ` (${pr})` : ""}`;
}

/** What the bridge has recorded for the commit under delivery, as short facts in the order they happen. */
export function deliveryFacts(d) {
  const e = d?.evidence ?? {};
  const out = [];
  if (d?.candidate?.sha) out.push(`commit ${d.candidate.sha.slice(0, 7)}`);
  if (e.qa) out.push(`qa ${e.qa}`);
  if (e.risk) out.push(e.risk.clean ? "risk check clean" : `risk check: ${e.risk.hits} hit${e.risk.hits === 1 ? "" : "s"}`);
  if (e.security) out.push(`security ${e.security}`);
  if (e.ci) out.push(`checks ${e.ci}`);
  if (d?.bounces > 0) out.push(`sent back ${d.bounces} time${d.bounces === 1 ? "" : "s"}`);
  return out;
}

/** A pull request link the page may render: an https URL the bridge recorded, or null. */
export const prLink = (d) => (typeof d?.pr?.url === "string" && /^https:\/\/[A-Za-z0-9.-]+\//.test(d.pr.url) ? d.pr.url : null);

/** The rows of the Deliveries list: the ones under way first, then the newest ended. */
export function deliveryRows(snapshot, max = 6) {
  const all = list(snapshot);
  const rows = [...all.filter((d) => LIVE.has(d.state)), ...all.filter((d) => !LIVE.has(d.state)).reverse()].slice(0, max);
  return rows.map((d) => ({ id: d.id, ref: d.ref, short: shortRef(d.ref), title: d.title || shortRef(d.ref), state: d.state, line: deliveryLine(d), facts: deliveryFacts(d), pr: prLink(d), prNumber: d.pr?.number ?? null, canStop: d.state === "running", liveRunId: d.live?.runId ?? null }));
}

// A wait that ends by itself is not the user's to answer.
const SELF_ENDING = new Set(["no-room"]);

/** A waiting delivery as a Needs you request (the shape overlay-model.mjs lists). Bao coordinates, so it is Bao's card. */
export function deliveryRequests(snapshot) {
  return list(snapshot)
    .filter((d) => d.state === "paused" && !SELF_ENDING.has(d.pause?.kind))
    .map((d) => {
      const short = shortRef(d.ref);
      const visual = d.pause?.kind === "visual-verdict";
      return {
        key: `delivery:${d.id}`, kind: "delivery", id: d.id, ref: d.ref, short, role: "orchestrator", station: "pass",
        eyebrow: `Pass · Bao · ${short}`,
        title: visual ? `${short} waits for your visual verdict` : `${short} delivery is waiting`,
        reason: d.pause?.reason || "The delivery is paused.", reasonFallback: false, plain: true, // the bridge's own words, not a quote
        next: d.pause?.next || "",
        rowText: `${short} · delivery`, preview: deliveryFacts(d), detailLabel: "What the bridge recorded",
        age: null, pr: prLink(d), prNumber: d.pr?.number ?? null,
        primary: visual ? { action: "resume", verdict: "approve", label: "Approve and merge" } : { action: "resume", label: "Resume" },
      };
    });
}
