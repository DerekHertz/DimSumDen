// den-mvp outcome 5 (ADR 0026 decision 2): the build box. A UI build runs the folder's own code (its Vite config, its
// plugins, the packages), and for a preview nobody has reviewed that code. So the bridge never builds in its own
// process: the one fixed command below runs inside bubblewrap, started through the resource-group launcher an agent
// run uses. There is no fallback; with bubblewrap or the resource group missing the build is refused and the refusal
// names the blocker.
//   createBuildBox({ launcher }) -> { build({ folder, packages, signal? }) }
//   build(...) -> { ok, files, bytes, tail, reason? }     reason is set whenever ok is false
// `folder` is a tree shaped like this repository (it holds apps/ui/vite.config.mjs); `packages` is one node_modules
// folder. The caller passes those two and never a command. Inside the box:
//   /build          the folder, writable
//   /node_modules   the packages, read-only (Node finds them by walking up from /build)
//   /den/node       the Node binary, read-only
//   /usr/lib ...    the system libraries, read-only
//   /tmp            a private tmpfs
// and nothing else: no network, its own process and user namespaces, a cleared environment, a read-only root. The
// box ends with the bridge (bubblewrap is the bridge's direct child and dies with it; the rest is its namespace).
// A build has no time limit; the caller stops it with `signal`. What comes out (apps/ui/dist) is counted afterwards:
// anything that is not a plain file or folder, a hard link, or a tree over the bounds is a refusal.
// The launcher is the bridge's own instance, never a second one: its probe units are named per instance.
import { lstatSync, realpathSync } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { EnforcementError } from "../cells/resource-group.mjs";

export const UI_CONFIG = "apps/ui/vite.config.mjs";
export const UI_OUT = "apps/ui/dist";
export const VITE_BIN = "vite/bin/vite.js";
export const MAX_FILES = 2000;
export const MAX_BYTES = 100 * 1024 * 1024;
const MAX_DEPTH = 16;
const TAIL_CHARS = 4000;
const KILL_SETTLE_MS = 2000;
// A build runs under the worker class: limits.json has no class of its own for it (a new one is a guardrail change).
const SLOT_CLASS = "worker";
const BWRAP_PATHS = ["/usr/bin/bwrap", "/bin/bwrap"];
const LIB_DIRS = ["/usr/lib", "/usr/lib64", "/lib", "/lib64"];

const kind = (file) => {
  try {
    return lstatSync(file);
  } catch {
    return null;
  }
};

/** The bubblewrap binary at one of its fixed places (never looked up on PATH), or null. */
export const findBwrap = (candidates = BWRAP_PATHS) => candidates.find((file) => kind(file)?.isFile()) ?? null;

/** The system library folders as bubblewrap arguments: a real folder is bound read-only, a link (merged /usr) is remade. */
export function libraryArgs(dirs = LIB_DIRS, { stat = kind, readlink = (file) => path.relative(path.dirname(file), realpathSync(file)) } = {}) {
  return dirs.flatMap((dir) => {
    const st = stat(dir);
    if (st?.isSymbolicLink()) return ["--symlink", readlink(dir), dir];
    return st?.isDirectory() ? ["--ro-bind", dir, dir] : [];
  });
}

/** The bubblewrap argv (no binary name) of the one command the box runs. Every path is absolute and already resolved. */
export function buildBoxArgv({ folder, packages, node, libs = libraryArgs() }) {
  for (const [name, value] of Object.entries({ folder, packages, node })) {
    if (typeof value !== "string" || !path.isAbsolute(value) || value.includes("\0")) throw new TypeError(`buildBoxArgv: ${name} must be an absolute path`);
  }
  return [
    "--unshare-all", "--die-with-parent", "--new-session", "--cap-drop", "ALL",
    "--clearenv", "--setenv", "HOME", "/tmp", "--setenv", "TMPDIR", "/tmp",
    ...libs,
    "--ro-bind", node, "/den/node",
    "--ro-bind", packages, "/node_modules",
    "--bind", folder, "/build",
    "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp",
    "--remount-ro", "/",
    "--chdir", "/build",
    "--", "/den/node", `/node_modules/${VITE_BIN}`, "build", "--config", `/build/${UI_CONFIG}`, "--configLoader", "native",
  ];
}

class Refusal extends Error {}

/**
 * Counts the build output under `dir`. Throws a Refusal for a link (symbolic or hard), anything else that is not a
 * plain file or folder, or a tree over the bounds. -> { files, bytes }
 */
export async function measureOutput(dir, { maxFiles = MAX_FILES, maxBytes = MAX_BYTES } = {}) {
  let files = 0;
  let bytes = 0;
  const walk = async (at, depth) => {
    if (depth > MAX_DEPTH) throw new Refusal(`the build output is nested deeper than ${MAX_DEPTH} folders`);
    for (const name of await readdir(at)) {
      const file = path.join(at, name);
      const st = await lstat(file);
      const shown = path.relative(dir, file);
      if (st.isDirectory()) {
        await walk(file, depth + 1);
        continue;
      }
      if (st.isSymbolicLink()) throw new Refusal(`the build output contains a link: ${shown}`);
      if (!st.isFile()) throw new Refusal(`the build output contains something that is not a file: ${shown}`);
      if (st.nlink !== 1) throw new Refusal(`the build output contains a hard link: ${shown}`);
      files += 1;
      bytes += st.size;
      if (files > maxFiles) throw new Refusal(`the build output has more than ${maxFiles} files`);
      if (bytes > maxBytes) throw new Refusal(`the build output is larger than ${maxBytes} bytes`);
    }
  };
  await walk(dir, 0);
  return { files, bytes };
}

const resolved = (dir) => {
  try {
    const real = realpathSync(dir);
    return kind(real)?.isDirectory() ? real : null;
  } catch {
    return null;
  }
};

let builds = 0; // one count for the process: the unit name of a build must not repeat, whichever box started it

export function createBuildBox({ launcher, bwrap = findBwrap(), node = process.execPath, maxFiles = MAX_FILES, maxBytes = MAX_BYTES } = {}) {

  async function build({ folder, packages, signal } = {}) {
    for (const [name, value] of Object.entries({ folder, packages })) {
      if (typeof value !== "string" || !path.isAbsolute(value)) throw new TypeError(`build box: ${name} must be an absolute path`);
    }
    let tail = "";
    const refused = (reason) => ({ ok: false, files: 0, bytes: 0, tail, reason });
    if (launcher?.enforced !== true || typeof launcher.launch !== "function") return refused("the build box has no resource group to run in");
    if (bwrap === null || !kind(bwrap)?.isFile()) return refused("bubblewrap (bwrap) is not installed; the build box cannot be made without it");
    const root = resolved(folder);
    const deps = resolved(packages);
    if (root === null || root === "/") return refused("the build folder is not a folder");
    if (deps === null) return refused("the packages folder is not a folder");
    const inFolder = (rel) => {
      try {
        return realpathSync(path.join(root, rel)) === path.join(root, rel);
      } catch {
        return false;
      }
    };
    if (!inFolder(UI_CONFIG) || !kind(path.join(root, UI_CONFIG)).isFile()) return refused(`the build folder has no ${UI_CONFIG}`);
    if (!kind(path.join(deps, VITE_BIN))?.isFile()) return refused(`the packages folder has no ${VITE_BIN}`);
    if (signal?.aborted) return refused("the build was stopped");

    let run;
    try {
      run = await launcher.launch({ slotClass: SLOT_CLASS, id: `build-${process.pid}-${(builds += 1)}`, bin: bwrap, args: buildBoxArgv({ folder: root, packages: deps, node: realpathSync(node) }), cwd: "/", env: {} });
    } catch (err) {
      if (err instanceof EnforcementError) return refused(`the resource group refused the build: ${err.reason}`);
      throw err;
    }
    const { child, group } = run;
    if (!group) {
      child.kill("SIGKILL");
      return refused("the build box has no resource group to run in");
    }
    let stopped = false;
    const stop = () => {
      stopped = true;
      group.kill();
    };
    signal?.addEventListener("abort", stop, { once: true });
    if (signal?.aborted) stop();
    child.stdin.on("error", () => {});
    child.stdin.end();
    const keep = (chunk) => (tail = (tail + String(chunk)).slice(-TAIL_CHARS));
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    const ended = [child.stdout, child.stderr].map((stream) => new Promise((resolve) => stream.once("close", resolve)));
    // "exit", not "close": the launcher's anchor holds the gate pipe open until the group is killed.
    const code = await new Promise((resolve) => child.once("exit", (exit) => resolve(exit)));
    signal?.removeEventListener("abort", stop);
    // Nothing of the build may still be running while its output is counted.
    group.kill();
    const settled = await group.settled(KILL_SETTLE_MS);
    if (settled) await Promise.all(ended);
    if (stopped) return refused("the build was stopped");
    if (!settled) return refused(`the build's processes outlived a kill of ${group.unit}`);
    // bubblewrap reports its own failures (it could not make a namespace or a mount) before the command starts.
    const own = /^bwrap: .*$/m.exec(tail)?.[0];
    if (code !== 0 && own) return refused(`bubblewrap could not make the box: ${own.slice(0, 300)}`);
    if (code !== 0) return refused(`the build failed (exit ${code ?? "by signal"})`);
    if (!inFolder(UI_OUT) || !kind(path.join(root, UI_OUT)).isDirectory()) return refused(`the build left no ${UI_OUT} folder of its own`);
    try {
      return { ok: true, ...(await measureOutput(path.join(root, UI_OUT), { maxFiles, maxBytes })), tail };
    } catch (err) {
      if (err instanceof Refusal) return refused(err.message);
      throw err;
    }
  }

  return { build };
}
