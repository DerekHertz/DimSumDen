// den-mvp outcome 1 (spec section 2): the resource group every agent and its descendants run in.
// The launcher starts the CLI inside a transient systemd user scope (the approach agent-os/01 proved), under one slice
// that bounds all agents together. The bridge itself stays outside. Nothing here trusts that a flag was accepted: the
// control group the child really landed in is read back, and a mismatch kills the child and refuses the run. There is
// no unconfined fallback; a host that cannot enforce the limits starts no agent, and the refusal says what is missing.
//   createResourceLauncher({ env, limits?, slice? }) -> { enforced: true, preflight(), launch(...) }
//   preflight() -> { ok: true } | { ok: false, reason }      a real probe through launch(), cached for a short time
//   launch({ slotClass, id, bin, args, cwd, env }) -> { child, group }   rejects with EnforcementError when refused
// The command itself waits behind a gate (START_GATE) until the limits have been read back, so a refused run never ran.
//   group = { unit, dir, kill(), exhausted() -> "memory" | "processes" | null, settled(ms) -> Promise<boolean> }
//           the group outlives the command's own exit until kill(), so exhausted() can still be read then
//   watchStorage({ dir, limitBytes, onOver }) -> stop()      the job-storage monitor (not a quota; see below)
import { spawn as spawnChild, execFile } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SLOT_CLASSES } from "./policy.mjs";

export class EnforcementError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "EnforcementError";
    this.reason = reason;
  }
}

// ---- limits (limits.json, a guardrail path: the operator edits it, an agent cannot) ----------
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const intIn = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isGroupLimit = (g) => isPlainObject(g) && Object.keys(g).length === 3 && intIn(g.memoryMiB, 16, 1024 * 1024) && intIn(g.cpuPercent, 5, 6400) && intIn(g.tasks, 8, 65536);
/** Checks a limits object: one group limit per slot class, the aggregate, and the storage bounds. Throws on anything else. */
export function checkLimits(limits) {
  const ok = isPlainObject(limits) && Object.keys(limits).length === 3 && isPlainObject(limits.classes) &&
    Object.keys(limits.classes).length === SLOT_CLASSES.length && SLOT_CLASSES.every((c) => isGroupLimit(limits.classes[c])) &&
    isGroupLimit(limits.aggregate) && isPlainObject(limits.storage) && Object.keys(limits.storage).length === 2 &&
    intIn(limits.storage.jobMiB, 1, 1024 * 1024) && intIn(limits.storage.outputMiB, 1, 1024);
  if (!ok) throw new Error("limits.json: bad limits data");
  return limits;
}
export const LIMITS = Object.freeze(checkLimits(JSON.parse(readFileSync(new URL("./limits.json", import.meta.url), "utf8"))));

const MIB = 1024 * 1024;
const CPU_PERIOD = 100_000; // systemd's default cpu.max period, in microseconds
/** The systemd properties of one group limit; no swap, and a memory kill takes one process, not the scope (the bridge ends the run). */
export const groupProperties = (g) => [`MemoryMax=${g.memoryMiB * MIB}`, "MemorySwapMax=0", `CPUQuota=${g.cpuPercent}%`, `TasksMax=${g.tasks}`];
/** What the kernel's control-group files must read once those properties are applied. */
export const groupFiles = (g) => ({ "memory.max": String(g.memoryMiB * MIB), "memory.swap.max": "0", "pids.max": String(g.tasks), "cpu.max": `${g.cpuPercent * (CPU_PERIOD / 100)} ${CPU_PERIOD}` });

const UNIT_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SLICE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The command waits here, already inside its scope, until the launcher writes "go" on descriptor 3. A closed pipe or
// any other word ends it with GATE_REFUSED, so nothing of the command runs before its limits are read back.
// Before the command starts, a small anchor process is left reading the same pipe. It keeps the scope alive after the
// command's last process is gone (systemd removes an empty scope at once, and with it the record of a memory kill),
// and it ends when the launcher closes the pipe or kills the group.
export const GATE_REFUSED = 126;
export const START_GATE = `IFS= read -r go <&3 && [ "$go" = go ] || exit ${GATE_REFUSED}; ( (exec <&3 3<&- >/dev/null 2>&1; while read -r _; do :; done) & ); exec 3<&-; exec "$@"`;

/**
 * The systemd-run argv (no binary name) that starts `bin args` in its own scope. The bus variables the launcher needs
 * are removed again before the CLI starts, no file the run writes may pass the job-storage bound, and the command
 * starts only once the gate is released.
 */
export function buildScopeArgv({ unit, slice, limit, fileBytes, bin, args }) {
  if (typeof unit !== "string" || !/^[a-z0-9][a-z0-9-]{0,80}\.scope$/.test(unit)) throw new TypeError("buildScopeArgv: bad unit name");
  if (typeof slice !== "string" || !SLICE_RE.test(slice)) throw new TypeError("buildScopeArgv: bad slice name");
  if (!isGroupLimit(limit) || !intIn(fileBytes, MIB, Number.MAX_SAFE_INTEGER)) throw new TypeError("buildScopeArgv: bad limit");
  if (typeof bin !== "string" || bin === "" || !Array.isArray(args) || !args.every((a) => typeof a === "string")) throw new TypeError("buildScopeArgv: bad command");
  return [
    "--user", "--scope", "--quiet", "--collect", "--unit", unit, "--slice", `${slice}.slice`,
    ...[...groupProperties(limit), "OOMPolicy=continue"].flatMap((p) => ["-p", p]),
    "--", "env", "-u", "XDG_RUNTIME_DIR", "-u", "DBUS_SESSION_BUS_ADDRESS",
    "prlimit", `--fsize=${fileBytes}:${fileBytes}`, "--", "/bin/sh", "-c", START_GATE, "den-gate", bin, ...args,
  ];
}

// ---- the host's control groups and bus -----------------------------------------------------
const CGROUP_ROOT = "/sys/fs/cgroup";
const read = (file) => {
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return null;
  }
};
const isSocket = (file) => {
  try {
    return statSync(file).isSocket();
  } catch {
    return false;
  }
};
const counter = (text, key) => Number(new RegExp(`^${key} (\\d+)$`, "m").exec(text ?? "")?.[1] ?? 0);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const oneLine = (text) => String(text ?? "").replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").trim().slice(0, 300);
const ABS_RE = /^(?:\/[A-Za-z0-9._@+-]+)+$/;

/**
 * Where the user service manager can be reached: its runtime directory's bus, else a bus socket the operator set up
 * elsewhere (DEN_USER_BUS, or ~/.local/state/den/user-bus). -> { env } for systemd-run, or { reason }.
 */
export function findUserBus(env, { uid = process.getuid?.() } = {}) {
  const runtimeDir = typeof env?.XDG_RUNTIME_DIR === "string" && ABS_RE.test(env.XDG_RUNTIME_DIR.replace(/\/+$/, "")) ? env.XDG_RUNTIME_DIR.replace(/\/+$/, "") : `/run/user/${uid}`;
  const base = typeof env?.PATH === "string" ? { PATH: env.PATH } : {};
  if (isSocket(`${runtimeDir}/bus`)) return { env: { ...base, XDG_RUNTIME_DIR: runtimeDir, DBUS_SESSION_BUS_ADDRESS: `unix:path=${runtimeDir}/bus` } };
  const others = [env?.DEN_USER_BUS, typeof env?.HOME === "string" ? `${env.HOME}/.local/state/den/user-bus` : undefined].filter((p) => typeof p === "string" && ABS_RE.test(p));
  for (const bus of others) if (isSocket(bus)) return { env: { ...base, DBUS_SESSION_BUS_ADDRESS: `unix:path=${bus}` } };
  // The usual cause on WSL: a second mount on the runtime directory hides the manager's sockets.
  const mounts = (read("/proc/self/mountinfo") ?? "").split("\n").filter((line) => line.split(" ")[4] === runtimeDir).length;
  const why = mounts > 1 ? `; ${mounts} mounts are stacked on ${runtimeDir}, and the upper one hides it` : "";
  return { reason: `the user service manager's bus is not reachable at ${runtimeDir}/bus${why}` };
}

/** The control group a process is in ("/user.slice/..."), or null. */
export const cgroupOf = (pid) => /^0::(\/.*)$/m.exec(read(`/proc/${pid}/cgroup`) ?? "")?.[1] ?? null;

function makeGroup(unit, dir, gate) {
  return {
    unit,
    dir,
    /** SIGKILL to every process in the group, whatever session or process group it moved to; the anchor goes with them. */
    kill() {
      gate?.destroy();
      try {
        writeFileSync(path.join(dir, "cgroup.kill"), "1");
      } catch {
        // the group is already gone
      }
    },
    /** Which hard limit the group has hit since it started, if any; readable until kill(). A full CPU quota only throttles. */
    exhausted() {
      if (counter(read(path.join(dir, "memory.events")), "oom_kill") > 0) return "memory";
      if (counter(read(path.join(dir, "pids.events")), "max") > 0) return "processes";
      return null;
    },
    /** Resolves true once no process is left in the group (or the group is gone), false after `ms`. */
    async settled(ms) {
      const until = Date.now() + ms;
      for (;;) {
        const procs = read(path.join(dir, "cgroup.procs"));
        if (procs === null || procs === "") return true;
        if (Date.now() >= until) return false;
        await sleep(20);
      }
    },
  };
}

// ---- job storage ----------------------------------------------------------------------------
// The kernel bounds one file (RLIMIT_FSIZE, above). The whole of a run's work area is watched from outside: once it
// passes the bound the run is ended as a storage failure. This is a monitor, not a quota: between two looks a run can
// write past the bound, and files outside the watched directory (temporary files, git objects) are not counted. A
// quota-backed volume is the hard bound and is not built yet.
export const STORAGE_POLL_MS = 10_000;
/** The disk space under `dir` in bytes (blocks in use, so a sparse file counts what it holds), or null when it cannot be read. */
export const measureTree = (dir, { exec = execFile } = {}) =>
  new Promise((resolve) => exec("du", ["-sk", "--", dir], { timeout: 30_000 }, (err, out) => {
    const kib = Number(/^(\d+)\s/.exec(String(out ?? ""))?.[1] ?? NaN);
    resolve(Number.isFinite(kib) ? kib * 1024 : null); // du exits non-zero for a file that vanished mid-walk; the total still counts
  }));
/** Calls onOver(bytes) once when `dir` passes `limitBytes`. -> stop(). One measurement at a time; an unreadable one is skipped. */
export function watchStorage({ dir, limitBytes, onOver, intervalMs = STORAGE_POLL_MS, measure = measureTree }) {
  let busy = false;
  let done = false;
  const timer = setInterval(async () => {
    if (busy || done) return;
    busy = true;
    const bytes = await measure(dir).catch(() => null);
    busy = false;
    if (done || bytes === null || bytes <= limitBytes) return;
    done = true;
    clearInterval(timer);
    onOver(bytes);
  }, intervalMs);
  timer.unref?.();
  return () => {
    done = true;
    clearInterval(timer);
  };
}

const SCOPE_WAIT_MS = 5000; // how long systemd-run gets to put the child in its scope
const PREFLIGHT_TTL_MS = 60_000; // a passed probe is believed this long; a failed one is asked again every time
const KILL_SETTLE_MS = 2000;

export function createResourceLauncher({ env = process.env, limits = LIMITS, slice = "den-agents", spawn = spawnChild, exec = execFile } = {}) {
  checkLimits(limits);
  if (!SLICE_RE.test(slice)) throw new TypeError("createResourceLauncher: bad slice name");
  let passed = 0; // when the last probe passed
  let probing = null;
  let probes = 0;

  const run = (file, args, busEnv) =>
    new Promise((resolve) => exec(file, args, { env: busEnv, timeout: SCOPE_WAIT_MS }, (err, _out, stderr) => resolve(err ? oneLine(stderr) || oneLine(err.message) : null)));

  const checkRun = ({ slotClass, id }) => {
    if (!SLOT_CLASSES.includes(slotClass)) throw new TypeError("resource launcher: unknown slot class");
    if (typeof id !== "string" || !UNIT_ID_RE.test(id)) throw new TypeError("resource launcher: id must be a plain lower-case name");
  };

  // Starts the command in its scope and returns once the child is known to be inside it with every limit applied.
  // Until then the command waits at the gate; only a start that passed every check releases it.
  async function start({ slotClass, id, bin, args, cwd, env: childEnv, prefix }) {
    checkRun({ slotClass, id });
    if (process.platform !== "linux") throw new EnforcementError("hardware limits need Linux control groups; this host has none");
    if (read(path.join(CGROUP_ROOT, "cgroup.controllers")) === null) throw new EnforcementError("control groups v2 are not mounted at /sys/fs/cgroup");
    const bus = findUserBus(env);
    if (!bus.env) throw new EnforcementError(bus.reason);
    const limit = limits.classes[slotClass];
    const unit = `${prefix}-${id}.scope`;
    // The slice bounds every agent together. Set on each start: it is one cheap call, and a restarted manager forgets it.
    const sliceFailed = await run("systemctl", ["--user", "set-property", "--runtime", `${slice}.slice`, ...groupProperties(limits.aggregate)], bus.env);
    if (sliceFailed !== null) throw new EnforcementError(`could not set the limits of ${slice}.slice: ${sliceFailed}`);
    const argv = buildScopeArgv({ unit, slice, limit, fileBytes: limits.storage.jobMiB * MIB, bin, args });
    const child = spawn("systemd-run", argv, { shell: false, detached: true, cwd, env: { ...childEnv, ...bus.env }, stdio: ["pipe", "pipe", "pipe", "pipe"] });
    const gate = child.stdio?.[3];
    gate?.on("error", () => {});
    let stderr = "";
    const onStderr = (chunk) => {
      if (stderr.length < 4096) stderr += String(chunk);
    };
    child.stderr.on("data", onStderr);
    let gone = false;
    child.once("exit", () => (gone = true));
    try {
      await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("spawn", resolve);
      });
    } catch (err) {
      throw new EnforcementError(`systemd-run could not be started: ${oneLine(err?.message)}`);
    }
    child.on("error", () => {});
    const refuse = (reason, group) => {
      gate?.destroy();
      group?.kill();
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        // already gone
      }
      return new EnforcementError(reason);
    };
    const until = Date.now() + SCOPE_WAIT_MS;
    let cg = null;
    while (Date.now() < until && !gone) {
      cg = cgroupOf(child.pid);
      if (cg !== null && cg.endsWith(`/${slice}.slice/${unit}`)) break;
      cg = null;
      await sleep(15);
    }
    if (cg === null) throw refuse(gone ? `systemd-run did not start the scope: ${oneLine(stderr) || "it exited"}` : `the child was not in ${unit} after ${SCOPE_WAIT_MS} ms`);
    if (!gate) throw refuse("the launcher has no start gate to the child");
    const group = makeGroup(unit, path.join(CGROUP_ROOT, cg), gate);
    for (const [dir, want, what] of [[group.dir, groupFiles(limit), unit], [path.dirname(group.dir), groupFiles(limits.aggregate), `${slice}.slice`]]) {
      for (const [file, value] of Object.entries(want)) {
        const got = read(path.join(dir, file));
        if (got !== value) throw refuse(`${what} has ${file} = ${got ?? "(unreadable)"}, not ${value}; the limits are not applied`, group);
      }
    }
    child.stderr.off("data", onStderr);
    gate.resume(); // nothing is read from the child's side; the pipe stays open for the anchor until group.kill()
    gate.write("go\n");
    return { child, group };
  }

  // One real start and kill of a tiny process, through the same code an agent takes.
  async function probe() {
    try {
      const { child, group } = await start({ slotClass: "worker", id: `${process.pid}-${(probes += 1)}`, bin: "sleep", args: ["30"], cwd: "/", env: {}, prefix: "den-probe" });
      child.stdin.on("error", () => {});
      child.stdout.resume();
      child.stderr.resume();
      group.kill();
      if (!(await group.settled(KILL_SETTLE_MS))) return { ok: false, reason: `the probe's processes outlived a kill of ${group.unit}` };
      passed = Date.now();
      return { ok: true };
    } catch (err) {
      if (err instanceof EnforcementError) return { ok: false, reason: err.reason };
      throw err;
    }
  }

  function preflight() {
    if (Date.now() - passed < PREFLIGHT_TTL_MS) return Promise.resolve({ ok: true });
    return (probing ??= probe().finally(() => (probing = null)));
  }

  return {
    enforced: true,
    limits,
    preflight,
    async launch({ slotClass, id, bin, args, cwd, env: childEnv }) {
      checkRun({ slotClass, id });
      const ready = await preflight();
      if (!ready.ok) throw new EnforcementError(ready.reason);
      return start({ slotClass, id, bin, args, cwd, env: childEnv, prefix: "den-run" });
    },
  };
}
