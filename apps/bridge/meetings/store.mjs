// den-mvp outcome 4 (spec section 6, ADR 0017 decision 8): a meeting's files on the board, written by the bridge.
// Each meeting is a directory beside its ticket, .scratch/<feature>/meetings/<NN>-<slug>/:
//   meeting.md        what the bridge records: the ticket, the seats and how each answered, the decisions
//   take-<role>.md    one role's take (a role asked again gets take-<role>-2.md; the earlier one is kept)
//   brief.md          the chair's decision brief (a later version is brief-2.md)
//   thread.jsonl      the user's follow-ups and the chair's answers, one per line
//   summary.md        written when the meeting is 24 hours past its end; the takes and the thread are then deleted
// No agent writes here: the board is in the main checkout, outside every agent's worktree. Every path is built from the
// meeting's validated ref, a role from the bridge's own list and a number. What an agent said is saved under a
// separator line, and read back from under it, as text.
import { appendFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const MEETING_DIR_RE = /^\d{2,4}-[a-z0-9][a-z0-9-]{0,59}$/;
const SEPARATOR = "\n---\n\n";
const READ_MAX = 64 * 1024; // characters read back from one saved text
const THREAD_MAX = 50; // follow-up entries read back

const versioned = (stem, n) => (n > 1 ? `${stem}-${n}.md` : `${stem}.md`);

export function createMeetingStore(root) {
  const home = (m) => path.join(root, ".scratch", m.ref.split("/")[0], "meetings");
  const dirOf = (m) => {
    if (!MEETING_DIR_RE.test(m.dir)) throw new Error("meeting store: bad directory name");
    return path.join(home(m), m.dir);
  };
  const put = async (m, name, text) => {
    const file = path.join(dirOf(m), name);
    await writeFile(`${file}.tmp`, text);
    await rename(`${file}.tmp`, file);
  };
  const saved = async (m, name) => {
    const text = await readFile(path.join(dirOf(m), name), "utf8").catch(() => null);
    if (text === null) return null;
    const at = text.indexOf(SEPARATOR);
    return (at === -1 ? text : text.slice(at + SEPARATOR.length)).slice(0, READ_MAX).trimEnd();
  };
  const fromAgent = (heading, runId, text) => `# ${heading}\n\nSaved by the den's bridge from run ${runId}. What follows the line is the agent's last message, as it wrote it.\n${SEPARATOR}${String(text).trimEnd()}\n`;

  return {
    /** Makes the meeting's directory, numbered after the ones already there. -> its name */
    async create({ ref }) {
      const [feature, ticket] = ref.split("/");
      const base = path.join(root, ".scratch", feature, "meetings");
      await mkdir(base, { recursive: true });
      const slug = ticket.replace(/^\d+-/, "").slice(0, 40);
      for (let tries = 0; tries < 5; tries += 1) {
        const taken = (await readdir(base)).map((n) => /^(\d+)-/.exec(n)).filter(Boolean).map((m) => Number(m[1]));
        const dir = `${String(Math.max(0, ...taken) + 1).padStart(2, "0")}-${slug}`;
        try {
          await mkdir(path.join(base, dir)); // not recursive: a name taken meanwhile is tried again with the next number
          return dir;
        } catch (err) {
          if (err.code !== "EEXIST") throw err;
        }
      }
      throw new Error("meeting store: could not make a directory");
    },
    /** meeting.md, rewritten from the bridge's record after each change. */
    async writeMeeting(m) {
      const seat = (s) => `- ${s.role}: ${s.status === "taken" ? `take given${s.takes > 1 ? ` (${s.takes} takes)` : ""}` : s.status === "declined" ? `declined (${s.reason ?? "no reason given"})` : s.status === "failed" ? `no take (${s.reason ?? "the run failed"})` : "not asked yet"}`;
      const body = [
        `# Meeting: ${m.title}`, "",
        `**Ticket:** ${m.ref}`, "",
        `**Status:** ${m.state === "running" || m.state === "paused" ? "open" : m.state}`, "",
        `**Depth:** quick`, "",
        `**Chair:** ${m.chair}`, "",
        `**Started:** ${m.startedAt}`, "",
        "## Participants", "", ...m.seats.map(seat), "",
        "## Brief", "", m.brief ? `${versioned("brief", m.brief.version)}: ${m.brief.options.map((o) => `${o.key}${o.key === m.brief.recommended ? " (recommended)" : ""}`).join(", ")}` : "Not written yet.", "",
        "## Decisions", "",
        ...(m.decisions.length > 0 ? m.decisions.map((d) => `- ${d.at}: option ${d.option}, "${d.title}", from ${versioned("brief", d.brief)}. Proposed work: ${d.ticket}. It needs your approval before anyone builds it.`) : ["None yet. A brief authorizes nothing by itself."]), "",
        "The topic is quoted in the ticket. This file is the bridge's record; the takes and the brief are the agents' text.", "",
      ].join("\n");
      await put(m, "meeting.md", body);
    },
    writeTake: (m, role, n, runId, text) => put(m, versioned(`take-${role}`, n), fromAgent(`Take: ${role}`, runId, text)),
    writeBrief: (m, version, runId, text) => put(m, versioned("brief", version), fromAgent("Decision brief", runId, text)),
    appendThread: (m, entry) => appendFile(path.join(dirOf(m), "thread.jsonl"), `${JSON.stringify({ ts: new Date().toISOString(), from: entry.from, text: String(entry.text).slice(0, READ_MAX) })}\n`),
    /** What is saved, read back as text: each seat's latest take, the current brief, the follow-ups. */
    async read(m) {
      const takes = [];
      for (const s of m.seats) {
        if (s.takes < 1) continue;
        const text = await saved(m, versioned(`take-${s.role}`, s.takes));
        if (text !== null) takes.push({ role: s.role, n: s.takes, text });
      }
      const brief = m.brief ? await saved(m, versioned("brief", m.brief.version)) : null;
      const raw = await readFile(path.join(dirOf(m), "thread.jsonl"), "utf8").catch(() => "");
      const thread = raw.split("\n").flatMap((l) => {
        try {
          const e = JSON.parse(l);
          return ["user", "chair"].includes(e?.from) && typeof e.text === "string" ? [{ ts: typeof e.ts === "string" ? e.ts.slice(0, 40) : null, from: e.from, text: e.text.slice(0, READ_MAX) }] : [];
        } catch {
          return [];
        }
      }).slice(-THREAD_MAX);
      const summary = await readFile(path.join(dirOf(m), "summary.md"), "utf8").then((t) => t.slice(0, READ_MAX), () => null);
      return { takes, brief, thread, summary };
    },
    /** 24 hours past its end: the summary is written, and the takes and the thread are deleted. The briefs and meeting.md stay. */
    async retire(m, summary) {
      await put(m, "summary.md", summary);
      const dir = dirOf(m);
      for (const name of await readdir(dir)) {
        if (/^take-[a-z]+(-\d+)?\.md$/.test(name) || name === "thread.jsonl") await rm(path.join(dir, name), { force: true });
      }
    },
  };
}
