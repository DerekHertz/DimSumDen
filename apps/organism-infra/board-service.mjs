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
  lstat,
  realpath,
  open,
  mkdir,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
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

export class BoardError extends Error {
  constructor(message) {
    super(message);
    this.name = "BoardError";
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

async function atomicWrite(filePath, content) {
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
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

async function tryCreateLock(lockPath, payload) {
  const handle = await open(lockPath, "wx");
  try {
    await handle.writeFile(JSON.stringify(payload));
  } finally {
    await handle.close();
  }
}

async function acquireWriteLock(lockPath) {
  const payload = {
    pid: process.pid,
    host: os.hostname(),
    createdAt: new Date().toISOString(),
  };
  try {
    await tryCreateLock(lockPath, payload);
    return async () => unlink(lockPath).catch(() => {});
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }

  let existing;
  try {
    existing = JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    throw new BoardError("write lock is held and unreadable");
  }

  const sameHost = existing.host === os.hostname();
  const alive = isPidAlive(existing.pid);
  const ageMs = Date.now() - Date.parse(existing.createdAt);
  const reclaimable = sameHost && !alive && ageMs > WRITE_LOCK_AGE_FLOOR_MS;

  if (!reclaimable) {
    throw new BoardError("write lock is held by another process");
  }

  const tombstone = `${lockPath}.tombstone-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  try {
    await rename(lockPath, tombstone);
  } catch {
    throw new BoardError("write lock was reclaimed by another process");
  }

  try {
    await tryCreateLock(lockPath, payload);
  } catch {
    throw new BoardError("write lock was recreated by another process");
  }
  return async () => unlink(lockPath).catch(() => {});
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

function readStatus(content) {
  const match = content.match(/Status:\s*(\S+)/);
  return match ? match[1] : undefined;
}

function replaceStatus(content, newStatus) {
  if (/Status:\s*\S+/.test(content)) {
    return content.replace(/Status:\s*\S+/, `Status: ${newStatus}`);
  }
  return content;
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

  return withWriteLock(paths.writeLockPath, async () => {
    if (await exists(paths.claimLockPath)) {
      throw new BoardError(`ticket already claimed: ${ref}`);
    }
    if (!(await exists(paths.ticketPath))) {
      throw new BoardError(`ticket not found: ${ref}`);
    }
    await writeFile(
      paths.claimLockPath,
      `${cellType} ${new Date().toISOString()}\n`,
      "utf8"
    );
    const content = await readFile(paths.ticketPath, "utf8");
    const fromStatus = readStatus(content);
    await atomicWrite(paths.ticketPath, replaceStatus(content, "claimed"));
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
