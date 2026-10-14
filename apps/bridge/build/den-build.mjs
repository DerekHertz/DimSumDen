// den-mvp/10 (ADR 0026 decisions 5 to 7): what the bridge does with its own build, for the delivery runner and the roll
// back route. Previews of candidates, the go-live after a merge, and the roll back, in one place so that the switches of
// the UI links happen one at a time.
//   createDenBuild({ stateDir, repo, box, reads, fetchMain, main?, onSwitch? }) -> {
//     preview({ id, sha, signal? })  build the candidate in previews/<id>/ and open its listener
//         -> { ok: true, url, sha } | { ok: false, code: "build" | "environment" | "needs-update" | "stopped", reason, tail }
//     open({ id, sha })              serve an already built preview again (after a stop or a restart) -> { url, sha } | null
//     close(id, { remove? })         close the listener; with `remove` the folder goes too
//     previewOf(id)                  -> { url, sha } | null    the address without the token, for the snapshot
//     previewLink(id)                -> the address with the preview's read-only token, or null
//     goLive({ sha, signal? })       the merge commit, rebuilt from main and switched to
//         -> { ok: true, release } | { ok: false, code: "needs-update" | "failed", reason }
//     rollback(to)                   releases.rollbackUi, in the same queue as the go-lives
//     sweep(keep)                    at start: half-made releases, and previews of deliveries that are not waiting
//     shutdown()                     the bridge stops: every preview closes
//   }
// `reads` is a function that returns the bridge's previewReads, or a promise of them (they are made after this object is). `fetchMain` fetches
// the remote main branch. `onSwitch` is told after every switch of ui/current.
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { JOB_ID_RE } from "../delivery/jobs.mjs";
import { openPreview } from "./preview.mjs";
import { ReleaseError, checkSha, createReleases, currentRelease, extractArchive } from "./releases.mjs";

const RECORD = "preview.json";
const MAKING = ".making";
// What the UI build takes from outside apps/ui/: a difference here between the running bridge and a merged commit means
// the new UI was built against code the running bridge is not.
const BRIDGE_PATHS = ["apps/bridge", "package-lock.json"];

const run = (file, args) => new Promise((resolve, reject) => {
  execFile(file, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => (err ? reject(Object.assign(err, { stderr })) : resolve(String(stdout))));
});
const isDir = (p) => stat(p).then((s) => s.isDirectory(), () => false);

export function createDenBuild({ stateDir, repo, box, reads, fetchMain = async () => {}, main = "origin/main", onSwitch = () => {}, archive = extractArchive } = {}) {
  if (typeof stateDir !== "string" || !path.isAbsolute(stateDir)) throw new TypeError("createDenBuild: stateDir must be an absolute path");
  const releases = createReleases({ stateDir, repo, box, main });
  const previewsDir = path.join(stateDir, "previews");
  const opened = new Map(); // job id -> { url, sha, close }
  let chain = Promise.resolve(); // one switch of the UI links at a time
  const queued = (fn) => {
    const next = chain.then(fn);
    chain = next.catch(() => {});
    return next;
  };
  const git = (args) => run("git", ["-C", repo, ...args]);
  // Every preview path is built from a checked job id and fixed names.
  const folder = (id) => {
    if (typeof id !== "string" || !JOB_ID_RE.test(id)) throw new TypeError("den build: not a delivery id");
    return path.join(previewsDir, id);
  };
  const failed = (code, reason, tail = "") => ({ ok: false, code, reason, tail });

  async function close(id, { remove = false } = {}) {
    const dir = folder(id);
    const was = opened.get(id);
    opened.delete(id);
    await was?.close();
    if (remove) await rm(dir, { recursive: true, force: true });
  }

  async function open({ id, sha }) {
    const dir = folder(id);
    checkSha(sha);
    const has = opened.get(id);
    if (has?.sha === sha) return { url: has.url.split("#")[0], sha };
    await close(id);
    try {
      const record = JSON.parse(await readFile(path.join(dir, RECORD), "utf8"));
      if (record?.sha !== sha) return null;
      const listener = await openPreview({ id, dir, reads: await reads() });
      opened.set(id, { ...listener, sha });
      return { url: listener.url.split("#")[0], sha };
    } catch {
      return null; // no folder, no record, no built files: it is built again
    }
  }

  async function preview({ id, sha, signal } = {}) {
    const dir = folder(id);
    checkSha(sha);
    await close(id, { remove: true });
    if (!box) return failed("environment", "there is no build box to build the preview in");
    let packages;
    try {
      await git(["cat-file", "-e", `${sha}^{commit}`]);
      ({ packages } = await releases.packagesFor(sha));
    } catch (err) {
      if (err instanceof ReleaseError) return failed("needs-update", `${err.message}. A change that alters the lockfile cannot be previewed`);
      return failed("environment", `the candidate commit ${sha.slice(0, 12)} is not in this repository`);
    }
    await mkdir(dir, { recursive: true });
    try {
      await writeFile(path.join(dir, MAKING), `${process.pid}\n`);
      await archive(repo, sha, dir);
      const out = await box.build({ folder: dir, packages, signal });
      if (!out.ok) {
        await rm(dir, { recursive: true, force: true });
        return failed(["build", "stopped"].includes(out.code) ? out.code : "environment", out.reason ?? "the build failed", out.tail ?? "");
      }
      await writeFile(path.join(dir, RECORD), `${JSON.stringify({ sha, builtAt: new Date().toISOString() })}\n`);
      await unlink(path.join(dir, MAKING));
    } catch (err) {
      await rm(dir, { recursive: true, force: true });
      throw err;
    }
    const shown = await open({ id, sha });
    return shown ? { ok: true, ...shown } : failed("environment", "the preview was built but could not be served");
  }

  const previewOf = (id) => {
    const has = opened.get(id);
    return has ? { url: has.url.split("#")[0], sha: has.sha } : null;
  };
  const previewLink = (id) => opened.get(id)?.url ?? null;

  const within = async (older, newer) => {
    try {
      await git(["merge-base", "--is-ancestor", older, newer]);
      return true;
    } catch {
      return false;
    }
  };

  const goLive = ({ sha, signal } = {}) => queued(async () => {
    checkSha(sha);
    const bridge = await currentRelease(stateDir, "bridge");
    if (!bridge) return failed("failed", "the den runs from the checkout: there are no release folders to go live in (npm run den:install)");
    try {
      await fetchMain();
    } catch (err) {
      return failed("failed", `could not fetch main: ${String(err?.stderr || err?.message || err).trim().slice(0, 200)}`);
    }
    // A later merge that is already live holds this one: nothing older is put in front of it.
    const live = await currentRelease(stateDir, "ui");
    if (live && (live.sha === sha || (await within(sha, live.sha)))) return { ok: true, release: live.sha };
    let differs;
    try {
      differs = (await git(["diff", "--name-only", "--no-renames", "-z", bridge.sha, sha, "--", ...BRIDGE_PATHS])).split("\0").filter(Boolean);
    } catch (err) {
      return failed("failed", `could not compare the merged commit with the running bridge: ${String(err?.stderr || err?.message || err).trim().slice(0, 200)}`);
    }
    if (differs.length) return failed("needs-update", `the merged commit changes ${differs.length === 1 ? differs[0] : `${differs.length} files of the bridge or the lockfile`}, which the running bridge (${bridge.sha.slice(0, 12)}) does not have; the den must be updated before this change can go live`);
    try {
      await releases.makeRelease(sha, { signal });
      await releases.switchUi(sha);
    } catch (err) {
      if (!(err instanceof ReleaseError)) throw err;
      return failed(err.code === "needs-update" ? "needs-update" : "failed", err.message);
    }
    await onSwitch();
    return { ok: true, release: sha };
  });

  const rollback = (to) => queued(async () => {
    await releases.rollbackUi(to);
    await onSwitch();
  });

  async function sweep(keep = []) {
    await releases.sweep();
    for (const name of await readdir(previewsDir).catch(() => [])) {
      if (!keep.includes(name) || !(await isDir(path.join(previewsDir, name))) || (await stat(path.join(previewsDir, name, MAKING)).then(() => true, () => false))) {
        await rm(path.join(previewsDir, name), { recursive: true, force: true });
      }
    }
  }

  async function shutdown() {
    await Promise.all([...opened.keys()].map((id) => close(id)));
  }

  return { preview, open, close, previewOf, previewLink, goLive, rollback, sweep, shutdown, releases };
}
