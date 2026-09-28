// organism-infra/02: the board service — the single writer of the board.
// Implements markdown parsing/editing, per-mutation locking, atomic writes
// and event sequencing per docs/adr/0008-board-service.md. `board.mjs` is
// its only adapter today (CLI, in-process); a daemon-IPC wrapper can be
// added later without changing this module's interface.
import {
  readFile,
  writeFile,
  rename,
  unlink,
  stat,
  realpath,
  open,
  mkdir,
  link,
  readdir,
} from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";

export const STATUSES = [
  "ready-for-agent",
  "claimed",
  "in-review",
  "resolved",
  "blocked",
  "ready-for-human",
];

const MAX_ARG_LEN = 4000;
const WRITE_LOCK_AGE_FLOOR_MS = 5000;
// Total time a mutation waits on a live write lock before giving up.
const WRITE_LOCK_WAIT_MS = 2500;
const BACKOFF_START_MS = 20;
const BACKOFF_CAP_MS = 400;
// Windows refuses a rename over a file another process has open.
const RENAME_RETRY_MS = 1000;

// Gates every BOARD_TEST_* test-only seam (fault injection, interleaving
// hooks, hold logging): inert in production even if the env vars leak in.
const TEST_HOOKS_ENABLED = process.env.NODE_ENV !== "production";

export class BoardError extends Error {
  constructor(message) {
    super(message);
    this.name = "BoardError";
  }
}

// The write lock stayed held for the whole bounded wait. The CLI maps this to
// exit code 75 (EX_TEMPFAIL): retrying later may succeed.
export class LockTimeoutError extends BoardError {
  constructor(message) {
    super(message);
    this.name = "LockTimeoutError";
    this.exitCode = 75;
  }
}

// --- Root resolution --------------------------------------------------------

export function resolveRoot(cwd, env) {
  if (env.ORGANISM_ROOT) {
    return path.resolve(env.ORGANISM_ROOT);
  }
  try {
    const out = execFileSync("git", ["worktree", "list", "--porcelain"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const match = out.match(/^worktree (.+)$/m);
    if (match) return match[1].trim();
  } catch {
    // fall through to error below
  }
  throw new BoardError(
    "could not resolve the main checkout: set $ORGANISM_ROOT or run inside a git worktree"
  );
}

// --- Validation --------------------------------------------------------------

const FEATURE_RE = /^[a-z0-9-]+$/;
const TICKET_RE = /^\d{2}-[a-z0-9-]+$/;

export function checkArgLength(value, name) {
  if (typeof value === "string" && value.length > MAX_ARG_LEN) {
    throw new BoardError(`${name} exceeds the maximum length of ${MAX_ARG_LEN}`);
  }
}

export function parseTicketRef(ref) {
  checkArgLength(ref, "ticket ref");
  const parts = typeof ref === "string" ? ref.split("/") : [];
  if (parts.length !== 2) {
    throw new BoardError(`invalid ticket ref: ${ref}`);
  }
  const [feature, ticket] = parts;
  if (!FEATURE_RE.test(feature)) {
    throw new BoardError(`invalid feature segment: ${feature}`);
  }
  if (!TICKET_RE.test(ticket)) {
    throw new BoardError(`invalid ticket segment: ${ticket}`);
  }
  return { feature, ticket };
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

// Walks up from targetPath to the nearest existing ancestor, resolves it
// through any symlinks, and rejects if that real path falls outside root.
// Catches both plain traversal (already caught earlier by parseTicketRef)
// and a symlinked directory under the board that points outside it.
async function assertWithinRoot(root, targetPath) {
  const realRoot = await realpath(root);
  let current = targetPath;
  for (;;) {
    if (await exists(current)) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const realCurrent = await realpath(current).catch(() => current);
  const rel = path.relative(realRoot, realCurrent);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new BoardError(`path escapes the board root: ${targetPath}`);
  }
}

// --- Paths --------------------------------------------------------------------

export function boardPaths(root, feature, ticket) {
  const issuesDir = path.join(root, ".scratch", feature, "issues");
  return {
    issuesDir,
    ticketPath: path.join(issuesDir, `${ticket}.md`),
    claimLockPath: path.join(issuesDir, `${ticket}.lock`),
    writeLockPath: path.join(issuesDir, `${ticket}.write-lock.json`),
    eventsPath: path.join(root, ".scratch", "events.jsonl"),
  };
}

// --- Atomic writes -------------------------------------------------------------

// Full-jitter exponential backoff: a random delay in [1, min(cap, start*2^n)].
function backoffDelay(attempt) {
  const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_START_MS * 2 ** attempt);
  return Math.max(1, Math.round(Math.random() * ceiling));
}

const RETRYABLE_RENAME = new Set(["EPERM", "EBUSY", "EACCES"]);

async function renameWithRetry(from, to) {
  const deadline = Date.now() + RENAME_RETRY_MS;
  for (let attempt = 0; ; attempt++) {
    try {
      return await rename(from, to);
    } catch (err) {
      if (!RETRYABLE_RENAME.has(err.code) || Date.now() >= deadline) throw err;
      await sleep(backoffDelay(attempt));
    }
  }
}

// Test-only fault injection for the reclaim unlink below (gated the same as
// every other BOARD_TEST_* seam): BOARD_TEST_FORCE_UNLINK_ERR=<code> +
// BOARD_TEST_FORCE_UNLINK_COUNT=<n> makes the next n unlinkWithRetry calls
// throw that error code before falling through to the real unlink, so a test
// can exercise the EPERM/EBUSY/EACCES retry path without depending on a real
// OS-level file lock.
let testForceUnlinkFailuresLeft = TEST_HOOKS_ENABLED
  ? Number(process.env.BOARD_TEST_FORCE_UNLINK_COUNT || 0)
  : 0;

// Windows can also refuse an unlink of a file another process has open
// (e.g. mid-read); retry it the same bounded way as a rename.
async function unlinkWithRetry(target) {
  const deadline = Date.now() + RENAME_RETRY_MS;
  for (let attempt = 0; ; attempt++) {
    try {
      if (TEST_HOOKS_ENABLED && testForceUnlinkFailuresLeft > 0 && process.env.BOARD_TEST_FORCE_UNLINK_ERR) {
        testForceUnlinkFailuresLeft -= 1;
        const err = new Error("test-injected unlink failure");
        err.code = process.env.BOARD_TEST_FORCE_UNLINK_ERR;
        throw err;
      }
      return await unlink(target);
    } catch (err) {
      if (!RETRYABLE_RENAME.has(err.code) || Date.now() >= deadline) throw err;
      await sleep(backoffDelay(attempt));
    }
  }
}

async function atomicWrite(filePath, content) {
  // Unique temp name: two writers never share (and clobber) one temp file.
  const tmp = `${filePath}.${process.pid}-${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, content, "utf8");
  try {
    await renameWithRetry(tmp, filePath);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

// --- Write lock -----------------------------------------------------------------

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

async function tryCreateLock(lockPath, raw) {
  const handle = await open(lockPath, "wx");
  try {
    await handle.writeFile(raw);
  } finally {
    await handle.close();
  }
}

// Removes the lock only if it is still ours (token match), so a release can
// never delete a lock another process has since taken.
function releaser(lockPath, raw) {
  return async () => {
    const current = await readFile(lockPath, "utf8").catch(() => null);
    if (current === raw) await unlink(lockPath).catch(() => {});
  };
}

function isReclaimable(existing) {
  const sameHost = existing.host === os.hostname();
  const alive = isPidAlive(existing.pid);
  const ageMs = Date.now() - Date.parse(existing.createdAt);
  return sameHost && !alive && ageMs > WRITE_LOCK_AGE_FLOOR_MS;
}

// Creates `filePath` exclusively with its full content in one step (temp file
// plus hard link), so the file is never observed empty or half-written.
async function createExclusive(filePath, content) {
  const tmp = `${filePath}.${process.pid}-${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, content, "utf8");
  try {
    await link(tmp, filePath);
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

// Sweeps `<lockPath>.reclaim-*` mutex files left behind by a prior reclaim
// whose stale lock is already gone (security finding: orphaned tombstones
// can accumulate when generations are exhausted or content changes before
// cleanup, board-service.mjs:251-290 as of ticket 13). Only ever called right
// after this process created `lockPath` fresh (no lock existed to block us),
// so any `.reclaim-*` sibling at that moment cannot belong to a live reclaim.
async function sweepOrphanedReclaimFiles(lockPath) {
  const dir = path.dirname(lockPath);
  const prefix = `${path.basename(lockPath)}.reclaim-`;
  const entries = await readdir(dir).catch(() => []);
  await Promise.all(
    entries.filter((e) => e.startsWith(prefix)).map((e) => unlink(path.join(dir, e)).catch(() => {}))
  );
}

const RECLAIM_GENERATIONS = 8;

// Removes a lock judged stale, race-free. Returns true only if this call
// removed it. Invariant argument: .scratch/organism-infra/handoffs/13-developer.md.
//
// Reclaimers of one stale lock serialize on a reclaim mutex named after that
// lock's exact content: `<lock>.reclaim-<hash(staleRaw)>-<g>`, created
// exclusively. Holding it, we re-read the lock and remove it only if it is
// still byte-identical to what we judged stale and still meets the reclaim
// rules. Nothing else can change the lock file in between: its owner is dead,
// releasers only remove their own token, acquirers only create at an empty
// path, and every other reclaimer of this content is shut out by the mutex
// (reclaimers of other content see different bytes and do nothing).
//
// A mutex holder that crashes would block reclaim forever, so its rule: if
// generation g is held by a dead pid on this host, move on to g+1. A process
// holds generation g only if every lower generation's holder was dead when it
// looked, and dead stays dead, so at most one live process holds any
// generation. Mutex files are deleted only after the stale lock is gone, when
// holding one no longer lets anyone remove anything.
async function reclaimStale(lockPath, staleRaw, stale) {
  const id = createHash("sha256").update(staleRaw).digest("hex").slice(0, 16);
  const mine = JSON.stringify({ pid: process.pid, host: os.hostname() });
  const mutexPath = (g) => `${lockPath}.reclaim-${id}-${g}`;

  for (let g = 0; g < RECLAIM_GENERATIONS; g++) {
    try {
      await createExclusive(mutexPath(g), mine);
    } catch (err) {
      if (err.code !== "EEXIST") return false;
      const holderRaw = await readFile(mutexPath(g), "utf8").catch(() => null);
      if (holderRaw === null) return false; // just cleaned up: the stale lock is gone
      let holder = null;
      try {
        holder = JSON.parse(holderRaw);
      } catch {
        return false;
      }
      if (holder && holder.host === os.hostname() && !isPidAlive(holder.pid)) continue;
      return false; // a live reclaimer is on it: back off
    }

    let gone = false;
    let removed = false;
    try {
      const current = await readFile(lockPath, "utf8").catch(() => null);
      gone = current !== staleRaw;
      if (!gone && isReclaimable(stale)) {
        await testHook("reclaim-gap");
        await unlinkWithRetry(lockPath);
        gone = removed = true;
      }
    } finally {
      const cleanup = gone ? Array.from({ length: g + 1 }, (_, i) => mutexPath(i)) : [mutexPath(g)];
      await Promise.all(cleanup.map((p) => unlink(p).catch(() => {})));
    }
    return removed;
  }
  return false;
}

// Acquires the per-ticket write lock (ADR 0008 decision 2). A live lock is
// waited on with bounded, full-jitter exponential backoff (sleeping, never
// spinning) and never stolen; after WRITE_LOCK_WAIT_MS it throws
// LockTimeoutError. Reclaim rules are unchanged: same host, dead pid, and
// older than the age floor.
async function acquireWriteLock(lockPath) {
  const raw = JSON.stringify({
    pid: process.pid,
    host: os.hostname(),
    createdAt: new Date().toISOString(),
    token: randomBytes(8).toString("hex"),
  });
  // Test-only override so a test can force the deadline to have already
  // passed without a multi-second real-time wait (gated like every other
  // BOARD_TEST_* seam).
  const waitMs =
    TEST_HOOKS_ENABLED && process.env.BOARD_TEST_WRITE_LOCK_WAIT_MS !== undefined
      ? Number(process.env.BOARD_TEST_WRITE_LOCK_WAIT_MS)
      : WRITE_LOCK_WAIT_MS;
  const deadline = Date.now() + waitMs;
  let lastReason = "is held by another process";

  for (let attempt = 0; ; attempt++) {
    try {
      await tryCreateLock(lockPath, raw);
      await sweepOrphanedReclaimFiles(lockPath);
      return releaser(lockPath, raw);
    } catch (err) {
      // On Windows a just-unlinked lock can linger delete-pending while a
      // reader has it open, and create then fails with EPERM: treat as busy.
      if (!["EEXIST", "EPERM", "EACCES", "EBUSY"].includes(err.code)) throw err;
    }

    const existingRaw = await readFile(lockPath, "utf8").catch(() => null);
    let existing = null;
    if (existingRaw !== null) {
      try {
        existing = JSON.parse(existingRaw);
        if (!existing || typeof existing !== "object") throw new Error("not a lock object");
        lastReason = `is held by pid ${existing.pid} on ${existing.host}`;
      } catch {
        // Mid-write by its creator, or corrupt: treat as held.
        lastReason = "is held and unreadable";
      }
    }

    // Retry the create at once only after removing a stale lock ourselves.
    // Every other path (live lock, lost reclaim race, vanished lock) sleeps,
    // so no interleaving can spin, and the deadline bounds the whole wait.
    if (existing && isReclaimable(existing)) {
      await testHook("stale-judged");
      const reclaimed = await reclaimStale(lockPath, existingRaw, existing);
      await testHook("post-reclaim");
      // A successful self-reclaim retries the create at once (no sleep), so
      // without this check the deadline below would never run: a lock that
      // keeps coming back stale (e.g. repeatedly recreated by another party)
      // could loop past WRITE_LOCK_WAIT_MS indefinitely instead of bailing
      // out with LockTimeoutError like every other path does.
      if (reclaimed) {
        if (Date.now() >= deadline) {
          throw new LockTimeoutError(
            `write lock ${lastReason}; gave up after ${waitMs}ms, retry later (${lockPath})`
          );
        }
        continue;
      }
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new LockTimeoutError(
        `write lock ${lastReason}; gave up after ${waitMs}ms, retry later (${lockPath})`
      );
    }
    await sleep(Math.min(backoffDelay(attempt), remaining));
  }
}

async function withWriteLock(lockPath, fn) {
  const release = await acquireWriteLock(lockPath);
  const hold = await testHoldStart(lockPath);
  try {
    return await fn();
  } finally {
    await testHoldEnd(lockPath, hold);
    await release();
  }
}

// --- Test seam (inert unless BOARD_TEST_* env vars are set) -----------------------
// Lets tests force exact multi-process interleavings of the lock code.
// BOARD_TEST_HOOK_DIR + BOARD_TEST_HOOKS=<point,...>: at each listed point the
//   process writes <dir>/<point>.reached and waits (bounded) for <dir>/<point>.go.
// BOARD_TEST_HOLD_LOG=<dir> [+ BOARD_TEST_HOLD_MS]: every lock hold is logged to
//   its own file in <dir> as {lock, pid, acquiredAt, releasedAt}, and lasts at
//   least BOARD_TEST_HOLD_MS, so tests can assert that no two holds overlap.
//
// Gated on NODE_ENV !== "production" (security finding, ticket 12/13): these
// hooks can pause a live mutation on an external signal file, so a production
// deploy must never honor them even if the env vars leak in somehow.

async function testHook(point) {
  if (!TEST_HOOKS_ENABLED) return;
  const dir = process.env.BOARD_TEST_HOOK_DIR;
  const points = (process.env.BOARD_TEST_HOOKS || "").split(",");
  if (!dir || !points.includes(point)) return;
  await writeFile(path.join(dir, `${point}.reached`), String(process.pid));
  const go = path.join(dir, `${point}.go`);
  const deadline = Date.now() + 15000;
  while (!(await exists(go)) && Date.now() < deadline) await sleep(20);
}

async function testHoldStart(lockPath) {
  if (!TEST_HOOKS_ENABLED) return null;
  if (!process.env.BOARD_TEST_HOLD_LOG) return null;
  const acquiredAt = Date.now();
  const ms = Number(process.env.BOARD_TEST_HOLD_MS || 0);
  // Stretch only ticket-lock holds; the nested events lock stays short.
  if (ms > 0 && !path.basename(lockPath).startsWith("events.")) await sleep(ms);
  return acquiredAt;
}

async function testHoldEnd(lockPath, acquiredAt) {
  if (!TEST_HOOKS_ENABLED) return;
  const dir = process.env.BOARD_TEST_HOLD_LOG;
  if (!dir || acquiredAt === null) return;
  const record = { lock: path.basename(lockPath), pid: process.pid, acquiredAt, releasedAt: Date.now() };
  const name = `hold-${process.pid}-${randomBytes(4).toString("hex")}.json`;
  await writeFile(path.join(dir, name), JSON.stringify(record));
}

// --- Events ---------------------------------------------------------------------

// events.jsonl is shared by every ticket, so the per-ticket write lock does
// not serialize it. A board-wide events lock (same bounded wait and reclaim
// rules) guards it. Lock order is always ticket lock, then events lock, so no
// deadlock. The events lock is taken before any ticket write: a timeout on
// either lock leaves nothing written, so a ticket change and its event line
// land together or not at all.
async function commitWithEvent(eventsPath, writeTicket, event) {
  await mkdir(path.dirname(eventsPath), { recursive: true });
  return withWriteLock(`${eventsPath}.write-lock.json`, async () => {
    await writeTicket();
    return appendEventLocked(eventsPath, event);
  });
}

// Caller holds the events lock. A whole-file temp write plus rename, not an
// `a`-flag append: O_APPEND is not an atomic append on Windows, and the
// rename means a reader never sees a torn line.
async function appendEventLocked(eventsPath, event) {
  const current = await readFile(eventsPath, "utf8").catch((err) => {
    if (err.code === "ENOENT") return "";
    throw err;
  });
  let lastSeq = 0;
  const lines = current.trim().split("\n").filter(Boolean);
  if (lines.length > 0) {
    try {
      lastSeq = JSON.parse(lines[lines.length - 1]).seq ?? 0;
    } catch {
      lastSeq = 0;
    }
  }
  const full = { seq: lastSeq + 1, ts: new Date().toISOString(), ...event };
  const prefix = current === "" || current.endsWith("\n") ? current : `${current}\n`;
  await atomicWrite(eventsPath, `${prefix}${JSON.stringify(full)}\n`);
  return full;
}

// --- Ticket helpers ---------------------------------------------------------------

// The header status line: `**Status:** value` (the real format) or plain
// `Status: value`, at the start of a line, before the first `## ` section.
// Status text mid-line in body prose, or anywhere under ## Comments, never
// matches.
const STATUS_LINE_RE = /^(\*\*Status:\*\*|\*\*Status\*\*:|Status:)([ \t]*)([^\s*]+)/m;

function findStatus(content) {
  const section = /^## /m.exec(content);
  const header = section ? content.slice(0, section.index) : content;
  const m = STATUS_LINE_RE.exec(header);
  if (!m) return undefined;
  return { index: m.index, label: m[1], gap: m[2] || " ", value: m[3], length: m[0].length };
}

function readStatus(content) {
  return findStatus(content)?.value;
}

function replaceStatus(content, newStatus) {
  const found = findStatus(content);
  if (!found) {
    throw new BoardError("ticket has no header status line (**Status:** <value>)");
  }
  return (
    content.slice(0, found.index) +
    found.label +
    found.gap +
    newStatus +
    content.slice(found.index + found.length)
  );
}

// JS regex `^`/`$` in multiline mode -- the shape STAMP_RE and
// STATUS_LINE_RE use -- treat LF, CR, CRLF, U+2028 (LINE SEPARATOR) and
// U+2029 (PARAGRAPH SEPARATOR) all as line terminators, not just "\n".
const LINE_TERMINATOR_RE = new RegExp("\r\n|[\n\r\u2028\u2029]");

// Indents every line after the first so embedded line terminators in
// free-form comment text can never start a new line at column 0 -- the
// shape the stamp regex (`^- **<cell>, <date>:**`) requires. Splitting on
// "\n" alone is not enough: a bare CR, U+2028 or U+2029 also counts as a
// line terminator for `^`/`$` in multiline mode, so any of those left
// unindented would still render as a second, forged attributed comment
// line on read-back.
function sanitizeCommentText(text) {
  return text
    .split(LINE_TERMINATOR_RE)
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join("\n");
}

function claimingCell(lockContent) {
  const token = lockContent.trim().split(/\s+/)[0];
  return token || "unknown";
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// --- Public operations -------------------------------------------------------------

async function prepare(root, ref) {
  const { feature, ticket } = parseTicketRef(ref);
  const paths = boardPaths(root, feature, ticket);
  await assertWithinRoot(root, paths.issuesDir);
  return { feature, ticket, paths };
}

export async function claim(root, ref, cellType) {
  checkArgLength(cellType, "cell type");
  const { feature, ticket, paths } = await prepare(root, ref);

  // A taken claim lock fails fast, without waiting on the write lock. It is
  // checked again under the write lock, which is the authoritative check.
  if (await exists(paths.claimLockPath)) {
    throw new BoardError(`ticket already claimed: ${ref}`);
  }

  return withWriteLock(paths.writeLockPath, async () => {
    await assertWithinRoot(root, paths.issuesDir);
    if (await exists(paths.claimLockPath)) {
      throw new BoardError(`ticket already claimed: ${ref}`);
    }
    if (!(await exists(paths.ticketPath))) {
      throw new BoardError(`ticket not found: ${ref}`);
    }
    // Read and validate before creating the claim lock, so a ticket with no
    // header status line is refused without leaving a lock behind.
    const content = await readFile(paths.ticketPath, "utf8");
    const fromStatus = readStatus(content);
    const updated = replaceStatus(content, "claimed");
    await commitWithEvent(paths.eventsPath, async () => {
      await writeFile(
        paths.claimLockPath,
        `${cellType} ${new Date().toISOString()}\n`,
        { encoding: "utf8", flag: "wx" }
      );
      await atomicWrite(paths.ticketPath, updated);
    }, {
      feature,
      ticket,
      cell: cellType,
      op: "claim",
      from_status: fromStatus,
      to_status: "claimed",
    });
    return { status: "claimed" };
  });
}

export async function release(root, ref, newStatus, reason) {
  checkArgLength(newStatus, "status");
  checkArgLength(reason, "reason");
  if (!STATUSES.includes(newStatus)) {
    throw new BoardError(`invalid status: ${newStatus}`);
  }
  const { feature, ticket, paths } = await prepare(root, ref);

  return withWriteLock(paths.writeLockPath, async () => {
    await assertWithinRoot(root, paths.issuesDir);
    let cell = "unknown";
    if (await exists(paths.claimLockPath)) {
      cell = claimingCell(await readFile(paths.claimLockPath, "utf8"));
    }
    const content = await readFile(paths.ticketPath, "utf8");
    const fromStatus = readStatus(content);
    let updated = replaceStatus(content, newStatus);
    if (reason) {
      updated = `${updated.trimEnd()}\n- **${cell}, ${todayUTC()}:** ${reason}\n`;
    }
    await commitWithEvent(paths.eventsPath, async () => {
      await atomicWrite(paths.ticketPath, updated);
      await unlink(paths.claimLockPath).catch(() => {});
    }, {
      feature,
      ticket,
      cell,
      op: "release",
      from_status: fromStatus,
      to_status: newStatus,
    });
    return { status: newStatus };
  });
}

export async function getStatus(root, ref) {
  const { paths } = await prepare(root, ref);
  if (!(await exists(paths.ticketPath))) {
    throw new BoardError(`ticket not found: ${ref}`);
  }
  const content = await readFile(paths.ticketPath, "utf8");
  return readStatus(content);
}

export async function comment(root, ref, text) {
  checkArgLength(text, "comment");
  const { feature, ticket, paths } = await prepare(root, ref);

  return withWriteLock(paths.writeLockPath, async () => {
    // Re-verify containment at the actual write: the realpath check in
    // prepare() and the symlink it resolved can both be stale by the time we
    // reach here, since acquiring the write lock can mean sleeping through a
    // bounded wait. Re-checking right before touching the ticket closes that
    // check-then-write window.
    await assertWithinRoot(root, paths.issuesDir);
    let cell = "unknown";
    if (await exists(paths.claimLockPath)) {
      cell = claimingCell(await readFile(paths.claimLockPath, "utf8"));
    }
    const content = await readFile(paths.ticketPath, "utf8");
    const stamp = `- **${cell}, ${todayUTC()}:** ${sanitizeCommentText(text)}`;
    let updated;
    if (/## Comments/.test(content)) {
      updated = `${content.trimEnd()}\n${stamp}\n`;
    } else {
      updated = `${content.trimEnd()}\n\n## Comments\n${stamp}\n`;
    }
    await commitWithEvent(paths.eventsPath, () => atomicWrite(paths.ticketPath, updated), {
      feature,
      ticket,
      cell,
      op: "comment",
      text,
    });
    return { ok: true };
  });
}

export async function list(root, { feature, status } = {}) {
  const { readdir } = await import("node:fs/promises");
  const scratchDir = path.join(root, ".scratch");
  const results = [];
  let features;
  if (feature) {
    checkArgLength(feature, "feature");
    if (!FEATURE_RE.test(feature)) {
      throw new BoardError(`invalid feature segment: ${feature}`);
    }
    features = [feature];
  } else {
    features = (await readdir(scratchDir, { withFileTypes: true }).catch(() => []))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  }
  for (const feat of features) {
    const issuesDir = path.join(scratchDir, feat, "issues");
    const entries = await readdir(issuesDir).catch(() => []);
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const ticket = entry.slice(0, -3);
      const content = await readFile(path.join(issuesDir, entry), "utf8").catch(() => "");
      const ticketStatus = readStatus(content);
      if (status && ticketStatus !== status) continue;
      results.push({ feature: feat, ticket, status: ticketStatus });
    }
  }
  return results;
}
