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
} from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
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

// Tombstone-renames a lock judged stale. Only one racing reclaimer's rename
// can succeed. But if another reclaimer already replaced the stale lock with
// a fresh one between our read and our rename, we renamed the wrong file:
// detect that by content and put it back with an exclusive link, which never
// overwrites a lock created since. Returns true only if the stale lock is gone.
async function tombstoneStale(lockPath, staleRaw) {
  const tombstone = `${lockPath}.tombstone-${process.pid}-${Date.now()}-${randomBytes(4).toString("hex")}`;
  try {
    await rename(lockPath, tombstone);
  } catch {
    return false; // someone else reclaimed or released it first
  }
  const taken = await readFile(tombstone, "utf8").catch(() => null);
  const wasStale = taken === staleRaw;
  if (!wasStale) {
    await link(tombstone, lockPath).catch(() => {});
  }
  await unlink(tombstone).catch(() => {});
  return wasStale;
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
  const deadline = Date.now() + WRITE_LOCK_WAIT_MS;
  let lastReason = "is held by another process";

  for (let attempt = 0; ; attempt++) {
    try {
      await tryCreateLock(lockPath, raw);
      return releaser(lockPath, raw);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
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
    if (existing && isReclaimable(existing) && (await tombstoneStale(lockPath, existingRaw))) {
      continue;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new LockTimeoutError(
        `write lock ${lastReason}; gave up after ${WRITE_LOCK_WAIT_MS}ms, retry later (${lockPath})`
      );
    }
    await sleep(Math.min(backoffDelay(attempt), remaining));
  }
}

async function withWriteLock(lockPath, fn) {
  const release = await acquireWriteLock(lockPath);
  try {
    return await fn();
  } finally {
    await release();
  }
}

// --- Events ---------------------------------------------------------------------

async function appendEvent(eventsPath, event) {
  let lastSeq = 0;
  if (await exists(eventsPath)) {
    const content = await readFile(eventsPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length > 0) {
      try {
        lastSeq = JSON.parse(lines[lines.length - 1]).seq ?? 0;
      } catch {
        lastSeq = 0;
      }
    }
  } else {
    await mkdir(path.dirname(eventsPath), { recursive: true });
  }
  const full = { seq: lastSeq + 1, ts: new Date().toISOString(), ...event };
  const line = `${JSON.stringify(full)}\n`;
  const current = (await exists(eventsPath)) ? await readFile(eventsPath, "utf8") : "";
  await atomicWrite(eventsPath, current + line);
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
    await writeFile(
      paths.claimLockPath,
      `${cellType} ${new Date().toISOString()}\n`,
      { encoding: "utf8", flag: "wx" }
    );
    await atomicWrite(paths.ticketPath, updated);
    await appendEvent(paths.eventsPath, {
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
    await atomicWrite(paths.ticketPath, updated);
    await unlink(paths.claimLockPath).catch(() => {});
    await appendEvent(paths.eventsPath, {
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
    let cell = "unknown";
    if (await exists(paths.claimLockPath)) {
      cell = claimingCell(await readFile(paths.claimLockPath, "utf8"));
    }
    const content = await readFile(paths.ticketPath, "utf8");
    const stamp = `- **${cell}, ${todayUTC()}:** ${text}`;
    let updated;
    if (/## Comments/.test(content)) {
      updated = `${content.trimEnd()}\n${stamp}\n`;
    } else {
      updated = `${content.trimEnd()}\n\n## Comments\n${stamp}\n`;
    }
    await atomicWrite(paths.ticketPath, updated);
    await appendEvent(paths.eventsPath, {
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
