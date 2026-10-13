// den-mvp outcome 5 (ADR 0026 decision 4): the install and update steps against a temporary repository and state folder, with
// the systemd calls, the build box and `npm ci` faked, and the unit text tested as text. The real run is the user's.
import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, readlinkSync, statSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDen, DenServiceError, renderUnit, UNIT_NAME } from "./den-service.mjs";
import { createReleases } from "../build/releases.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { encoding: "utf8" }).trim();
const TEMPLATE = readFileSync(new URL("./den.service", import.meta.url), "utf8");
const LOCK = '{"name":"x","lockfileVersion":3,"packages":{}}\n';

const fakeBox = (calls) => ({
  async build({ folder }) {
    calls.push(folder);
    await mkdir(path.join(folder, "apps/ui/dist"), { recursive: true });
    await writeFile(path.join(folder, "apps/ui/dist/index.html"), "ui");
    return { ok: true, files: 1, bytes: 2, tail: "" };
  },
});

describe("the unit text", () => {
  const values = { node: "/usr/bin/node", checkout: "/home/me/dimsumden", state: "/home/me/.local/state/den", searchPath: "/home/me/.local/bin:/usr/bin" };

  test("runs the bridge from bridge/current, in den.slice, on 4317, restarting on failure, in the checkout", () => {
    const text = renderUnit(TEMPLATE, values);
    assert.match(text, /^Slice=den\.slice$/m);
    assert.match(text, /^WorkingDirectory=\/home\/me\/dimsumden$/m);
    assert.match(text, /^ExecStart=\/usr\/bin\/node \/home\/me\/\.local\/state\/den\/bridge\/current\/apps\/bridge\/server\.mjs$/m);
    assert.match(text, /^Environment=PORT=4317$/m);
    assert.match(text, /^Environment="PATH=\/home\/me\/\.local\/bin:\/usr\/bin"$/m);
    assert.match(text, /^Restart=on-failure$/m);
    assert.match(text, /^WantedBy=default\.target$/m);
    assert.doesNotMatch(text.replace(/^#.*$/gm, ""), /@[A-Z]+@/);
  });

  test("a value a unit file could not hold safely is refused, not quoted", () => {
    for (const bad of ["/home/my user/node", "/home/me/%h/node", "/home/me/node\nExecStartPre=/bin/evil", "relative/node", '/home/"x"/node', "/home/$HOME/node"]) {
      assert.throws(() => renderUnit(TEMPLATE, { ...values, node: bad }), DenServiceError, bad);
      assert.throws(() => renderUnit(TEMPLATE, { ...values, checkout: bad }), DenServiceError, bad);
      assert.throws(() => renderUnit(TEMPLATE, { ...values, state: bad }), DenServiceError, bad);
    }
  });

  test("PATH keeps only plain absolute entries", () => {
    const text = renderUnit(TEMPLATE, { ...values, searchPath: '/usr/bin:relative:/mnt/c/Program Files/x:/bad"quote:/bad%h:/ok/bin' });
    assert.match(text, /^Environment="PATH=\/usr\/bin:\/mnt\/c\/Program Files\/x:\/ok\/bin"$/m);
    assert.throws(() => renderUnit(TEMPLATE, { ...values, searchPath: "relative:%h" }), /no usable entries/);
  });
});

describe("den:install and den:update", () => {
  let tmp, origin, checkout, state, unitDir, lines, calls, sysCalls, npmCalls, boxCalls, answered;
  const push = (n) => {
    execFileSync("sh", ["-c", `printf %s "$1" > "$2"`, "sh", `c${n}\n`, path.join(origin, "src.txt")]);
    git(origin, "add", "-A");
    git(origin, "commit", "-q", "-m", `c${n}`);
    return git(origin, "rev-parse", "HEAD");
  };
  const den = (over = {}) => createDen({
    env: { HOME: tmp, PATH: "/usr/bin:/bin" }, say: (line) => lines.push(line), node: "/usr/bin/node", repo: checkout, stateDir: state, unitDir,
    bus: { env: { DBUS_SESSION_BUS_ADDRESS: "unix:path=/x" } }, bwrap: "/usr/bin/bwrap",
    systemctl: async (args) => (sysCalls.push(args.join(" ")), { ok: true, out: "", err: "" }),
    answers: async () => answered,
    releases: createReleases({ stateDir: state, repo: checkout, main: "origin/main", box: fakeBox(boxCalls), npm: async (cwd) => { npmCalls.push(cwd); await mkdir(path.join(cwd, "node_modules")); } }),
    ...over,
  });

  before(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), "den-service-"));
    origin = path.join(tmp, "origin");
    await mkdir(origin);
    git(tmp, "init", "-q", "-b", "main", origin);
    await writeFile(path.join(origin, "package-lock.json"), LOCK);
    await writeFile(path.join(origin, "package.json"), '{"name":"x"}\n');
    push(1);
    git(tmp, "clone", "-q", origin, path.join(tmp, "checkout"));
    checkout = path.join(tmp, "checkout");
  });
  beforeEach(async () => {
    state = path.join(tmp, `state-${Math.random().toString(36).slice(2)}`);
    unitDir = path.join(tmp, `units-${Math.random().toString(36).slice(2)}`);
    lines = [];
    sysCalls = [];
    npmCalls = [];
    boxCalls = [];
    answered = true;
  });
  after(() => rm(tmp, { recursive: true, force: true }));

  const link = (pair, name) => readlinkSync(path.join(state, pair, name));

  test("install makes the packages, the first release, the four links, the unit, and starts the service", async () => {
    await den().install();
    const sha = git(origin, "rev-parse", "HEAD");
    assert.equal(npmCalls.length, 1);
    assert.equal(boxCalls.length, 1);
    assert.equal(link("ui", "current"), `../releases/${sha.slice(0, 12)}`);
    assert.equal(link("bridge", "current"), `../releases/${sha.slice(0, 12)}`);
    const unit = await readFile(path.join(unitDir, UNIT_NAME), "utf8");
    assert.match(unit, new RegExp(`ExecStart=/usr/bin/node ${state}/bridge/current/apps/bridge/server.mjs`));
    assert.match(unit, new RegExp(`WorkingDirectory=${checkout}`));
    assert.deepEqual(sysCalls, ["show-environment", "daemon-reload", "enable den.service", "restart den.service"]);
    assert.deepEqual(readdirSync(unitDir), [UNIT_NAME]);
  });

  test("it prints the plan first, then each step's result", async () => {
    await den().install();
    assert.equal(lines[0], "This will:");
    const planned = lines.slice(1, lines.indexOf("> fetch origin main")).map((l) => l.replace(/^\s+\d+\. /, ""));
    assert.equal(planned.length, 7);
    const started = lines.filter((l) => l.startsWith("> ")).map((l) => l.slice(2));
    assert.deepEqual(started, planned);
    assert.equal(lines.filter((l) => l.startsWith("  done")).length, 7);
    assert.match(lines.find((l) => l.startsWith("  done: ") && /answers on 4317/.test(l)), /4317/);
  });

  test("running install again is safe: nothing is rebuilt, the unit is rewritten, the service restarted", async () => {
    await den().install();
    sysCalls.length = 0;
    await den().install();
    assert.equal(npmCalls.length, 1);
    assert.equal(boxCalls.length, 1);
    assert.deepEqual(sysCalls, ["show-environment", "daemon-reload", "enable den.service", "restart den.service"]);
    assert.deepEqual(readdirSync(unitDir), [UNIT_NAME]);
  });

  describe("on a host that cannot run it, install refuses and leaves nothing behind", () => {
    const refuses = async (over, message) => {
      await assert.rejects(den(over).install(), (err) => err instanceof DenServiceError && message.test(err.message));
      assert.equal(existsSync(state), false);
      assert.equal(existsSync(unitDir), false);
      assert.deepEqual(sysCalls.filter((c) => c !== "show-environment"), []);
      assert.equal(lines.some((l) => l.startsWith("> ")), false);
    };
    test("no systemd user manager (no bus)", () => refuses({ bus: { reason: "the user service manager's bus is not reachable at /run/user/1000/bus" } }, /no reachable systemd user manager: .*not reachable/));
    test("systemctl will not answer", () => refuses({ systemctl: async (args) => (sysCalls.push(args.join(" ")), { ok: false, out: "", err: "System has not been booted with systemd" }) }, /no usable systemd user manager.*not been booted with systemd/));
    test("no systemctl at all", () => refuses({ systemctl: async () => ({ ok: false, out: "", err: "spawn systemctl ENOENT" }) }, /no usable systemd user manager/));
    test("no bubblewrap", () => refuses({ bwrap: null }, /bubblewrap/));
    test("not Linux", () => refuses({ platform: "darwin" }, /Linux or WSL/));
    test("a path a unit file cannot hold", () => refuses({ node: "/opt/my node/bin/node" }, /plainer path/));
    test("not a git checkout", () => refuses({ repo: tmp }, /not a git checkout/));
  });

  test("a failing step stops the run and names it; the unit is not written", async () => {
    const failing = createReleases({ stateDir: state, repo: checkout, main: "origin/main", box: { build: async () => ({ ok: false, reason: "the resource group refused the build" }) }, npm: async (cwd) => mkdir(path.join(cwd, "node_modules")) });
    await assert.rejects(den({ releases: failing }).install(), /resource group refused/);
    assert.ok(lines.some((l) => l.startsWith("  FAILED: ") && /resource group/.test(l)));
    assert.equal(existsSync(unitDir), false);
    assert.equal(existsSync(path.join(state, "ui", "current")), false);
  });

  test("install says so when the service does not answer", async () => {
    answered = false;
    await assert.rejects(den().install(), /did not answer on port 4317/);
  });

  test("update before install is refused", async () => {
    await assert.rejects(den().update(), /npm run den:install first/);
    assert.equal(existsSync(state), false);
  });

  test("update makes a release of the new main, switches both links and restarts; packages are not reinstalled when the lockfile is the same", async () => {
    await den().install();
    const first = git(origin, "rev-parse", "HEAD");
    const second = push(2);
    sysCalls.length = 0;
    await den().update();
    assert.equal(npmCalls.length, 1);
    assert.equal(boxCalls.length, 2);
    assert.deepEqual([link("ui", "current"), link("ui", "previous")], [`../releases/${second.slice(0, 12)}`, `../releases/${first.slice(0, 12)}`]);
    assert.deepEqual([link("bridge", "current"), link("bridge", "previous")], [`../releases/${second.slice(0, 12)}`, `../releases/${first.slice(0, 12)}`]);
    assert.deepEqual(sysCalls, ["show-environment", "restart den.service"]);
  });

  test("update with nothing new does not restart the service", async () => {
    await den().install();
    sysCalls.length = 0;
    lines.length = 0;
    await den().update();
    assert.deepEqual(sysCalls, ["show-environment"]);
    assert.ok(lines.some((l) => /skipped, nothing changed/.test(l)));
    assert.equal(boxCalls.length, 1);
  });

  test("nothing under apps/bridge except this folder imports the install or update scripts", () => {
    const bridge = path.dirname(path.dirname(new URL(import.meta.url).pathname));
    const walk = (dir) => readdirSync(dir).flatMap((name) => {
      const file = path.join(dir, name);
      if (file === path.join(bridge, "service")) return [];
      return statSync(file).isDirectory() ? walk(file) : file.endsWith(".mjs") && !file.endsWith(".test.mjs") ? [file] : [];
    });
    for (const file of walk(bridge)) assert.doesNotMatch(readFileSync(file, "utf8"), /den-service/, file);
  });
});
