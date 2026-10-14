// den-mvp outcome 5 (ADR 0026 decisions 1, 3 and 8): release folders, packages and the links, against a temporary
// repository and state folder. The build box and `npm ci` are faked; the real box has its own tests (box.test.mjs).
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ReleaseError, createReleases, lockHash, resolveUi } from "./releases.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { encoding: "utf8" }).trim();
const LOCK = '{"name":"x","lockfileVersion":3,"packages":{}}\n';
const PKG = '{"name":"x","private":true}\n';

// The fake box: writes a UI build whose content names the commit, and notes whether build.json existed while it ran.
const fakeBox = (seen = []) => ({
  async build({ folder, packages }) {
    seen.push({ folder, packages, buildJsonYet: existsSync(path.join(folder, "build.json")), hasSource: existsSync(path.join(folder, "apps/ui/vite.config.mjs")) });
    await mkdir(path.join(folder, "apps/ui/dist/assets"), { recursive: true });
    const head = readFileSync(path.join(folder, "src.txt"), "utf8").trim();
    await writeFile(path.join(folder, "apps/ui/dist/index.html"), `index ${head}`);
    await writeFile(path.join(folder, "apps/ui/dist/assets", `app-${head}.js`), `js ${head}`);
    return { ok: true, files: 2, bytes: 10, tail: "" };
  },
});

describe("releases", () => {
  let tmp, repo, state, commits, offMain, seen, releases;
  const commit = (n) => {
    execFileSyncWrite(path.join(repo, "src.txt"), `c${n}\n`);
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", `c${n}`);
    return git(repo, "rev-parse", "HEAD");
  };
  const execFileSyncWrite = (file, text) => execFileSync("sh", ["-c", `printf %s "$1" > "$2"`, "sh", text, file]);
  const deps = (text = LOCK) => mkdir(path.join(state, "deps", lockHash(text), "node_modules"), { recursive: true });

  before(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), "releases-"));
    repo = path.join(tmp, "repo");
    await mkdir(path.join(repo, "apps/ui"), { recursive: true });
    git(tmp, "init", "-q", "-b", "main", repo);
    await writeFile(path.join(repo, "package-lock.json"), LOCK);
    await writeFile(path.join(repo, "package.json"), PKG);
    await writeFile(path.join(repo, "apps/ui/vite.config.mjs"), "export default {};\n");
    commits = [commit(1), commit(2), commit(3)];
    git(repo, "checkout", "-q", "-b", "side");
    offMain = commit(4);
    git(repo, "checkout", "-q", "main");
  });
  beforeEach(async () => {
    state = await mkdtemp(path.join(tmp, "state-"));
    seen = [];
    releases = createReleases({ stateDir: state, repo, box: fakeBox(seen) });
  });
  after(() => rm(tmp, { recursive: true, force: true }));

  const make = async (n) => {
    await deps();
    return releases.makeRelease(commits[n]);
  };

  test("a release is a copy of the commit with its UI built, and build.json comes last", async () => {
    await deps();
    const out = await releases.makeRelease(commits[0]);
    const dir = path.join(state, "releases", commits[0].slice(0, 12));
    assert.equal(out.dir, dir);
    assert.equal(readFileSync(path.join(dir, "src.txt"), "utf8").trim(), "c1");
    assert.equal(existsSync(path.join(dir, ".git")), false);
    assert.equal(existsSync(path.join(dir, ".making")), false);
    assert.equal(readFileSync(path.join(dir, "apps/ui/dist/index.html"), "utf8"), "index c1");
    assert.deepEqual(seen.map((s) => [s.buildJsonYet, s.hasSource]), [[false, true]]);
    assert.equal(seen[0].packages, path.join(state, "deps", lockHash(LOCK), "node_modules"));
    const record = JSON.parse(readFileSync(path.join(dir, "build.json"), "utf8"));
    assert.equal(record.sha, commits[0]);
    assert.equal(record.lock, lockHash(LOCK));
    assert.ok(Date.parse(record.builtAt) > 0);
  });

  test("making the same release twice builds once", async () => {
    await make(0);
    await releases.makeRelease(commits[0]);
    assert.equal(seen.length, 1);
  });

  test("a commit whose lockfile has no packages folder gets no release, and the refusal says the den must be updated", async () => {
    await assert.rejects(releases.makeRelease(commits[0]), (err) => err instanceof ReleaseError && err.code === "needs-update" && /den must be updated/.test(err.message));
    assert.equal(seen.length, 0);
    assert.deepEqual(await readdir(path.join(state, "releases")).catch(() => []), []);
  });

  test("a sha that is not on main, not a commit, or not a full lower-case hex id is refused", async () => {
    await deps();
    await assert.rejects(releases.makeRelease(offMain), (err) => err.code === "not-on-main" && /not on main/.test(err.message));
    await assert.rejects(releases.makeRelease("0".repeat(40)), (err) => err.code === "not-on-main");
    for (const bad of [commits[0].slice(0, 12), commits[0].toUpperCase(), "main", "../../etc", `${commits[0].slice(0, 39)}/`, `${commits[0]}\n`, "", undefined, 7]) {
      await assert.rejects(async () => releases.makeRelease(bad), (err) => err.code === "bad-sha", String(bad));
    }
    assert.equal(seen.length, 0);
    assert.deepEqual(await readdir(path.join(state, "releases")).catch(() => []), []);
  });

  test("a failed build leaves no folder behind", async () => {
    await deps();
    const failing = createReleases({ stateDir: state, repo, box: { build: async () => ({ ok: false, reason: "bubblewrap (bwrap) is not installed" }) } });
    await assert.rejects(failing.makeRelease(commits[0]), (err) => err.code === "build" && /bwrap/.test(err.message));
    assert.deepEqual(await readdir(path.join(state, "releases")), []);
  });

  test("a folder without build.json is not a release: never served, removed at start", async () => {
    const half = path.join(state, "releases", "aaaaaaaaaaaa");
    await mkdir(path.join(half, "apps/ui/dist"), { recursive: true });
    await writeFile(path.join(half, "apps/ui/dist/index.html"), "half");
    await mkdir(path.join(state, "ui"), { recursive: true });
    execFileSync("ln", ["-s", "../releases/aaaaaaaaaaaa", path.join(state, "ui", "current")]);
    assert.equal(await resolveUi(state), null);
    await assert.rejects(releases.switchUi("a".repeat(40)), (err) => err.code === "missing");
    await releases.sweep();
    assert.equal(existsSync(half), false);
  });

  test("the start-up sweep leaves a release being made by another live process", async () => {
    const other = spawn("sleep", ["30"]);
    try {
      const making = path.join(state, "releases", "bbbbbbbbbbbb");
      const stale = path.join(state, "releases", "cccccccccccc");
      await mkdir(making, { recursive: true });
      await mkdir(stale, { recursive: true });
      await writeFile(path.join(making, ".making"), `${other.pid}\n`);
      await writeFile(path.join(stale, ".making"), "999999999\n");
      await mkdir(path.join(state, "deps", ".tmp-999999999-ab"), { recursive: true });
      await releases.sweep();
      assert.equal(existsSync(making), true);
      assert.equal(existsSync(stale), false);
      assert.equal(existsSync(path.join(state, "deps", ".tmp-999999999-ab")), false);
    } finally {
      other.kill();
    }
  });

  test("switching sets current and previous; two switches delete the oldest release", async () => {
    // A release no link points to is deleted when a switch happens, so each one is made just before it is switched to.
    const link = (pair, name) => readlinkSync(path.join(state, pair, name));
    const a = await make(0);
    await releases.switchUi(a.sha);
    assert.equal(link("ui", "current"), `../releases/${a.id}`);
    assert.equal(existsSync(path.join(state, "ui", "previous")), false);
    const b = await make(1);
    await releases.switchUi(b.sha);
    assert.deepEqual([link("ui", "current"), link("ui", "previous")], [`../releases/${b.id}`, `../releases/${a.id}`]);
    assert.equal(existsSync(a.dir), true);
    const c = await make(2);
    await releases.switchUi(c.sha);
    assert.deepEqual([link("ui", "current"), link("ui", "previous")], [`../releases/${c.id}`, `../releases/${b.id}`]);
    assert.deepEqual((await readdir(path.join(state, "releases"))).sort(), [b.id, c.id].sort());
    assert.deepEqual((await readdir(path.join(state, "ui"))).sort(), ["current", "live.json", "previous"]);
    await releases.switchUi(c.sha); // again: nothing changes
    assert.equal(link("ui", "previous"), `../releases/${b.id}`);
  });

  test("a release the bridge links is kept even when the UI links have moved on", async () => {
    const a = await make(0);
    await releases.switchBridge(a.sha);
    await releases.switchUi(a.sha);
    await releases.switchUi((await make(1)).sha);
    await releases.switchUi((await make(2)).sha);
    assert.equal(existsSync(a.dir), true);
  });

  test("switching to a release that does not exist is refused", async () => {
    await assert.rejects(releases.switchUi(commits[0]), (err) => err.code === "missing");
  });

  test("rolling back twice returns to the start; a different `to` is a conflict", async () => {
    const a = await make(0);
    await releases.switchUi(a.sha);
    const b = await make(1);
    await releases.switchUi(b.sha);
    const now = () => [readlinkSync(path.join(state, "ui/current")), readlinkSync(path.join(state, "ui/previous"))];
    await assert.rejects(releases.rollbackUi(b.id), (err) => err.code === "conflict");
    await assert.rejects(releases.rollbackUi("zz"), (err) => err.code === "bad-sha");
    await releases.rollbackUi(a.sha);
    assert.deepEqual(now(), [`../releases/${a.id}`, `../releases/${b.id}`]);
    await releases.rollbackUi(b.id);
    assert.deepEqual(now(), [`../releases/${b.id}`, `../releases/${a.id}`]);
    assert.equal(existsSync(a.dir) && existsSync(b.dir), true);
  });

  test("a link whose target is not exactly ../releases/<sha12> is not followed", async () => {
    const a = await make(0);
    await mkdir(path.join(state, "ui"), { recursive: true });
    for (const target of [a.dir, `../releases/${a.id}/`, `../releases/../releases/${a.id}`, "../releases/AAAAAAAAAAAA"]) {
      await rm(path.join(state, "ui", "current"), { force: true });
      execFileSync("ln", ["-s", target, path.join(state, "ui", "current")]);
      assert.equal(await resolveUi(state), null, target);
    }
    await rm(path.join(state, "ui", "current"), { force: true });
    await releases.switchUi(a.sha);
    assert.equal((await resolveUi(state)).current, path.join(a.dir, "apps/ui/dist"));
  });

  describe("packages", () => {
    test("makeDeps runs npm ci in a temporary folder and renames it into deps/<lock-hash>", async () => {
      const calls = [];
      const r = createReleases({ stateDir: state, repo, npm: async (cwd) => {
        calls.push({ cwd, files: (await readdir(cwd)).sort() });
        await mkdir(path.join(cwd, "node_modules/vite"), { recursive: true });
      } });
      const out = await r.makeDeps({ lockfile: LOCK, packageJson: PKG });
      assert.equal(out.dir, path.join(state, "deps", lockHash(LOCK)));
      assert.equal(existsSync(path.join(out.dir, "node_modules/vite")), true);
      assert.deepEqual(calls[0].files, ["package-lock.json", "package.json"]);
      assert.match(path.basename(calls[0].cwd), /^\.tmp-/);
      assert.deepEqual(await readdir(path.join(state, "deps")), [lockHash(LOCK)]);
      await r.makeDeps({ lockfile: LOCK, packageJson: PKG }); // already there: npm does not run again
      assert.equal(calls.length, 1);
    });

    test("a failed install leaves no temporary folder and no packages folder", async () => {
      const r = createReleases({ stateDir: state, repo, npm: async () => { throw new ReleaseError("build", "npm ci failed: offline"); } });
      await assert.rejects(r.makeDeps({ lockfile: LOCK, packageJson: PKG }), /offline/);
      assert.deepEqual(await readdir(path.join(state, "deps")), []);
    });

    test("an install that leaves no node_modules is refused", async () => {
      const r = createReleases({ stateDir: state, repo, npm: async () => {} });
      await assert.rejects(r.makeDeps({ lockfile: LOCK, packageJson: PKG }), /no node_modules/);
      assert.deepEqual(await readdir(path.join(state, "deps")), []);
    });
  });

  test("the state folder must be an absolute path", () => {
    assert.throws(() => createReleases({ stateDir: "relative" }), TypeError);
    assert.equal(lstatSync(tmp).isDirectory(), true);
  });
});
