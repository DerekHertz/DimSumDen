// den-mvp outcome 4 (spec section 6, ADR 0017): what a meeting does next, and how the bridge reads what its runs say.
// Pure functions over the meeting's own record and a run's last message: nothing here reads a file or starts a run.
//
//   nextStep(meeting) -> { kind: "run", role, part: "take" | "chair" | "answer" }   start one run
//                      | { kind: "pause", pause, reason, next }                      wait for the user
//                      | { kind: "rest" }                                            the chair has answered; the user decides
//   meeting = { seats: [{ role, status }], round: "brief" | "answer" | null }
//   readDecline(report) -> the reason a role gave for sitting out, or null
//   parseBrief(report)  -> { options: [{ key, title }], recommended } | null
//   optionText(report, key) -> that option's own lines of the brief
import { CHAIR } from "./types.mjs";

const pause = (kind, reason, next) => ({ kind: "pause", pause: kind, reason, next });

// Takes come one at a time, in the order the user seated the roles, so a meeting holds one worker slot. The chair runs
// once no seat is waiting, on whatever takes there are: a role that declined or failed does not hold the meeting up.
export function nextStep(meeting) {
  const waiting = meeting.seats.find((s) => s.status === "waiting");
  if (waiting) return { kind: "run", role: waiting.role, part: "take" };
  if (!meeting.round) return { kind: "rest" };
  if (!meeting.seats.some((s) => s.status === "taken")) return pause("no-takes", "no specialist gave a take", "Resume to ask the ones that failed again, or close the meeting.");
  return { kind: "run", role: CHAIR, part: meeting.round === "brief" ? "chair" : "answer" };
}

const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;
const oneLine = (text, max) => String(text).replace(CONTROL_RE, " ").replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

const DECLINE_RE = /^[ \t>*_`-]*DECLINE:[ \t]*(.*)$/gim;
/** A role's reason for sitting out (its last DECLINE line), or null when it gave a take. */
export function readDecline(report) {
  if (typeof report !== "string") return null;
  const found = [...report.matchAll(DECLINE_RE)].at(-1);
  return found ? oneLine(found[1], 200) || "no reason given" : null;
}

const OPTION_RE = /^#{1,4}[ \t]*Option[ \t]+([A-C])[ \t]*[:.-][ \t]*(\S.*)$/gim;
const RECOMMENDED_RE = /^[ \t>*_`-]*RECOMMENDED:[ \t*_`]*(?:Option[ \t]+)?([A-C])\b/gim;
/**
 * The options a brief names and the one it recommends. A brief counts only with two or three options, lettered from A
 * in order, and a recommendation that is one of them. Titles are an agent's text: one cleaned line each, shown as data.
 */
export function parseBrief(report) {
  if (typeof report !== "string") return null;
  const options = [...report.matchAll(OPTION_RE)].map((m) => ({ key: m[1].toUpperCase(), title: oneLine(m[2], 100) }));
  if (options.length < 2 || options.length > 3 || options.some((o, i) => o.key !== "ABC"[i] || !o.title)) return null;
  const recommended = [...report.matchAll(RECOMMENDED_RE)].at(-1)?.[1].toUpperCase();
  if (!options.some((o) => o.key === recommended)) return null;
  return { options, recommended };
}

/** One option's lines of a brief: from its heading to the next heading or the recommendation line. */
export function optionText(report, key) {
  if (typeof report !== "string") return "";
  const lines = report.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^#{1,4}[ \\t]*Option[ \\t]+${key}\\b`, "i").test(l));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,4}[ \t]/.test(l) || /^[ \t>*_`-]*RECOMMENDED:/i.test(l));
  return rest.slice(0, end === -1 ? rest.length : end).join("\n").replace(CONTROL_RE, (c) => (c === "\n" || c === "\t" ? c : " ")).trim();
}
