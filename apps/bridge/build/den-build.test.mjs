// den-mvp/10 (ADR 0026 decisions 5 and 6): the den's own build steps, over a real git repository and state folder, with
// the build box faked. The delivery runner's use of them is tested in delivery/delivery-preview.test.mjs.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDenBuild } from "./den-build.mjs";
import { PREVIEW_READS } from "../routes.mjs";
import { lockHash } from "./releases.mjs";

const LOCK = '{ "lockfileVersion": 3 }\n';
const ID = "d-0123456789abcdef";
const reads = () => Object.fromEntries(PREVIEW_READS.map((route) => [route, (req, res) => res.end("{}")]));

let tmp, repo, state, box, den, switches, fetched;
const git = (...args) => execFileSync("git", ["-C", repo, "-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8" }).trim();
// One more commit on main (and on origin/main) that changes `files`. -> its commit id
const commit = (files, { land = true } = {}) => {
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    writeFileSync(path.join(repo, file), text);
  }
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  const sha = git("rev-parse", "HEAD");
  if (land) git("update-ref", "refs/remotes/origin/main", sha);
  return sha;
};
const link = (pair, name = "current") => readlinkSync(path.join(state, pair, name));

beforeEach(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "den-build-"));
  repo = path.join(tmp, "repo");
  state = path.join(tmp, "state");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q", "-b", "main", repo]);
  box = { built: [], build: async ({ folder }) => {
    box.built.push(folder);
    mkdirSync(path.join(folder, "apps/ui/dist"), { recursive: true });
    writeFileSync(path.join(folder, "apps/ui/dist/index.html"), "<!doctype html><title>ui</title>");
    return { ok: true, files: 1, bytes: 30, tail: "" };
  } };
  switches = 0;
  fetched = 0;
  den = createDenBuild({ stateDir: state, repo, box, reads, fetchMain: async () => void (fetched += 1), onSwitch: () => void (switches += 1) });
});
afterEach(async () => {
  await den.shutdown();
  await rm(tmp, { recursive: true, force: true });
});
// The den as den:install leaves it, on `sha`.
const install = async (sha) => {
  mkdirSync(path.join(state, "deps", lockHash(LOCK), "node_modules"), { recursive: true });
  await den.releases.makeRelease(sha);
  await den.releases.switchUi(sha);
  await den.releases.switchBridge(sha);
};

describe("go live", () => {
  test("a den with no release folders refuses, and builds nothing", async () => {
    const sha = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    const out = await den.goLive({ sha });
    assert.deepEqual([out.ok, out.code], [false, "failed"]);
    assert.match(out.reason, /runs from the checkout/);
    assert.equal(box.built.length, 0);
  });

  test("main is fetched, the merge commit is rebuilt in the box and switched to, and the switch is announced", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const sha = commit({ "apps/ui/a.txt": "b" });
    assert.deepEqual(await den.goLive({ sha }), { ok: true, release: sha });
    assert.deepEqual([fetched, switches, box.built.length], [1, 1, 2]);
    assert.equal(link("ui"), `../releases/${sha.slice(0, 12)}`);
    assert.equal(link("bridge"), `../releases/${base.slice(0, 12)}`);
  });

  test("a commit that is not on main does not go live", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const sha = commit({ "apps/ui/a.txt": "b" }, { land: false });
    const out = await den.goLive({ sha });
    assert.deepEqual([out.ok, out.code], [false, "failed"]);
    assert.match(out.reason, /is not on origin\/main/);
    assert.equal(link("ui"), `../releases/${base.slice(0, 12)}`);
    assert.equal(switches, 0);
  });

  test("a difference under apps/bridge/ or in the lockfile is needs-update, and names what differs", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a", "apps/bridge/b.mjs": "1" });
    await install(base);
    const bridge = commit({ "apps/ui/a.txt": "b", "apps/bridge/b.mjs": "2" });
    const one = await den.goLive({ sha: bridge });
    assert.deepEqual([one.ok, one.code], [false, "needs-update"]);
    assert.match(one.reason, /apps\/bridge\/b\.mjs/);
    const lock = commit({ "package-lock.json": '{ "lockfileVersion": 3, "x": 1 }\n' });
    const two = await den.goLive({ sha: lock });
    assert.deepEqual([two.ok, two.code], [false, "needs-update"]);
    assert.match(two.reason, /2 files/);
    assert.deepEqual([box.built.length, switches], [1, 0], "nothing was built or switched");
  });

  test("an older merge does not go in front of a later one that is already live", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const first = commit({ "apps/ui/a.txt": "b" });
    const second = commit({ "apps/ui/a.txt": "c" });
    assert.deepEqual(await den.goLive({ sha: second }), { ok: true, release: second });
    assert.deepEqual(await den.goLive({ sha: first }), { ok: true, release: second }, "the later release holds the earlier merge");
    assert.equal(link("ui"), `../releases/${second.slice(0, 12)}`);
    assert.equal(switches, 1);
  });

  test("two go-lives and a roll back run one at a time", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const first = commit({ "apps/ui/a.txt": "b" });
    const second = commit({ "apps/ui/a.txt": "c" });
    const results = await Promise.all([den.goLive({ sha: first }), den.goLive({ sha: second }), den.rollback(first)]);
    assert.deepEqual(results.slice(0, 2), [{ ok: true, release: first }, { ok: true, release: second }]);
    assert.equal(link("ui"), `../releases/${first.slice(0, 12)}`, "the roll back came last and went back to the first");
    assert.equal(link("ui", "previous"), `../releases/${second.slice(0, 12)}`);
    assert.equal(switches, 3);
  });
});

describe("previews", () => {
  test("a candidate is built in previews/<id>/ and served; its address in the snapshot has no token, its link does", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const sha = commit({ "apps/ui/a.txt": "b" }, { land: false }); // a candidate is not on main
    const out = await den.preview({ id: ID, sha });
    assert.equal(out.ok, true);
    assert.deepEqual(den.previewOf(ID), { url: out.url, sha });
    assert.doesNotMatch(out.url, /#/);
    assert.match(den.previewLink(ID), /#preview=[A-Za-z0-9_-]{43}$/);
    assert.match(await (await fetch(out.url)).text(), /<title>ui<\/title>/);
    assert.ok(existsSync(path.join(state, "previews", ID, "preview.json")));
    assert.deepEqual(await den.open({ id: ID, sha }), { url: out.url, sha }, "already open: the same listener");
    assert.equal(await den.open({ id: ID, sha: base }), null, "the folder holds another commit: not served as this one");
  });

  test("a candidate whose lockfile has no packages folder gets no build", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const sha = commit({ "package-lock.json": '{ "lockfileVersion": 3, "x": 1 }\n', "apps/ui/a.txt": "b" }, { land: false });
    const out = await den.preview({ id: ID, sha });
    assert.deepEqual([out.ok, out.code], [false, "needs-update"]);
    assert.match(out.reason, /den must be updated[\s\S]*cannot be previewed/);
    assert.equal(box.built.length, 1);
    assert.equal(existsSync(path.join(state, "previews", ID)), false);
  });

  test("a failed build leaves no folder and says whose it is; with no box nothing is tried", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    box.build = async () => ({ ok: false, files: 0, bytes: 0, tail: "boom", reason: "the build failed (exit 1)", code: "build" });
    assert.deepEqual(await den.preview({ id: ID, sha: base }), { ok: false, code: "build", reason: "the build failed (exit 1)", tail: "boom" });
    assert.equal(existsSync(path.join(state, "previews", ID)), false);
    const bare = createDenBuild({ stateDir: state, repo, reads });
    assert.equal((await bare.preview({ id: ID, sha: base })).code, "environment");
  });

  test("an id that is not a delivery's, or a commit id that is not whole, is a caller error and touches no path", async () => {
    const base = commit({ "package-lock.json": LOCK });
    for (const id of ["../x", "d-123", "", undefined]) {
      await assert.rejects(den.preview({ id, sha: base }), TypeError);
      await assert.rejects(den.close(id, { remove: true }), TypeError);
    }
    await assert.rejects(den.preview({ id: ID, sha: base.slice(0, 12) }), /full commit id/);
  });

  test("at start, the previews of deliveries that are not waiting are removed; closing with remove deletes the folder", async () => {
    const base = commit({ "package-lock.json": LOCK, "apps/ui/a.txt": "a" });
    await install(base);
    const other = "d-fedcba9876543210";
    await den.preview({ id: ID, sha: base });
    await den.preview({ id: other, sha: base });
    mkdirSync(path.join(state, "previews", "stray"));
    await den.shutdown();
    await den.sweep([ID]);
    assert.deepEqual(readdirSync(path.join(state, "previews")), [ID]);
    assert.ok(await den.open({ id: ID, sha: base }), "the kept one is served again");
    await den.close(ID, { remove: true });
    assert.deepEqual(readdirSync(path.join(state, "previews")), []);
    assert.equal(den.previewOf(ID), null);
  });
});
