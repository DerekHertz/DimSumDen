// den-mvp/34: the checks of ci.yml, run here in a box. Contract (delivery/checks.mjs):
//   checkBoxArgv(...)  the box sees its worktree (writable), .git and node_modules (read-only), the system folders, Node and
//                      the browsers, and nothing else of the home folder; only the audit job has the network
//   parseTap(text)     the innermost failing tests of Node's TAP output, with file and output
//   createChecks(...).run({ sha }) -> a record on disk under <recordDir>/<sha>/, the worktree removed afterwards
// The box itself is a fake launcher here: it runs a small Node script that prints what each command would.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { auditBoxArgv, checkBoxArgv, createChecks, envDifferences, parseTap, runState, summarize } from "./checks.mjs";

const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, "-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8" }).trim();

const TAP = `TAP version 13
# Subtest: the queue
    # Subtest: keeps its order
    not ok 1 - keeps its order
      ---
      duration_ms: 1.2
      type: 'test'
      location: '/w/t/apps/queue.test.mjs:12:3'
      failureType: 'testCodeFailure'
      error: |-
        Expected values to be strictly equal:
        3 !== 2
      code: 'ERR_ASSERTION'
      ...
    # Subtest: has a head
    ok 2 - has a head
      ---
      duration_ms: 0.1
      ...
    1..2
not ok 1 - the queue
  ---
  duration_ms: 2.0
  type: 'suite'
  location: '/w/t/apps/queue.test.mjs:5:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
# Subtest: PR \\#162 still loads
not ok 2 - PR \\#162 still loads
  ---
  location: '/w/t/apps/ui/scene.test.mjs:99:1'
  failureType: 'hookFailed'
  error: "EROFS: read-only file system"
  ...
1..2
`;

describe("parseTap", () => {
  test("lists the innermost failures with their file and output, and not the suite that failed because of them", () => {
    const got = parseTap(TAP, "/w/t");
    assert.deepEqual(got.map((f) => [f.name, f.file, f.location]), [
      ["keeps its order", "apps/queue.test.mjs", "apps/queue.test.mjs:12:3"],
      ["PR #162 still loads", "apps/ui/scene.test.mjs", "apps/ui/scene.test.mjs:99:1"],
    ]);
    assert.match(got[0].output, /3 !== 2/);
    assert.match(got[1].output, /EROFS/);
  });
  test("output with no failure gives none", () => {
    assert.deepEqual(parseTap("ok 1 - fine\n1..1\n"), []);
  });
});

describe("checkBoxArgv", () => {
  const base = { repo: "/h/u/repo", worktree: "/h/u/repo/.claude/worktrees/check-x", gitDir: "/h/u/repo/.git/worktrees/check-x", nodeDir: "/h/u/.nvm/v22", browsers: "/h/u/.cache/ms-playwright", command: ["/h/u/.nvm/v22/bin/node", "scripts/test-split.mjs", "rest"] };
  const pairs = (argv, flag) => argv.flatMap((a, i) => (a === flag ? [[argv[i + 1], argv[i + 2]]] : []));

  test("the worktree and its git folder are the only writable places outside /tmp; .git and node_modules are read-only", () => {
    const argv = checkBoxArgv(base);
    assert.deepEqual(pairs(argv, "--bind"), [[base.gitDir, base.gitDir], [base.worktree, base.worktree]]);
    const ro = pairs(argv, "--ro-bind");
    assert.ok(ro.some(([from, to]) => from === "/h/u/repo/.git" && to === "/h/u/repo/.git"));
    assert.ok(ro.some(([from, to]) => from === "/h/u/repo/node_modules" && to === `${base.worktree}/node_modules`));
    assert.ok(argv.includes(`${base.worktree}/node_modules/.vite`), "Vite gets a private cache over the shared folder");
    assert.ok(!ro.some(([from]) => from === "/h/u" || from === "/h/u/repo" || from === "/"), "neither the home folder nor the repository is in the box whole");
  });

  test("no network, a cleared environment, and the command after --", () => {
    const argv = checkBoxArgv(base);
    assert.ok(argv.includes("--unshare-all"));
    assert.ok(!argv.includes("--share-net"));
    assert.ok(argv.includes("--clearenv"));
    assert.deepEqual(argv.slice(argv.indexOf("--") + 1), base.command);
  });

  test("only a list of /etc files is in the box, never /etc whole", () => {
    const argv = checkBoxArgv(base);
    assert.ok(!pairs(argv, "--ro-bind").some(([from]) => from === "/etc"));
    const etc = pairs(argv, "--ro-bind-try").filter(([from]) => from.startsWith("/etc/")).map(([from]) => from);
    assert.ok(etc.includes("/etc/fonts") && etc.includes("/etc/ssl") && etc.includes("/etc/passwd"));
    assert.ok(!etc.some((f) => /shadow|sudoers|environment|profile|apt/.test(f)));
  });

  test("the audit box has the network and only the folder of package files: no worktree, no .git, no node_modules", () => {
    const argv = auditBoxArgv({ dir: "/s/rec/audit-input", nodeDir: "/h/u/.nvm/v22", command: ["/h/u/.nvm/v22/bin/node", "npm-cli.js", "audit"] });
    assert.ok(argv.includes("--share-net"));
    assert.deepEqual(pairs(argv, "--bind"), []);
    const ro = pairs(argv, "--ro-bind").map(([from]) => from);
    assert.deepEqual(ro.filter((f) => !f.startsWith("/usr")), ["/h/u/.nvm/v22", "/s/rec/audit-input"]);
    assert.deepEqual(pairs(argv, "--ro-bind").find(([from]) => from === "/s/rec/audit-input"), ["/s/rec/audit-input", "/audit"]);
    assert.equal(argv[argv.indexOf("--chdir") + 1], "/audit");
  });

  test("a relative path is refused", () => {
    assert.throws(() => checkBoxArgv({ ...base, worktree: "repo/wt" }), /worktree must be an absolute path/);
  });
});

describe("envDifferences and runState", () => {
  test("only the facts that differ from GitHub's runner; any 22.x Node counts as the same", () => {
    const got = envDifferences({ node: "22.23.3", cores: 1, network: "yes", bwrap: "present", gpu: "software GL" });
    assert.deepEqual(got.map((d) => d.fact), ["cores", "bwrap"]);
  });
  test("an error outranks red, red outranks flaky", () => {
    assert.equal(runState([{ state: "green" }, { state: "flaky" }]), "flaky");
    assert.equal(runState([{ state: "flaky" }, { state: "red" }]), "red");
    assert.equal(runState([{ state: "red" }, { state: "error" }]), "error");
    assert.equal(runState([{ state: "green" }]), "green");
  });
});

// A repository with a lockfile and a node_modules folder (the fake box is fakeLauncherWithCwd, at the end).
const cleanups = [];
afterEach(() => {
  for (const fn of cleanups.splice(0).reverse()) fn();
});
function repoFixture() {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "den-checks-")));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const repo = path.join(dir, "repo");
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  writeFileSync(path.join(repo, "package-lock.json"), '{"lockfileVersion":3}\n');
  writeFileSync(path.join(repo, "package.json"), '{"name":"fx"}\n');
  writeFileSync(path.join(repo, ".npmrc"), "registry=https://evil.example/\n");
  writeFileSync(path.join(repo, ".gitignore"), "node_modules\n.claude\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "base");
  mkdirSync(path.join(repo, "node_modules"));
  return { dir, repo, sha: git(repo, "rev-parse", "HEAD"), recordDir: path.join(dir, "records") };
}
describe("createChecks().run", () => {
  test("runs each job in the box, marks a test that passes when run again as flaky, writes the record and removes the worktree", async () => {
    const { repo, sha, recordDir } = repoFixture();
    const checks = createChecks({ repo, launcher: fakeLauncherWithCwd(), recordDir, bwrap: process.execPath });
    const rec = await checks.run({ sha, why: "a test" });
    assert.equal(rec.state, "red", JSON.stringify(rec.jobs.map((j) => [j.name, j.state, j.reason])));
    const restJob = rec.jobs.find((j) => j.name === "test");
    assert.deepEqual(restJob.flaky.map((f) => f.name), ["keeps its order"]);
    assert.deepEqual(restJob.failures.map((f) => f.name), ["PR #162 still loads"]);
    assert.equal(restJob.rerun.command, "node --test apps/queue.test.mjs apps/ui/scene.test.mjs");
    assert.deepEqual(rec.jobs.map((j) => j.name), ["test", "test-browser", "audit"]);
    const audit = rec.jobs.find((j) => j.name === "audit");
    assert.equal(audit.box, "network on");
    assert.equal(audit.command, "npm audit --audit-level=high --registry=https://registry.npmjs.org/ --userconfig=/audit/npmrc --globalconfig=/dev/null");
    assert.deepEqual(readdirSync(path.join(recordDir, sha, rec.id, "audit-input")).sort(), ["npmrc", "package-lock.json", "package.json"], "the audit box gets the two package files and an empty config, not the commit's .npmrc");
    const files = readdirSync(path.join(recordDir, sha));
    assert.ok(files.includes(`${rec.id}.json`));
    assert.ok(existsSync(path.join(recordDir, sha, rec.id, "test.log")), "each job's log is kept beside the record");
    assert.equal(JSON.parse(readFileSync(path.join(recordDir, sha, `${rec.id}.json`), "utf8")).state, "red");
    assert.equal(git(repo, "worktree", "list").split("\n").length, 1, "the worktree is gone");
    assert.deepEqual((await checks.latest(sha)).id, rec.id);
    const shown = summarize(rec);
    assert.deepEqual(shown.failed, [{ job: "test", name: "PR #162 still loads", location: "apps/ui/scene.test.mjs:99:1" }]);
    assert.deepEqual(shown.flaky, [{ job: "test", name: "keeps its order" }]);
    assert.equal("dir" in shown, false);
  });

  test("a commit that changes the lockfile is skipped: the packages here do not match it", async () => {
    const { repo, recordDir } = repoFixture();
    writeFileSync(path.join(repo, "package-lock.json"), '{"lockfileVersion":3,"x":1}\n');
    git(repo, "commit", "-q", "-am", "new lock");
    const sha = git(repo, "rev-parse", "HEAD");
    git(repo, "checkout", "-q", "HEAD~1", "--", "package-lock.json"); // the checkout's installed lockfile is the old one
    const checks = createChecks({ repo, launcher: fakeLauncherWithCwd(), recordDir, bwrap: process.execPath });
    const rec = await checks.run({ sha });
    assert.equal(rec.state, "skipped");
    assert.match(rec.reason, /package-lock\.json/);
  });

  test("with no resource group, nothing runs and the record says why", async () => {
    const { repo, sha, recordDir } = repoFixture();
    const rec = await createChecks({ repo, launcher: null, recordDir, bwrap: process.execPath }).run({ sha });
    assert.equal(rec.state, "error");
    assert.match(rec.reason, /no resource group/);
  });

  test("a test that failed in an earlier run of the commit and passes now is marked flaky in the new record", async () => {
    const { repo, sha, recordDir } = repoFixture();
    let n = 0;
    const checks = createChecks({ repo, launcher: fakeLauncherWithCwd({ allPass: () => (n += 1) > 3 }), recordDir, bwrap: process.execPath, now: (() => { let t = Date.parse("2026-10-15T12:00:00Z"); return () => new Date((t += 1000)); })() });
    const first = await checks.run({ sha });
    assert.equal(first.state, "red");
    const second = await checks.run({ sha });
    assert.equal(second.state, "green");
    assert.deepEqual(second.flaky.map((f) => [f.job, f.name, f.earlier]), [["test", "PR #162 still loads", first.id]]);
  });

  test("runs go one at a time, and a run past its deadline is red with the reason", async () => {
    const { repo, sha, recordDir } = repoFixture();
    let inside = 0, most = 0;
    const slow = fakeLauncherWithCwd({ allPass: () => true });
    const launch = slow.launch;
    slow.launch = async (input) => {
      inside += 1;
      most = Math.max(most, inside);
      const res = await launch(input);
      res.child.once("exit", () => (inside -= 1));
      return res;
    };
    const checks = createChecks({ repo, launcher: slow, recordDir, bwrap: process.execPath });
    git(repo, "commit", "-q", "--allow-empty", "-m", "second");
    const other = git(repo, "rev-parse", "HEAD");
    const [a, b] = await Promise.all([checks.run({ sha }), checks.run({ sha: other })]);
    assert.deepEqual([a.state, b.state], ["green", "green"]);
    assert.equal(most, 1, "the two commits' jobs never ran at the same time");

    const hung = { enforced: true, launch: async () => {
      const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], { stdio: ["pipe", "pipe", "pipe"] });
      return { child, group: { kill: () => child.kill("SIGKILL"), settled: async () => true, unit: "fake.scope" } };
    } };
    const late = await createChecks({ repo, launcher: hung, recordDir: path.join(recordDir, "late"), bwrap: process.execPath, deadlineMs: 300 }).run({ sha });
    assert.equal(late.state, "red");
    assert.match(late.reason, /past their 0-minute limit|past their/);
  });

  test("a full commit id is required", async () => {
    const { repo, recordDir } = repoFixture();
    await assert.rejects(createChecks({ repo, launcher: null, recordDir }).run({ sha: "HEAD" }), /full commit id/);
  });
});

// The fake box: the rest job prints TAP (two failures, located under the worktree it was started in) and exits 1; the
// re-run of the failing files passes only "keeps its order"; every other command passes. With allPass() true, all pass.
function fakeLauncherWithCwd({ allPass = () => false } = {}) {
  const l = { enforced: true, commands: [] };
  l.launch = async ({ args }) => {
    const command = args.slice(args.indexOf("--") + 1);
    const wt = args[args.indexOf("--chdir") + 1];
    l.commands.push(command);
    const cmd = command[1] === "--test" ? "--test" : command[1] === "--input-type=module" ? "browser files" : command.join(" ");
    const pass = allPass();
    const out = pass ? "ok 1 - fine\n1..1\n"
      : cmd.includes("--test") ? `ok 1 - keeps its order\n# Subtest: PR \\#162 still loads\nnot ok 2 - PR \\#162 still loads\n  ---\n  location: '${wt}/apps/ui/scene.test.mjs:99:1'\n  failureType: 'hookFailed'\n  error: "EROFS"\n  ...\n1..2\n`
      : cmd.includes(" rest") ? TAP.replaceAll("/w/t", wt) : "";
    const code = pass ? 0 : cmd.includes("--test") || cmd.includes(" rest") ? 1 : 0;
    const child = spawn(process.execPath, ["-e", `process.stdout.write(${JSON.stringify(out)}); process.exitCode = ${code};`], { stdio: ["pipe", "pipe", "pipe"] });
    return { child, group: { kill: () => {}, settled: async () => true, unit: "fake.scope" } };
  };
  return l;
}
