// den-mvp outcome 3 (spec section 4, "Delivery" in the testing decisions): a delivery job through the bridge entry point,
// over a fixture board in a real git repository, with the fake runtime as the agents and a fake git host. Contract:
//
//   POST /deliveries { ref } | { text, title? }   (token-gated) -> 201 { delivery, ticket? }
//       400 bad ref or text; 404 no such ticket; 409 not in the frontier, not a software ticket, or already being delivered
//   POST /deliveries/:id/resume { verdict? }  -> 202 { delivery }     POST /deliveries/:id/stop -> 202     .../close -> 200
//   snapshot key `deliveries`: [{ id, ref, title, state, step, pause: { kind, reason, next } | null, candidate, evidence, pr, live, runs }]
//   The steps: developer (commits) -> qa verify (VERDICT line) -> scripted checks -> security when they ask -> push, pull
//   request, checks, merge -> the ticket resolved. The agents write nothing on the board and hold no git-host credentials.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeBridge, until, FEATURE } from "../cells/host-test-helpers.mjs";
import { claim } from "../../organism-infra/board-service.mjs";

const REF = `${FEATURE}/08-plain`;
const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, "-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8" }).trim();

// A git host that keeps one pull request in memory. `calls` is every side effect asked of it, in order.
function fakeGitHost(root) {
  const h = { calls: [], pr: null, remote: null, checks: [{ name: "test", done: true, ok: true }], mergeable: "MERGEABLE", riskResult: { clean: true, hits: [] }, files: null, secret: false, fail: {}, gate: null };
  const call = async (name, arg) => {
    h.calls.push(arg === undefined ? [name] : [name, arg]);
    if (h.fail[name]) throw new Error(h.fail[name]);
  };
  return Object.assign(h, {
    mainSha: async () => git(root, "rev-parse", "HEAD"),
    descends: async ({ base, sha }) => {
      try {
        return git(root, "merge-base", base, sha) === base;
      } catch {
        return false; // no common history at all
      }
    },
    changed: async ({ base, sha }) => h.files ?? git(root, "diff", "--name-only", base, sha).split("\n").filter(Boolean),
    addsSecret: async () => h.secret,
    risk: async () => h.riskResult,
    push: async (a) => {
      await call("push", a);
      h.remote = a;
      if (h.pr?.state === "OPEN") h.pr.sha = a.sha;
    },
    findPr: async () => (h.pr ? { ...h.pr } : null),
    openPr: async (a) => {
      await call("openPr", a);
      h.pr = { number: 7, url: "https://github.com/o/r/pull/7", state: "OPEN", sha: h.remote.sha };
    },
    prState: async () => ({ ...h.pr, mergeable: h.mergeable, checks: h.checks }),
    waitChecks: async () => {
      await call("waitChecks");
      await h.gate;
    },
    merge: async (a) => {
      await call("merge", a);
      h.pr.state = "MERGED";
    },
  });
}

const cleanups = [];
afterEach(async () => {
  for (const fn of cleanups.splice(0).reverse()) await fn();
});

async function setup(options = {}) {
  let host;
  const t = await makeBridge({ ...options, gitHost: (root) => (host = fakeGitHost(root)) });
  cleanups.push(() => t.close());
  const root = t.fx.root;
  const job = async () => (await t.state()).deliveries?.at(-1);
  const spawn = (n) => until(() => t.fake.spawns[n], { what: `spawn ${n + 1}` });
  const when = (pred, what) => until(async () => { const j = await job(); return j && pred(j) ? j : null; }, { what, ms: 5000 });
  const paused = (kind) => when((j) => j.state === "paused" && j.pause.kind === kind, `a pause for ${kind}`);
  // One agent's run: an optional commit in its worktree, its last message, then done.
  const work = (rec, { commit, say, ok = true } = {}) => {
    if (commit) {
      writeFileSync(path.join(rec.args.cwd, commit), `${commit}\n`);
      git(rec.args.cwd, "add", "-A");
      git(rec.args.cwd, "commit", "-q", "-m", `work on ${commit}`);
    }
    if (say) rec.emit({ type: "reply", text: say });
    rec.emit({ type: "done", ok });
    return commit ? git(rec.args.cwd, "rev-parse", "HEAD") : null;
  };
  const status = (ref = REF) => /^\*\*Status:\*\* (.+)$/m.exec(readFileSync(path.join(root, ".scratch", ...ref.split("/").toSpliced(1, 0, "issues")) + ".md", "utf8"))[1];
  const lock = (ref = REF) => {
    const file = path.join(root, ".scratch", ...ref.split("/").toSpliced(1, 0, "issues")) + ".lock";
    return existsSync(file) ? readFileSync(file, "utf8").split(" ")[0] : null;
  };
  const handoffs = () => (existsSync(path.join(root, ".scratch", FEATURE, "handoffs")) ? readdirSync(path.join(root, ".scratch", FEATURE, "handoffs")) : []);
  const start = async (body = { ref: REF }) => {
    const res = await t.post("/deliveries", body);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.delivery;
  };
  // The first two steps: a developer that commits and a qa that passes. -> the candidate commit.
  const toQaPass = async () => {
    const sha = work(await spawn(0), { commit: "feature.txt", say: "Added feature.txt. The tests pass." });
    work(await spawn(1), { say: "I ran the tests.\nVERDICT: pass" });
    return sha;
  };
  const sideEffects = () => host.calls.map((c) => c[0]);
  return { ...t, root, git: host, job, spawn, when, paused, work, status, lock, handoffs, start, toQaPass, sideEffects };
}

describe("one approved job, from the den to a merged pull request", () => {
  test("developer, independent qa, the checks, the pull request, the merge and the resolved ticket", async () => {
    const t = await setup();
    const base = git(t.root, "rev-parse", "HEAD");
    const started = await t.start();
    assert.equal(started.state, "running");
    assert.equal(started.ref, REF);

    const dev = await t.spawn(0);
    assert.equal(dev.args.role, "developer");
    assert.equal(git(dev.args.cwd, "rev-parse", "HEAD"), base, "the developer starts at the main branch's commit");
    assert.match(dev.args.prompt, /You are the developer cell for ticket fx\/08-plain/);
    assert.match(dev.args.prompt, /Run no board command, and do not push/);
    await until(() => t.lock() === "developer" && t.status() === "claimed", { what: "the bridge's claim for the developer" });

    const sha = t.work(dev, { commit: "feature.txt", say: "Added feature.txt. The tests pass." });
    const qa = await t.spawn(1);
    assert.deepEqual([qa.args.role, qa.args.mode], ["qa", "verify"]);
    assert.equal(git(qa.args.cwd, "rev-parse", "HEAD"), sha, "qa reviews the developer's commit, in a worktree of its own");
    assert.notEqual(qa.args.cwd, dev.args.cwd);
    assert.match(qa.args.prompt, new RegExp(`git diff ${base}\\.\\.HEAD`));
    assert.equal(t.status(), "in-review");
    const devHandoff = t.handoffs().find((n) => n.startsWith("08-developer-"));
    assert.match(readFileSync(path.join(t.root, ".scratch", FEATURE, "handoffs", devHandoff), "utf8"), /"cell": "developer"[\s\S]*Added feature\.txt\. The tests pass\./);

    t.work(qa, { say: "I ran the tests.\nVERDICT: pass" });
    const done = await t.when((j) => j.state === "merged", "the delivery to merge");
    assert.equal(t.fake.spawns.length, 2, "a clean change needs no security run");
    assert.deepEqual(t.sideEffects(), ["push", "openPr", "waitChecks", "merge"]);
    const branch = `den/${REF}-${dev.args.cwd.slice(-8)}`;
    assert.deepEqual(t.git.calls[0], ["push", { branch, sha }], "the commit the bridge recorded is what is pushed");
    assert.deepEqual(t.git.calls[3], ["merge", { number: 7, sha }], "and the merge holds only for that commit");
    assert.match(t.git.calls[1][1].title, /^fx\/08-plain: /);
    assert.doesNotMatch(t.git.calls[1][1].body, /Added feature/, "no agent text is in the pull request");
    assert.equal(t.status(), "resolved");
    assert.equal(t.lock(), null);
    assert.deepEqual(done.pr, { number: 7, url: "https://github.com/o/r/pull/7" });
    assert.deepEqual(done.evidence, { qa: "pass", security: null, risk: { clean: true, hits: 0, security: false, userMerge: false }, ci: "green" });
    assert.deepEqual(done.runs.map((r) => [r.role, r.state]), [["developer", "done"], ["qa", "done"]]);
  });

  test("a risk hit sends the commit to security before anything is pushed", async () => {
    const t = await setup();
    await t.start();
    t.git.riskResult = { clean: false, hits: ["x.mjs: shelling out to another program"] };
    const sha = await t.toQaPass();
    const security = await t.spawn(2);
    assert.equal(security.args.role, "security");
    assert.equal(git(security.args.cwd, "rev-parse", "HEAD"), sha);
    assert.deepEqual(t.sideEffects(), [], "nothing is pushed before the review");
    t.work(security, { say: "No finding.\nVERDICT: pass" });
    const done = await t.when((j) => j.state === "merged", "the delivery to merge");
    assert.equal(done.evidence.security, "pass");
    assert.deepEqual(t.sideEffects(), ["push", "openPr", "waitChecks", "merge"]);
  });

  test("a change to the bridge or a guardrail is reviewed by security, opened as a pull request, and left for the user to merge", async () => {
    const t = await setup();
    await t.start();
    t.git.files = ["apps/bridge/cells/host.mjs"];
    await t.toQaPass();
    t.work(await t.spawn(2), { say: "VERDICT: pass" });
    const waiting = await t.paused("guardrail");
    assert.match(waiting.pause.reason, /the review and the merge are yours/);
    assert.deepEqual(t.sideEffects(), ["push", "openPr", "waitChecks"], "the bridge does not merge it");
    assert.equal(t.status(), "in-review");

    // Resume before the user has merged: still theirs. After their merge, Resume closes the ticket.
    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`)).status, 202);
    await t.when((j) => j.state === "paused" && j.pause.kind === "guardrail" && j.updatedAt !== waiting.updatedAt, "the same pause again");
    assert.equal(t.sideEffects().includes("merge"), false);
    t.git.pr.state = "MERGED";
    await t.post(`/deliveries/${waiting.id}/resume`);
    await t.when((j) => j.state === "merged", "the delivery to close");
    assert.equal(t.status(), "resolved");
    assert.equal(t.sideEffects().filter((c) => c === "push").length, 1, "nothing is pushed again");
  });

  test("a ui ticket waits for the user's visual verdict, and merges on it", async () => {
    const UI = `${FEATURE}/10-panel`;
    const t = await setup({ preWrite: (root) => writeFile(path.join(root, ".scratch", FEATURE, "issues", "10-panel.md"), "# 10: Panel\n\n**Type:** ui\n\n**Blocked by:** None\n\n**Status:** ready-for-agent\n\n## Comments\n\n") });
    await t.start({ ref: UI });
    await t.toQaPass();
    const waiting = await t.paused("visual-verdict");
    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`, { verdict: "reject" })).status, 409);
    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`, { verdict: "approve" })).status, 202);
    await t.when((j) => j.state === "merged", "the delivery to merge");
    assert.equal(t.status(UI), "resolved");
  });

  test("a task typed in the den is written as a ticket and delivered", async () => {
    const t = await setup();
    const res = await t.post("/deliveries", { text: "Add a health route to the dev server.\nIt answers 200." });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.match(res.body.ticket.ref, /^den\/\d{2}-delivery$/);
    const dev = await t.spawn(0);
    assert.equal(dev.args.ref, res.body.ticket.ref);
    assert.doesNotMatch(dev.args.prompt, /health route/, "the text is in the ticket, not in the prompt");
    assert.match(readFileSync(dev.args.ticketFile, "utf8"), /Add a health route to the dev server\./);
  });
});

describe("a review that sends the work back", () => {
  test("the developer fixes it from the same commit with the findings, and every check runs again on the new commit", async () => {
    const t = await setup();
    await t.start();
    const first = t.work(await t.spawn(0), { commit: "feature.txt", say: "Done." });
    t.work(await t.spawn(1), { say: "The empty case is not handled.\nVERDICT: bounce" });

    const fix = await t.spawn(2);
    assert.equal(fix.args.role, "developer");
    assert.equal(git(fix.args.cwd, "rev-parse", "HEAD"), first, "the fix round starts at the commit that was reviewed");
    assert.match(fix.args.prompt, /read \.den\/findings\.md first/);
    assert.match(readFileSync(path.join(fix.args.cwd, ".den", "findings.md"), "utf8"), /The empty case is not handled\./);
    assert.equal(t.sideEffects().length, 0, "a bounced commit is never pushed");
    const second = t.work(fix, { commit: "fix.txt", say: "Handled the empty case." });
    assert.equal(git(fix.args.cwd, "status", "--porcelain"), "", "the findings file is in no commit and not even untracked");

    const again = await t.spawn(3);
    assert.deepEqual([again.args.role, git(again.args.cwd, "rev-parse", "HEAD")], ["qa", second], "the earlier verdict does not cover the new commit");
    t.work(again, { say: "VERDICT: pass" });
    const done = await t.when((j) => j.state === "merged", "the delivery to merge");
    assert.equal(done.bounces, 1);
    assert.deepEqual(t.git.calls[0][1].sha, second);
    assert.match(t.git.calls[0][1].branch, new RegExp(`^den/${REF}-[0-9a-f]{8}$`));
  });

  test("the second bounce pauses the job; the user's Resume is one more round", async () => {
    const t = await setup();
    await t.start();
    t.work(await t.spawn(0), { commit: "a.txt", say: "Done." });
    t.work(await t.spawn(1), { say: "VERDICT: bounce" });
    t.work(await t.spawn(2), { commit: "b.txt", say: "Fixed." });
    t.work(await t.spawn(3), { say: "Still wrong.\nVERDICT: bounce" });
    const waiting = await t.paused("failed-twice");
    assert.equal(t.fake.spawns.length, 4, "no third developer run starts by itself");
    assert.equal(t.lock(), null);
    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`)).status, 202);
    assert.equal((await t.spawn(4)).args.role, "developer");
  });
});

describe("what stops a delivery, and what it leaves", () => {
  const cases = [
    ["a developer that commits nothing", async (t) => t.work(await t.spawn(0), { say: "I could not find the file." }), "no-commit", "ready-for-agent"],
    ["a developer run that fails", async (t) => t.work(await t.spawn(0), { ok: false }), "step-failed", "ready-for-agent"],
    ["a qa run with no verdict line", async (t) => { t.work(await t.spawn(0), { commit: "a.txt" }); t.work(await t.spawn(1), { say: "Looks fine to me." }); }, "no-verdict", "in-review"],
    ["a qa run that changes the commit it reviews", async (t) => { t.work(await t.spawn(0), { commit: "a.txt" }); t.work(await t.spawn(1), { commit: "sneak.txt", say: "VERDICT: pass" }); }, "changed-commit", "in-review"],
    ["a developer commit that is not built on the commit the delivery started from", async (t) => {
      const dev = await t.spawn(0);
      git(dev.args.cwd, "checkout", "-q", "--orphan", "elsewhere");
      t.work(dev, { commit: "a.txt" });
      t.work(await t.spawn(1), { say: "VERDICT: pass" });
    }, "changed-commit", "in-review"],
    ["a line that looks like a secret", async (t) => { t.git.secret = true; await t.toQaPass(); }, "possible-secret", "in-review"],
    ["a change to CI configuration, which is never pushed", async (t) => { t.git.files = [".github/workflows/ci.yml"]; await t.toQaPass(); t.work(await t.spawn(2), { say: "VERDICT: pass" }); await t.paused("ci-change"); assert.deepEqual(t.sideEffects(), []); }, "ci-change", "in-review"],
    ["a push the remote refuses", async (t) => { t.git.fail.push = "remote: denied https://user:hunter2@example.invalid/r.git"; await t.toQaPass(); }, "publish-failed", "in-review"],
    ["a red check", async (t) => { t.git.checks = [{ name: "test", done: true, ok: false }]; await t.toQaPass(); }, "ci-red", "in-review"],
    ["no check at all", async (t) => { t.git.checks = []; await t.toQaPass(); }, "no-checks", "in-review"],
    ["a conflict with main", async (t) => { t.git.mergeable = "CONFLICTING"; await t.toQaPass(); }, "conflict", "in-review"],
    ["a merge the git host refuses", async (t) => { t.git.fail.merge = "review required"; await t.toQaPass(); }, "publish-failed", "in-review"],
  ];
  for (const [name, act, kind, status] of cases) {
    test(`${name}: paused as ${kind}, nothing merged, the ticket free and ${status}`, async () => {
      const t = await setup();
      await t.start();
      await act(t);
      const waiting = await t.paused(kind);
      assert.ok(waiting.pause.reason && waiting.pause.next, "the pause says why and what to do next");
      assert.doesNotMatch(waiting.pause.reason, /hunter2/, "a credential in a remote's message is not shown");
      assert.equal(t.git.pr?.state === "MERGED", false);
      assert.equal(t.lock(), null, "the bridge gave its claim up");
      assert.equal(t.status(), status);
    });
  }

  test("a pull request that is not at the commit the den checked is not merged", async () => {
    const t = await setup();
    await t.start();
    let release;
    t.git.gate = new Promise((r) => (release = r));
    await t.toQaPass();
    await until(() => t.sideEffects().includes("waitChecks"), { what: "the wait for the checks" });
    t.git.pr.sha = "f".repeat(40); // someone pushed to the branch while the checks ran
    release();
    await t.paused("changed-commit");
    assert.equal(t.sideEffects().includes("merge"), false);
  });

  test("a check that turns red between the wait and the merge is seen: the merge reads the pull request again", async () => {
    const t = await setup();
    await t.start();
    const real = t.git.prState;
    let reads = 0;
    t.git.prState = async (a) => {
      reads += 1;
      if (reads === 2) t.git.checks = [{ name: "late", done: true, ok: false }];
      return real(a);
    };
    await t.toQaPass();
    await t.paused("ci-red");
    assert.equal(t.sideEffects().includes("merge"), false);
  });

  test("Stop ends the running step and the job waits; Resume runs the step again; close ends it for good", async () => {
    const t = await setup();
    const started = await t.start();
    const dev = await t.spawn(0);
    await until(() => t.lock() === "developer", { what: "the claim" });
    assert.equal((await t.post(`/deliveries/${started.id}/stop`)).status, 202);
    await until(() => dev.exited, { what: "the developer run to end" });
    await until(() => t.lock() === null, { what: "the claim to be dropped" });
    const waiting = await t.paused("stopped");
    assert.equal(t.status(), "ready-for-agent");
    assert.equal((await t.post(`/deliveries/${started.id}/stop`)).status, 409);
    assert.equal((await t.post("/deliveries", { ref: REF })).status, 409, "a waiting delivery is resumed or closed, not started twice");

    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`)).status, 202);
    assert.equal((await t.spawn(1)).args.role, "developer");
    await t.post(`/deliveries/${started.id}/stop`);
    await t.paused("stopped");
    await until(() => t.lock() === null, { what: "the claim to be dropped" });
    assert.equal((await t.post(`/deliveries/${started.id}/close`)).status, 200);
    assert.equal((await t.job()).state, "closed");
    assert.equal((await t.post(`/deliveries/${started.id}/resume`)).status, 409);
  });

  test("with no room the delivery waits, and starts by itself when a run ends", async () => {
    const t = await setup({ policy: { maxConcurrent: 1 } });
    const other = await t.bridge.host.start({ ref: `${FEATURE}/07-bumpable`, role: "architect" });
    assert.equal(other.ok, true, other.error);
    await t.start();
    await t.paused("no-room");
    assert.equal(t.fake.spawns.length, 1);
    t.fake.spawns[0].emit({ type: "done", ok: true });
    assert.equal((await t.spawn(1)).args.role, "developer");
    assert.equal((await t.job()).state, "running");
  });
});

describe("what a delivery may be started on", () => {
  test("a ticket that is unknown, not in the frontier, not software, or already being delivered is refused, and nothing starts", async () => {
    const t = await setup();
    assert.equal((await t.post("/deliveries", { ref: `${FEATURE}/99-nope` })).status, 404);
    assert.equal((await t.post("/deliveries", { ref: `${FEATURE}/05-blocked` })).status, 409);
    assert.equal((await t.post("/deliveries", { ref: `${FEATURE}/03-blocked-dep` })).status, 409);
    assert.equal((await t.post("/deliveries", { ref: "../../etc" })).status, 400);
    assert.equal((await t.post("/deliveries", {})).status, 400);
    assert.equal((await t.post("/deliveries", { text: `use ${["AKIA", "IOSFODNN7", "EXAMPLE"].join("")}` })).status, 400);
    assert.equal(t.fake.spawns.length, 0);
    const both = await Promise.all([t.post("/deliveries", { ref: REF }), t.post("/deliveries", { ref: REF })]);
    assert.deepEqual(both.map((r) => r.status).sort(), [201, 409], "two clicks start one delivery");
    await t.spawn(0);
    assert.equal(t.fake.spawns.length, 1);
  });

  test("the delivery routes need the session token", async () => {
    const t = await setup();
    assert.equal((await t.post("/deliveries", { ref: REF }, { ...t.headers, Authorization: "Bearer wrong" })).status, 401);
    assert.equal((await t.post("/deliveries/d-0123456789abcdef/resume", {})).status, 404);
    assert.equal((await t.post("/deliveries/nope/stop", {})).status, 404);
  });
});

describe("after a bridge restart", () => {
  const HELD = `${FEATURE}/04-review`;
  test("a delivery that was under way waits for Resume, says what was interrupted, and then goes on from the recorded commit", async () => {
    let sha;
    const t = await setup({
      preWrite: async (root) => {
        const base = git(root, "rev-parse", "HEAD");
        git(root, "checkout", "-q", "-b", "work");
        git(root, "commit", "-q", "--allow-empty", "-m", "candidate");
        sha = git(root, "rev-parse", "HEAD");
        git(root, "checkout", "-q", "main");
        await claim(root, HELD, "qa", { mode: "verify" });
        const job = {
          id: "d-0123456789abcdef", ref: HELD, title: "04: In review", type: "bug", state: "running", base, branch: `den/${HELD}-01234567`, startedAt: "2026-10-13T00:00:00.000Z",
          candidate: { sha, runId: "c-0123456789abcdef" }, evidence: { pr: { sha, state: "MERGED" } }, live: { runId: "c-fedcba9876543210", role: "qa", mode: "verify" }, claimed: true, runs: [], shell: "rm -rf /",
        };
        await mkdir(path.join(root, ".scratch", "_run"), { recursive: true });
        await writeFile(path.join(root, ".scratch", "_run", "delivery.jsonl"), [JSON.stringify({ job }), JSON.stringify({ op: "push", phase: "intent", jobId: job.id }), "garbage"].join("\n") + "\n");
      },
    });
    const waiting = await t.paused("bridge-restart");
    assert.match(waiting.pause.reason, /restarted during a push/);
    assert.equal(waiting.uncertain, "push");
    assert.equal(t.fake.spawns.length, 0, "nothing runs by itself after a restart");
    assert.equal(t.lock(HELD), "qa", "the lost run's claim is still on the board");

    assert.equal((await t.post(`/deliveries/${waiting.id}/resume`)).status, 202);
    const qa = await t.spawn(0);
    assert.deepEqual([qa.args.role, git(qa.args.cwd, "rev-parse", "HEAD")], ["qa", sha], "the step runs again at the recorded commit");
    assert.equal(t.sideEffects().includes("merge"), false, "a merged state read from the log is not believed");
    t.work(qa, { say: "VERDICT: pass" });
    await t.when((j) => j.state === "merged", "the delivery to merge");
    assert.deepEqual(t.sideEffects(), ["push", "openPr", "waitChecks", "merge"]);
  });
});
