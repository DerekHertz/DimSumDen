// den-mvp outcome 1 (spec section 2, "Hardware" in Testing Decisions): the resource group around every agent.
//   pure      the limits file, the systemd-run argv, the control-group values they must produce
//   refusal   a host whose user service manager cannot be reached starts nothing, and says why
//   live      real processes under reduced limits, through the same launcher production uses. These need a reachable
//             user service manager; where there is none they are skipped, and the skip reason is the launcher's own.
// The probes are small and bounded: a few hundred MiB at most, a few dozen processes, a few seconds.
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { EnforcementError, LIMITS, buildScopeArgv, cgroupOf, checkLimits, createResourceLauncher, findUserBus, groupFiles, groupProperties, measureTree, watchStorage } from "./resource-group.mjs";
import { createClaudeRuntime } from "./claude-runtime.mjs";
import { SLOTS } from "./policy.mjs";

const MIB = 1024 * 1024;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (fn, { ms = 8000, what = "the condition" } = {}) => {
  const end = Date.now() + ms;
  for (;;) {
    if (await fn()) return;
    if (Date.now() > end) throw new Error(`timed out after ${ms} ms waiting for ${what}`);
    await sleep(25);
  }
};

describe("limits.json: the spec's defaults", () => {
  test("two workers at 2 GiB / one CPU / 256 processes; Bao and a scout at 1 GiB / half a CPU / 128", () => {
    assert.deepEqual(LIMITS.classes.worker, { memoryMiB: 2048, cpuPercent: 100, tasks: 256 });
    assert.deepEqual(LIMITS.classes.bao, { memoryMiB: 1024, cpuPercent: 50, tasks: 128 });
    assert.deepEqual(LIMITS.classes.scout, { memoryMiB: 1024, cpuPercent: 50, tasks: 128 });
    assert.deepEqual(LIMITS.aggregate, { memoryMiB: 6144, cpuPercent: 300, tasks: 768 });
    assert.deepEqual(LIMITS.storage, { jobMiB: 4096, outputMiB: 20 });
  });

  test("every slot at its class limit fits inside the aggregate", () => {
    for (const key of ["memoryMiB", "cpuPercent", "tasks"]) {
      const sum = Object.entries(SLOTS).reduce((n, [cls, slots]) => n + slots * LIMITS.classes[cls][key], 0);
      assert.ok(sum <= LIMITS.aggregate[key], `${key}: ${sum} > ${LIMITS.aggregate[key]}`);
    }
  });

  test("bad data is refused at load: a missing class, an extra key, a limit of zero, a string", () => {
    const good = JSON.parse(JSON.stringify(LIMITS));
    assert.doesNotThrow(() => checkLimits(good));
    const bad = (edit) => {
      const copy = JSON.parse(JSON.stringify(LIMITS));
      edit(copy);
      assert.throws(() => checkLimits(copy), /bad limits data/);
    };
    bad((l) => delete l.classes.scout);
    bad((l) => (l.classes.extra = l.classes.worker));
    bad((l) => (l.unlimited = true));
    bad((l) => (l.classes.worker.memoryMiB = 0));
    bad((l) => (l.aggregate.tasks = "768"));
    bad((l) => (l.classes.worker.swap = true));
    bad((l) => delete l.storage.jobMiB);
  });
});

describe("the scope argv and the values it must produce", () => {
  const limit = { memoryMiB: 2048, cpuPercent: 100, tasks: 256 };
  const argv = buildScopeArgv({ unit: "den-run-abc.scope", slice: "den-agents", limit, fileBytes: 4096 * MIB, bin: "claude", args: ["-p", "--agent", "scout"] });

  test("a user scope in the agents slice with memory, no swap, CPU and process limits", () => {
    assert.deepEqual(argv.slice(0, 8), ["--user", "--scope", "--quiet", "--collect", "--unit", "den-run-abc.scope", "--slice", "den-agents.slice"]);
    const props = argv.filter((_, i) => argv[i - 1] === "-p" && i < argv.indexOf("--"));
    assert.deepEqual(props, ["MemoryMax=2147483648", "MemorySwapMax=0", "CPUQuota=100%", "TasksMax=256", "OOMPolicy=continue"]);
    assert.deepEqual(groupProperties(limit), props.slice(0, 4));
  });

  test("the launcher's bus variables are removed before the CLI, and the CLI's own flags are never read as the launcher's", () => {
    const rest = argv.slice(argv.indexOf("--") + 1);
    assert.deepEqual(rest, ["env", "-u", "XDG_RUNTIME_DIR", "-u", "DBUS_SESSION_BUS_ADDRESS", "prlimit", "--fsize=4294967296:4294967296", "--", "claude", "-p", "--agent", "scout"]);
  });

  test("the control-group files that prove the limits", () => {
    assert.deepEqual(groupFiles(limit), { "memory.max": "2147483648", "memory.swap.max": "0", "pids.max": "256", "cpu.max": "100000 100000" });
    assert.equal(groupFiles({ memoryMiB: 1024, cpuPercent: 50, tasks: 128 })["cpu.max"], "50000 100000");
    assert.equal(groupFiles(LIMITS.aggregate)["cpu.max"], "300000 100000");
  });

  test("a unit, slice or command that is not plain is a TypeError, never a looser argv", () => {
    const ok = { unit: "den-run-abc.scope", slice: "den-agents", limit, fileBytes: MIB, bin: "claude", args: [] };
    for (const edit of [{ unit: "x.service" }, { unit: "-p.scope" }, { unit: "a b.scope" }, { slice: "den agents" }, { slice: "../x" }, { limit: { ...limit, tasks: 0 } }, { fileBytes: 0 }, { bin: "" }, { args: [1] }]) {
      assert.throws(() => buildScopeArgv({ ...ok, ...edit }), TypeError, JSON.stringify(edit));
    }
  });
});

describe("a host that cannot enforce the limits starts nothing", () => {
  const dirs = [];
  after(async () => {
    for (const dir of dirs) await rm(dir, { recursive: true, force: true });
  });
  const emptyHost = async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-nobus-"));
    dirs.push(dir);
    return { PATH: process.env.PATH, HOME: dir, XDG_RUNTIME_DIR: dir };
  };

  test("no reachable bus: findUserBus gives a reason that names the place it looked", async () => {
    const env = await emptyHost();
    const found = findUserBus(env);
    assert.equal(found.env, undefined);
    assert.match(found.reason, /user service manager's bus is not reachable/);
    assert.ok(found.reason.includes(`${env.XDG_RUNTIME_DIR}/bus`));
  });

  test("preflight fails with that reason, launch rejects with an EnforcementError, and no process is spawned", async () => {
    let spawns = 0;
    const launcher = createResourceLauncher({ env: await emptyHost(), spawn: () => (spawns += 1, assert.fail("nothing may be spawned")) });
    const check = await launcher.preflight();
    assert.equal(check.ok, false);
    assert.match(check.reason, /bus is not reachable/);
    await assert.rejects(launcher.launch({ slotClass: "worker", id: "abc", bin: "sleep", args: ["1"], cwd: "/", env: {} }), (err) => err instanceof EnforcementError && /bus is not reachable/.test(err.reason));
    assert.equal(spawns, 0);
  });

  test("the default runtime is the enforced one: its spawn rejects and the binary it names is never run", async () => {
    const env = await emptyHost();
    const marker = path.join(env.HOME, "ran");
    const runtime = createClaudeRuntime({ env: { ...env, DEN_CLAUDE_BIN: "touch" } });
    assert.equal(runtime.enforced, true);
    assert.equal((await runtime.preflight()).ok, false);
    await assert.rejects(runtime.spawn({ role: "scout", cwd: env.HOME, prompt: marker, sessionId: "0f8fad5b-d9cb-469f-a165-70867728950e" }), { name: "EnforcementError" });
    await sleep(100);
    assert.equal(existsSync(marker), false);
  });

  test("an unknown slot class or an id that is not a plain name is a TypeError before anything else", async () => {
    const launcher = createResourceLauncher({ env: process.env, spawn: () => assert.fail("nothing may be spawned") });
    const ready = await launcher.preflight();
    if (!ready.ok) return; // on a host that cannot enforce, launch refuses first; the refusal is tested above
    await assert.rejects(launcher.launch({ slotClass: "huge", id: "abc", bin: "true", args: [], cwd: "/", env: {} }), TypeError);
    await assert.rejects(launcher.launch({ slotClass: "worker", id: "A B", bin: "true", args: [], cwd: "/", env: {} }), TypeError);
  });
});

describe("job storage: the monitor around a run's work area", () => {
  test("measureTree reads real disk use, and a directory that is not there is null", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-du-"));
    try {
      const before = await measureTree(dir);
      await writeFile(path.join(dir, "blob"), Buffer.alloc(3 * MIB, 1));
      const after = await measureTree(dir);
      assert.ok(after - before >= 3 * MIB && after - before < 4 * MIB, `${before} -> ${after}`);
      assert.equal(await measureTree(path.join(dir, "missing")), null);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a work area that passes the bound calls onOver once, with what was measured; under the bound it stays quiet", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-watch-"));
    const calls = [];
    const stop = watchStorage({ dir, limitBytes: 1 * MIB, intervalMs: 30, onOver: (bytes) => calls.push(bytes) });
    try {
      await sleep(150);
      assert.deepEqual(calls, [], "an empty directory is under the bound");
      await writeFile(path.join(dir, "blob"), Buffer.alloc(2 * MIB, 1));
      await until(() => calls.length > 0, { ms: 5000, what: "the monitor to notice" });
      await sleep(150);
      assert.equal(calls.length, 1, "once, not on every look");
      assert.ok(calls[0] > 1 * MIB);
    } finally {
      stop();
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("an unreadable measurement is skipped, and stop() ends the watch", async () => {
    const calls = [];
    let looks = 0;
    const stop = watchStorage({ dir: "/nowhere", limitBytes: 1, intervalMs: 10, onOver: (b) => calls.push(b), measure: async () => ((looks += 1), looks < 3 ? null : 5) });
    await until(() => calls.length === 1, { ms: 2000, what: "the third look" });
    stop();
    const seen = looks;
    await sleep(60);
    assert.equal(looks, seen, "no look after stop()");
  });
});

// ---- live: real processes under reduced limits ------------------------------------------------
const production = await createResourceLauncher({ env: process.env }).preflight();
const skip = production.ok ? false : `this host cannot enforce the limits: ${production.reason}`;
const TEST_LIMITS = { classes: { worker: { memoryMiB: 96, cpuPercent: 20, tasks: 24 }, bao: { memoryMiB: 64, cpuPercent: 10, tasks: 16 }, scout: { memoryMiB: 64, cpuPercent: 10, tasks: 16 } }, aggregate: { memoryMiB: 256, cpuPercent: 40, tasks: 64 }, storage: { jobMiB: 1, outputMiB: 1 } };
const SLICE = `den-test-p${process.pid}`;
let seq = 0;

describe("live: the launcher under reduced limits", { skip }, () => {
  const launcher = createResourceLauncher({ env: process.env, limits: TEST_LIMITS, slice: SLICE });
  const open = [];
  after(() => {
    for (const { group } of open) group.kill();
  });
  const start = async (script, slotClass = "worker", cwd = "/") => {
    const run = await launcher.launch({ slotClass, id: `t${process.pid}-${(seq += 1)}`, bin: "sh", args: ["-c", script], cwd, env: { PATH: process.env.PATH } });
    open.push(run);
    run.out = "";
    run.child.stdout.on("data", (c) => (run.out += c));
    run.child.stderr.resume();
    run.child.stdin.on("error", () => {});
    run.exit = new Promise((resolve) => run.child.once("exit", (code, signal) => resolve({ code, signal })));
    return run;
  };
  const value = (group, file) => readFileSync(path.join(group.dir, file), "utf8").trim();

  test("a child and its grandchild are in the run's own scope, with the class limits and the slice's aggregate read back from the kernel", async () => {
    const run = await start("sh -c 'echo $$; sleep 20' & echo $$; wait");
    await until(() => run.out.trim().split("\n").length >= 2, { what: "both pids" });
    const pids = run.out.trim().split("\n").map(Number);
    for (const pid of pids) assert.ok((cgroupOf(pid) ?? "").endsWith(`/${SLICE}.slice/${run.group.unit}`), `pid ${pid} is in ${cgroupOf(pid)}`);
    for (const [file, want] of Object.entries(groupFiles(TEST_LIMITS.classes.worker))) assert.equal(value(run.group, file), want, file);
    for (const [file, want] of Object.entries(groupFiles(TEST_LIMITS.aggregate))) assert.equal(readFileSync(path.join(path.dirname(run.group.dir), file), "utf8").trim(), want, `slice ${file}`);
    assert.notEqual(cgroupOf(process.pid), cgroupOf(pids[0]), "the bridge's own process is outside the agents' group");
    run.group.kill();
    assert.equal(await run.group.settled(3000), true);
  });

  test("Bao's and a scout's class get their own, smaller limits", async () => {
    for (const cls of ["bao", "scout"]) {
      const run = await start("sleep 20", cls);
      for (const [file, want] of Object.entries(groupFiles(TEST_LIMITS.classes[cls]))) assert.equal(value(run.group, file), want, `${cls} ${file}`);
      run.group.kill();
      assert.equal(await run.group.settled(3000), true);
    }
  });

  test("memory: a grandchild that goes over the limit is killed by the kernel, and the group reports it", async () => {
    const hog = `${JSON.stringify(process.execPath)} -e "const a=[];for(let i=0;i<40;i++)a.push(Buffer.alloc(8<<20,1));setTimeout(()=>{},20000)"`;
    const run = await start(`${hog}; echo "hog exited $?"; sleep 20`);
    await until(() => run.group.exhausted() !== null, { ms: 15000, what: "an oom kill in the scope" });
    assert.equal(run.group.exhausted(), "memory");
    assert.ok(Number(value(run.group, "memory.peak")) <= TEST_LIMITS.classes.worker.memoryMiB * MIB, "usage never passed the limit");
    run.group.kill();
    assert.equal(await run.group.settled(3000), true);
  });

  test("processes: a fork loop stops at the limit, and the group reports it", async () => {
    const run = await start("i=0; while [ $i -lt 80 ]; do sleep 20 & i=$((i+1)); done; wait");
    await until(() => run.group.exhausted() !== null, { ms: 15000, what: "a refused fork in the scope" });
    assert.equal(run.group.exhausted(), "processes");
    assert.ok(Number(value(run.group, "pids.peak")) <= TEST_LIMITS.classes.worker.tasks);
    run.group.kill();
    assert.equal(await run.group.settled(3000), true);
  });

  test("CPU: a busy loop is throttled, not killed", async () => {
    const run = await start("while :; do :; done");
    await until(() => /^nr_throttled [1-9]/m.test(value(run.group, "cpu.stat")), { ms: 10000, what: "the scope to be throttled" });
    assert.equal(run.group.exhausted(), null, "a full CPU quota is not a failure");
    assert.equal(run.child.exitCode, null, "the process is still running");
    run.group.kill();
    assert.equal(await run.group.settled(3000), true);
  });

  test("storage: no single file may pass the job-storage bound", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-fsize-"));
    try {
      const run = await start("head -c 3145728 /dev/zero > big; echo done", "worker", dir);
      await run.exit;
      assert.ok((await stat(path.join(dir, "big"))).size <= TEST_LIMITS.storage.jobMiB * MIB, "the file stopped at the bound");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("stop: a kill of the group leaves no descendant, not even one that started its own session", async () => {
    const run = await start("setsid sh -c 'echo $$; exec sleep 60' & sh -c 'echo $$; sleep 60' & echo $$; wait");
    await until(() => run.out.trim().split("\n").length >= 3, { what: "three pids" });
    const pids = run.out.trim().split("\n").map(Number);
    for (const pid of pids) assert.ok(existsSync(`/proc/${pid}`), `pid ${pid} is running`);
    run.group.kill();
    assert.equal(await run.group.settled(3000), true);
    await run.exit;
    await until(() => pids.every((pid) => !existsSync(`/proc/${pid}`)), { ms: 3000, what: "every descendant to be gone" });
  });

  test("aggregate: the slice bounds all runs together, below the sum of what each could take alone", async () => {
    const runs = [await start("sleep 20"), await start("sleep 20"), await start("sleep 20", "bao"), await start("sleep 20", "scout")];
    const slice = path.dirname(runs[0].group.dir);
    for (const run of runs) assert.equal(path.dirname(run.group.dir), slice, "every run is under the one slice");
    assert.equal(readFileSync(path.join(slice, "memory.max"), "utf8").trim(), String(TEST_LIMITS.aggregate.memoryMiB * MIB));
    assert.equal(readFileSync(path.join(slice, "pids.max"), "utf8").trim(), String(TEST_LIMITS.aggregate.tasks));
    for (const run of runs) run.group.kill();
    for (const run of runs) assert.equal(await run.group.settled(3000), true);
  });
});
