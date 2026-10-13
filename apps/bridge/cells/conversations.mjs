// den-mvp outcome 2 (spec section 5): the durable conversation, one per role for this project, kept as append-only
// files at .scratch/_run/conversations/<role>.jsonl. Every transcript entry the host records goes here as it happens,
// tagged with the run that made it and that run's ticket, so the thread a role has with the user outlives the run, a
// reload and a bridge restart, and two runs of one role stay apart. A changed entry is appended again as a patch
// under the same run and id; a read folds them, oldest first.
//
//   append(role, { runId, ref, id, ...fields })   one entry, or a patch to one already written
//   read(role, { before?, limit? }) -> { entries, more, before }
//       the newest `limit` entries that end at position `before` (default: the end); `before` in the answer is the
//       position to ask with for the page above it, and `more` says whether there is one
//
// Like sessions.jsonl, the files are untrusted input: a read checks every field, cleans every string again and returns
// plain data only. Nothing read here is authority for anything; it is shown, never run.
import { mkdir, chmod, appendFile, open } from "node:fs/promises";
import path from "node:path";
import { cleanText } from "./approvals.mjs";
import {
  AGENT_ID_RE, APPROVAL_ID_RE, APPROVAL_NOTE_MAX, CONVERSATION_PAGE, CONVERSATION_PAGE_MAX, CONVERSATION_READ_BYTES, DIRECT_MODE, MODES,
  REF_RE, ROLES, TRANSCRIPT_RESULT_MAX, TRANSCRIPT_TEXT_MAX, UUID_RE,
} from "./policy.mjs";

const CLIP_NOTE = 80; // room for the "[clipped: n more characters]" line the host adds to a cut text
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const validTs = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const text = (v, max) => (typeof v === "string" ? cleanText(v).slice(0, max) : null);
const oneOf = (v, list) => (list.includes(v) ? v : null);

// What each kind of entry may carry. A field that fails its check is left out; a required one that fails drops the entry.
const KINDS = {
  // The marker a run opens with: which ticket it serves and, for a follow-up, the run whose session it continues.
  run: (e) => ({ mode: e.mode === DIRECT_MODE ? DIRECT_MODE : oneOf(e.mode, MODES), resumeOf: typeof e.resumeOf === "string" && AGENT_ID_RE.test(e.resumeOf) ? e.resumeOf : null }),
  message: (e) => {
    const body = text(e.text, TRANSCRIPT_TEXT_MAX + CLIP_NOTE);
    if (body === null || !["agent", "user"].includes(e.role)) return null;
    const status = oneOf(e.status, ["queued", "applied", "undelivered"]);
    return { role: e.role, text: body, ...(typeof e.messageId === "string" && UUID_RE.test(e.messageId) ? { messageId: e.messageId } : {}), ...(status ? { status } : {}) };
  },
  tool: (e) => {
    const name = text(e.name, 100);
    const status = oneOf(e.status, ["running", "done", "failed", "stopped"]);
    if (!name || !status) return null;
    const result = text(e.result, TRANSCRIPT_RESULT_MAX + CLIP_NOTE);
    return { name, summary: text(e.summary, 200) ?? "", status, ...(result === null ? {} : { result }) };
  },
  permission: (e) => {
    const name = text(e.name, 100);
    const status = oneOf(e.status, ["pending", "allowed", "denied", "expired"]);
    if (!name || !status) return null;
    return {
      name, status,
      ...(typeof e.approvalId === "string" && APPROVAL_ID_RE.test(e.approvalId) ? { approvalId: e.approvalId } : {}),
      ...(typeof e.note === "string" ? { note: text(e.note, APPROVAL_NOTE_MAX) } : {}),
      ...(validTs(e.answeredAt) ? { answeredAt: e.answeredAt } : {}),
    };
  },
  stop: (e) => (e.status === "requested" ? { status: "requested" } : null),
  ended: (e) => (["terminated", "done", "failed"].includes(e.state) ? { state: e.state } : null),
};

/** A clean entry or null. Unknown keys are not copied. */
export function validateEntry(raw) {
  if (!isObject(raw) || !AGENT_ID_RE.test(raw.runId) || typeof raw.ref !== "string" || !REF_RE.test(raw.ref)) return null;
  if (!Number.isInteger(raw.id) || raw.id < 0 || !validTs(raw.at) || !Object.hasOwn(KINDS, raw.kind)) return null;
  const fields = KINDS[raw.kind](raw);
  return fields === null ? null : { runId: raw.runId, ref: raw.ref, id: raw.id, at: raw.at, kind: raw.kind, ...fields };
}

export function createConversations(root) {
  const dir = path.join(root, ".scratch", "_run", "conversations");
  const fileOf = (role) => path.join(dir, `${role}.jsonl`);
  const ensured = new Map(); // role -> the promise that its file exists with the right mode
  const chains = new Map(); // role -> the tail of its append queue

  // Dir 0700, file 0600, set explicitly so a pre-existing looser mode is tightened too.
  const ensure = (role) => {
    if (!ensured.has(role)) {
      ensured.set(role, (async () => {
        await mkdir(dir, { recursive: true, mode: 0o700 });
        await chmod(dir, 0o700);
        await appendFile(fileOf(role), "", { mode: 0o600 });
        await chmod(fileOf(role), 0o600);
      })().catch((err) => {
        ensured.delete(role);
        throw err;
      }));
    }
    return ensured.get(role);
  };

  // The last CONVERSATION_READ_BYTES of the file, cut at a line start: a thread older than that is not read back.
  async function tail(role) {
    let handle;
    try {
      handle = await open(fileOf(role), "r");
    } catch {
      return "";
    }
    try {
      const { size } = await handle.stat();
      const start = Math.max(0, size - CONVERSATION_READ_BYTES);
      const buffer = Buffer.alloc(size - start);
      await handle.read(buffer, 0, buffer.length, start);
      const body = buffer.toString("utf8");
      return start === 0 ? body : body.slice(body.indexOf("\n") + 1);
    } finally {
      await handle.close();
    }
  }

  return {
    dir,
    // Appends are serialised per role so lines land in the order they were issued. The promise rejects on a failed write.
    append(role, entry) {
      if (!ROLES.includes(role)) return Promise.reject(new TypeError("conversations: unknown role"));
      const run = (chains.get(role) ?? Promise.resolve()).then(async () => {
        await ensure(role);
        await appendFile(fileOf(role), JSON.stringify(entry) + "\n");
      });
      chains.set(role, run.catch(() => {}));
      return run;
    },
    async read(role, { before, limit } = {}) {
      if (!ROLES.includes(role)) throw new TypeError("conversations: unknown role");
      await chains.get(role); // a page asked for right after an entry was recorded holds that entry
      const folded = new Map(); // "<runId> <id>" -> merged raw entry, in first-seen order
      for (const line of (await tail(role)).split("\n")) {
        if (!line.trim()) continue;
        let raw;
        try {
          raw = JSON.parse(line);
        } catch {
          continue;
        }
        if (!isObject(raw) || typeof raw.runId !== "string" || !Number.isInteger(raw.id)) continue;
        const key = `${raw.runId} ${raw.id}`;
        // A patch never changes what an entry is or whose it is.
        const known = folded.get(key);
        folded.set(key, known ? { ...known, ...raw, kind: known.kind, at: known.at, ref: known.ref } : raw);
      }
      const all = [...folded.values()].map(validateEntry).filter(Boolean);
      const size = Number.isInteger(limit) && limit > 0 ? Math.min(limit, CONVERSATION_PAGE_MAX) : CONVERSATION_PAGE;
      const end = Number.isInteger(before) && before >= 0 ? Math.min(before, all.length) : all.length;
      const start = Math.max(0, end - size);
      return { entries: all.slice(start, end), more: start > 0, before: start };
    },
  };
}
