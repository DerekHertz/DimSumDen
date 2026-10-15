// den-mvp/28: the sandbox mounts an empty read-only file over a denied path that does not exist, and the file outlives the run
// (.git/config.lock in the main checkout, .bash_profile in the worktree). The runtime snapshots which candidates exist before a
// run and removes, after it, the ones the run created that are still empty and read-only. Nothing else is touched.
import { lstat, stat, unlink } from "node:fs/promises";
import path from "node:path";

const GIT_CANDIDATES = ["config", "config.lock", "index.lock", "HEAD.lock", "packed-refs.lock", "shallow.lock", "hooks", "config.worktree"];
const WORKTREE_CANDIDATES = [".bash_profile", ".bash_login", ".bash_logout", ".bash_aliases", ".bashrc", ".profile", ".zshrc", ".zprofile", ".gitconfig", ".gitmodules", ".ripgreprc", ".mcp.json"];

const present = (p) => lstat(p).then(() => true, () => false);

export async function snapshotPlaceholders({ mainGit, worktree } = {}) {
  const candidates = [
    ...(typeof mainGit === "string" ? GIT_CANDIDATES.map((n) => path.join(mainGit, n)) : []),
    ...(typeof worktree === "string" ? WORKTREE_CANDIDATES.map((n) => path.join(worktree, n)) : []),
  ];
  const existed = new Set();
  await Promise.all(candidates.map(async (p) => { if (await present(p)) existed.add(p); }));
  return { candidates, existed };
}

/** Removes each candidate that is new, a regular empty file with no write bit. Never throws. */
export async function sweepPlaceholders({ candidates, existed }) {
  await Promise.all(candidates.map(async (p) => {
    if (existed.has(p)) return;
    try {
      const info = await lstat(p);
      const empty = info.isFile() && info.size === 0 && (info.mode & 0o222) === 0;
      // The sandbox also binds /dev/null over a denied path: a character device with /dev/null's identity.
      const devNull = info.isCharacterDevice() && (await stat("/dev/null").then((n) => n.rdev === info.rdev, () => false));
      if (empty || devNull) await unlink(p);
    } catch { /* gone, or not ours to remove */ }
  }));
}
