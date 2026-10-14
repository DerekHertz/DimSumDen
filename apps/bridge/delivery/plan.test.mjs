// den-mvp outcome 3: the pure parts of a delivery. The plan over a job's record, the paths whose change is the user's
// to merge, a reviewer's verdict line, the step prompts, the delivery log's replay, and the git-host argument lists.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { nextStep, isCiPath, isUserMergePath, MAX_BOUNCES } from "./plan.mjs";
import { deliveryPrompt, readVerdict } from "./prompts.mjs";
import { createJobLog, validateJob } from "./jobs.mjs";
import { createGitHost } from "./git-host.mjs";

const BASE = "a".repeat(40), SHA = "b".repeat(40), OLD = "c".repeat(40), RUN = "c-0123456789abcdef";
const BRANCH = "den/fx/08-plain-01234567";
const riskOf = (more = {}) => ({ sha: SHA, clean: true, hits: 0, secret: false, security: false, userMerge: false, ...more });
const job = (evidence = {}, more = {}) => ({ base: BASE, candidate: { sha: SHA }, bounces: 0, visual: false, evidence, ...more });
const passed = { qa: { sha: SHA, verdict: "pass" }, risk: riskOf() };
const open = { ...passed, pr: { sha: SHA, state: "OPEN", mergeable: "MERGEABLE" } };
const green = { ...open, ci: { sha: SHA, state: "green" } };

describe("the delivery plan", () => {
  const rows = [
    ["no candidate: a developer at the base", { base: BASE, candidate: null, bounces: 0, evidence: {} }, { kind: "run", role: "developer", at: BASE, since: BASE }],
    ["a candidate: qa verifies it", job(), { kind: "run", role: "qa", mode: "verify", at: SHA, since: BASE }],
    ["a qa pass for an older commit does not count", job({ qa: { sha: OLD, verdict: "pass" } }), { kind: "run", role: "qa", mode: "verify", at: SHA, since: BASE }],
    ["a qa bounce: the developer fixes it, from the candidate", job({ qa: { sha: SHA, verdict: "bounce" } }, { bounces: 1 }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["qa passed: the scripted checks", job({ qa: passed.qa }), { kind: "check" }],
    ["a risk hit: security reviews", job({ ...passed, risk: riskOf({ clean: false, hits: 2, security: true }) }), { kind: "run", role: "security", at: SHA, since: BASE }],
    ["a security bounce: the developer fixes it", job({ ...passed, risk: riskOf({ security: true }), security: { sha: SHA, verdict: "bounce" } }, { bounces: 1 }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["clean: publish", job(passed), { kind: "publish" }],
    ["security passed: publish", job({ ...passed, risk: riskOf({ security: true }), security: { sha: SHA, verdict: "pass" } }), { kind: "publish" }],
    ["a pull request: its checks", job(open), { kind: "ci" }],
    ["green and mergeable: merge", job(green), { kind: "merge" }],
    ["merged: resolve the ticket", job({ ...passed, pr: { sha: SHA, state: "MERGED" } }), { kind: "resolve" }],
    ["a ui ticket with the user's verdict: merge", job({ ...green, verdict: { sha: SHA, ok: true } }, { visual: true }), { kind: "merge" }],
  ];
  for (const [name, input, want] of rows) test(name, () => assert.deepEqual(nextStep(input), want));

  const pauses = [
    ["the second bounce", job({ qa: { sha: SHA, verdict: "bounce" } }, { bounces: MAX_BOUNCES }), "failed-twice"],
    ["a line that looks like a secret", job({ ...passed, risk: riskOf({ secret: true }) }), "possible-secret"],
    ["a red check", job({ ...open, ci: { sha: SHA, state: "red", failed: ["test"] } }), "ci-red"],
    ["no check at all", job({ ...open, ci: { sha: SHA, state: "none" } }), "no-checks"],
    ["checks still running", job({ ...open, ci: { sha: SHA, state: "pending" } }), "ci-pending"],
    ["a guardrail path, even when all is green", job({ ...green, risk: riskOf({ security: true, userMerge: true }), security: { sha: SHA, verdict: "pass" } }), "guardrail"],
    ["a ui ticket with no verdict", job(green, { visual: true }), "visual-verdict"],
    ["a ui verdict for an older commit", job({ ...green, verdict: { sha: OLD, ok: true } }, { visual: true }), "visual-verdict"],
    ["a conflict", job({ ...green, pr: { sha: SHA, state: "OPEN", mergeable: "CONFLICTING" } }), "conflict"],
    ["mergeability not known", job({ ...green, pr: { sha: SHA, state: "OPEN", mergeable: "UNKNOWN" } }), "not-mergeable"],
  ];
  // den-mvp/10 (ADR 0026 decisions 5 and 6): a candidate that changes apps/ui/ is previewed and approved before the push,
  // and goes live after the merge.
  const unreviewed = { qa: passed.qa, risk: riskOf({ ui: true }) };
  const ui = { ...unreviewed, security: { sha: SHA, verdict: "pass" } };
  const built = { ...ui, preview: { sha: SHA, ok: true } };
  const approved = { ...built, verdict: { sha: SHA, ok: true } };
  const merged = { ...approved, pr: { sha: SHA, state: "MERGED" } };
  const uiRows = [
    ["a change under apps/ui/: its preview is built before anything is pushed", job(ui), { kind: "preview" }],
    ["a ui ticket type whose change is under apps/ui/: the same", job(ui, { visual: true }), { kind: "preview" }],
    ["a preview for an older commit does not count", job({ ...ui, preview: { sha: OLD, ok: true } }), { kind: "preview" }],
    ["UI code is reviewed by security before its preview, whatever the scripted check said", job(unreviewed), { kind: "run", role: "security", at: SHA, since: BASE }],
    ["a security pass for an older commit does not count", job({ ...unreviewed, security: { sha: OLD, verdict: "pass" } }), { kind: "run", role: "security", at: SHA, since: BASE }],
    ["approved: publish", job(approved), { kind: "publish" }],
    ["approved, open: its checks", job({ ...approved, pr: open.pr }), { kind: "ci" }],
    ["approved and green: merge, with no second verdict", job({ ...approved, pr: open.pr, ci: green.ci }, { visual: true }), { kind: "merge" }],
    ["declined: the developer runs again with the note", job({ ...built, verdict: { sha: SHA, ok: false } }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["declined many times over: still the developer, never failed-twice", job({ ...built, verdict: { sha: SHA, ok: false } }, { declines: 5, bounces: 1 }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["a decline of an older commit does not count: the new one is verified", job({ verdict: { sha: OLD, ok: false }, preview: { sha: OLD, ok: true } }, { declines: 2 }), { kind: "run", role: "qa", mode: "verify", at: SHA, since: BASE }],
    ["a security bounce of UI code: the developer fixes it, and no preview is built", job({ ...unreviewed, security: { sha: SHA, verdict: "bounce" } }, { bounces: 1 }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["a preview that did not build: back to the developer as a failed check", job({ ...ui, preview: { sha: SHA, ok: false } }, { bounces: 1 }), { kind: "run", role: "developer", at: SHA, since: BASE, fix: true }],
    ["merged: the change goes live", job(merged), { kind: "go-live" }],
    ["merged and live: resolve the ticket", job({ ...merged, live: { sha: SHA, state: "live", release: OLD } }), { kind: "resolve" }],
    ["a go-live for an older commit does not count", job({ ...merged, live: { sha: OLD, state: "live", release: OLD } }), { kind: "go-live" }],
    ["merged with nothing under apps/ui/: no release, resolve", job({ ...passed, pr: { sha: SHA, state: "MERGED" } }, { visual: true }), { kind: "resolve" }],
  ];
  for (const [name, input, want] of uiRows) test(name, () => assert.deepEqual(nextStep(input), want));

  const uiPauses = [
    ["a built preview with no verdict", job(built), "visual-verdict"],
    ["a verdict for an older commit", job({ ...built, verdict: { sha: OLD, ok: true } }), "visual-verdict"],
    ["a preview that did not build, the second failed check", job({ ...ui, preview: { sha: SHA, ok: false } }, { bounces: MAX_BOUNCES }), "failed-twice"],
    ["red checks after the approval: nothing is merged and nothing goes live", job({ ...approved, pr: open.pr, ci: { sha: SHA, state: "red", failed: ["test"] } }), "ci-red"],
    ["a guardrail path with a ui change: the merge is the user's", job({ ...approved, risk: riskOf({ ui: true, security: true, userMerge: true }), pr: open.pr, ci: green.ci }), "guardrail"],
    ["a merged commit the running bridge is behind", job({ ...merged, live: { sha: SHA, state: "needs-update", reason: "the merged commit changes apps/bridge" } }), "needs-update"],
    ["a go-live build that failed", job({ ...merged, live: { sha: SHA, state: "failed", reason: "the build failed (exit 1)" } }), "go-live-failed"],
  ];
  for (const [name, input, kind] of [...uiPauses]) {
    test(`pauses for ${name}`, () => {
      const step = nextStep(input);
      assert.equal(step.kind, "pause");
      assert.equal(step.pause, kind);
      assert.ok(step.reason && step.next, "a pause says why and what to do next");
    });
  }
  test("two declines then a pass does not pause as failed-twice", () => {
    const after = job({ ...approved }, { declines: 2, bounces: 0 });
    assert.deepEqual(nextStep(after), { kind: "publish" });
    assert.notEqual(nextStep(job(built, { declines: MAX_BOUNCES + 3 })).pause, "failed-twice");
  });

  for (const [name, input, kind] of pauses) {
    test(`pauses for ${name}`, () => {
      const step = nextStep(input);
      assert.equal(step.kind, "pause");
      assert.equal(step.pause, kind);
      assert.ok(step.reason && step.next, "a pause says why and what to do next");
    });
  }

  test("every missing or stale prerequisite keeps the merge away", () => {
    for (const key of ["qa", "risk", "pr", "ci"]) {
      const without = { ...green, [key]: undefined };
      const stale = { ...green, [key]: { ...green[key], sha: OLD } };
      assert.notEqual(nextStep(job(without)).kind, "merge", `without ${key}`);
      assert.notEqual(nextStep(job(stale)).kind, "merge", `with ${key} for another commit`);
    }
  });

  test("the paths whose change the user merges: the guardrails, the bridge, the checks and the manifest", () => {
    for (const p of [".claude/agents/developer.md", ".github/workflows/ci.yml", "apps/bridge/cells/host.mjs", "apps/bridge/delivery/plan.mjs", "apps/bridge/cells/governance.json", "scripts/risk-check.mjs", "package.json"]) assert.equal(isUserMergePath(p), true, p);
    for (const p of ["apps/ui/src/App.jsx", "docs/adr/0001.md", "apps/bridgework/x.mjs", "apps/ui/package.json", "apps/ui/.eslintrc", "CONTEXT.md", "packages/board-refs/index.mjs"]) assert.equal(isUserMergePath(p), false, p);
    // What runs by itself on the user's machine or on the git host, the board and gate code, and every root dot path.
    for (const p of ["scripts/session-start.mjs", "scripts/hooks/bash-guard.mjs", "scripts/metrics.mjs", "apps/organism-infra/board-service.mjs", "apps/ci-cd/smoke.mjs", "mods/queue/hooks.mjs", "CLAUDE.md", "AGENTS.md", "skills-lock.json", ".gitattributes", ".gitmodules", ".npmrc", ".mcp.json", ".agents/skills/tdd/SKILL.md", ".cursor/settings.json", ".codex/config.toml", ".claude-plugin/plugin.json", ".gitleaks.toml"]) assert.equal(isUserMergePath(p), true, p);
    for (const p of [".github/workflows/ci.yml", ".github/actions/setup/action.yml", ".github/CODEOWNERS"]) assert.deepEqual([isCiPath(p), isUserMergePath(p)], [true, true], p);
    for (const p of ["apps/bridge/cells/host.mjs", "package-lock.json"]) assert.deepEqual([isCiPath(p), isUserMergePath(p)], [false, true], p);
  });
});

describe("a reviewer's verdict and the step prompts", () => {
  test("the verdict is the last verdict line, whatever dresses it", () => {
    assert.equal(readVerdict("All good.\nVERDICT: pass"), "pass");
    assert.equal(readVerdict("**VERDICT: bounce**\n"), "bounce");
    assert.equal(readVerdict("VERDICT: pass\nOn reflection:\n- `VERDICT: bounce`"), "bounce");
    assert.equal(readVerdict("I would say the verdict: pass is likely"), null);
    assert.equal(readVerdict("VERDICT: maybe"), null);
    assert.equal(readVerdict(null), null);
  });

  test("a prompt names the ticket file and the commit, tells the agent the bridge does the board and the push, and asks a reviewer for a verdict line", () => {
    const dev = deliveryPrompt({ role: "developer", ref: "fx/08-plain", ticketFile: "/r/.scratch/fx/issues/08-plain.md", since: BASE });
    assert.match(dev, /developer cell for ticket fx\/08-plain/);
    assert.match(dev, /Run no board command, and do not push/);
    assert.match(dev, /\/r\/\.scratch\/fx\/issues\/08-plain\.md/);
    assert.doesNotMatch(dev, /findings\.md|VERDICT/);
    assert.match(deliveryPrompt({ role: "developer", ref: "fx/08-plain", ticketFile: "/t.md", since: BASE, fix: true }), /read \.den\/findings\.md first/);
    const qa = deliveryPrompt({ role: "qa", mode: "verify", ref: "fx/08-plain", ticketFile: "/t.md", since: BASE });
    assert.match(qa, /qa cell in verify mode/);
    assert.match(qa, new RegExp(`git diff ${BASE}\\.\\.HEAD`));
    assert.match(qa, /`VERDICT: pass` or `VERDICT: bounce`/);
    assert.match(deliveryPrompt({ role: "security", ref: "fx/08-plain", ticketFile: "/t.md", since: BASE }), /for security/);
  });
});

describe("the delivery log", () => {
  const record = (more = {}) => ({
    id: "d-0123456789abcdef", ref: "fx/08-plain", title: "08: Plain", type: "feature", state: "running", base: BASE, branch: BRANCH, startedAt: "2026-10-13T00:00:00.000Z",
    candidate: { sha: SHA, runId: RUN }, evidence: { qa: { sha: SHA, runId: RUN, verdict: "pass" } }, bounces: 1, live: { runId: RUN, role: "qa", mode: "verify" }, claimed: true, runs: [], ...more,
  });

  test("a record reads back with its checked fields, and nothing the git host said is kept as evidence", () => {
    const job = validateJob(record({ evidence: { qa: { sha: SHA, runId: RUN, verdict: "pass" }, pr: { sha: SHA, state: "MERGED" }, ci: { sha: SHA, state: "green" } }, evil: "rm -rf" }));
    assert.equal(job.evil, undefined);
    assert.deepEqual(job.evidence.qa, { sha: SHA, runId: RUN, verdict: "pass" });
    assert.equal(job.evidence.pr, null, "the pull request is asked for again");
    assert.equal(job.evidence.ci, null, "the checks are asked for again");
    assert.deepEqual(job.live, { runId: RUN, role: "qa", mode: "verify" });
  });

  test("a line with a bad id, ref, commit or branch is dropped or cut down, never copied", () => {
    assert.equal(validateJob(record({ id: "d-1; rm" })), null);
    assert.equal(validateJob(record({ ref: "../etc/passwd" })), null);
    assert.equal(validateJob(record({ base: "main" })), null);
    assert.equal(validateJob(record({ branch: "main" })).branch, null);
    assert.equal(validateJob(record({ candidate: { sha: "HEAD" } })).candidate, null);
    assert.equal(validateJob(record({ evidence: { qa: { sha: SHA, runId: RUN, verdict: "approved by root" } } })).evidence.qa, null);
    assert.equal(validateJob(record({ state: "paused", pause: { kind: "x", reason: "a‮b\nc" } })).pause.reason, "a b c");
  });

  test("an operation with an intent and no outcome leaves the job uncertain; one that finished does not", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-joblog-"));
    try {
      const log = createJobLog(dir);
      await log.save(record());
      await log.op("d-0123456789abcdef", "push", "intent", { sha: SHA });
      await log.op("d-0123456789abcdef", "push", "done", { sha: SHA });
      assert.equal((await log.replay())[0].uncertain, undefined);
      await log.op("d-0123456789abcdef", "merge", "intent", { sha: SHA });
      await writeFile(log.file, (await readFile(log.file, "utf8")) + "not json\n{\"job\":{\"id\":\"nope\"}}\n");
      const [job, ...rest] = await createJobLog(dir).replay();
      assert.equal(rest.length, 0);
      assert.equal(job.uncertain, "merge");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("the git-host operations", () => {
  function host(answers = {}) {
    const calls = [];
    const exec = async (file, args) => {
      calls.push([file, ...args]);
      const key = Object.keys(answers).find((k) => `${file} ${args.join(" ")}`.includes(k));
      const answer = key ? answers[key] : "";
      if (answer instanceof Error) throw answer;
      return { stdout: typeof answer === "string" ? answer : JSON.stringify(answer), stderr: "" };
    };
    return { calls, git: createGitHost("/repo", { exec, waitMs: 1, riskScript: "/nonexistent/risk-check.mjs" }) };
  }

  test("each operation is one fixed argument list over checked values", async () => {
    const t = host({ "pr list": [{ number: 9, url: "https://github.com/o/r/pull/9", state: "OPEN", headRefOid: SHA }], "rev-parse": `${SHA}\n` });
    assert.equal(await t.git.mainSha(), SHA);
    await t.git.push({ branch: BRANCH, sha: SHA });
    assert.deepEqual(await t.git.findPr({ branch: BRANCH }), { number: 9, url: "https://github.com/o/r/pull/9", state: "OPEN", sha: SHA });
    await t.git.openPr({ branch: BRANCH, title: "fx/08: a\ntitle", body: "body" });
    await t.git.merge({ number: 9, sha: SHA });
    assert.deepEqual(t.calls, [
      ["git", "-C", "/repo", "fetch", "--quiet", "origin", "main"],
      ["git", "-C", "/repo", "rev-parse", "--verify", "refs/remotes/origin/main^{commit}"],
      ["git", "-C", "/repo", "push", "--porcelain", "origin", `${SHA}:refs/heads/${BRANCH}`],
      ["gh", "pr", "list", "--head", BRANCH, "--state", "all", "--limit", "10", "--json", "number,url,state,headRefOid"],
      ["gh", "pr", "create", "--head", BRANCH, "--base", "main", "--title", "fx/08: a title", "--body", "body"],
      ["gh", "pr", "merge", "9", "--merge", "--match-head-commit", SHA],
    ]);
  });

  test("a value that is not a commit id, a den branch or a number reaches no command", async () => {
    const t = host();
    await assert.rejects(t.git.push({ branch: "main", sha: SHA }), /not a den branch/);
    await assert.rejects(t.git.push({ branch: BRANCH, sha: "HEAD; rm -rf /" }), /full commit id/);
    await assert.rejects(t.git.push({ branch: `${BRANCH} --force`, sha: SHA }), /not a den branch/);
    await assert.rejects(t.git.merge({ number: "9 --admin", sha: SHA }), /pull request number/);
    await assert.rejects(t.git.changed({ base: "--output=/tmp/x", sha: SHA }), /full commit id/);
    assert.deepEqual(t.calls, []);
  });

  test("a pull request's state is read into the few values the runner uses", async () => {
    const t = host({ "pr view": { number: 9, url: "https://github.com/o/r/pull/9", state: "OPEN", headRefOid: SHA, mergeable: "MERGEABLE", statusCheckRollup: [
      { __typename: "CheckRun", name: "test", status: "COMPLETED", conclusion: "SUCCESS" }, { __typename: "CheckRun", name: "lint", status: "IN_PROGRESS", conclusion: "" },
      { __typename: "StatusContext", context: "ci/x", state: "FAILURE" },
    ] } });
    const st = await t.git.prState({ number: 9 });
    assert.deepEqual(st.checks, [{ name: "test", done: true, ok: true }, { name: "lint", done: false, ok: false }, { name: "ci/x", done: true, ok: false }]);
    assert.equal(st.mergeable, "MERGEABLE");
    assert.equal(st.sha, SHA);
  });

  test("a secret in an added line is seen; a removed one is not; with no risk script every change goes to security", async () => {
    const key = ["AKIA", "IOSFODNN7", "EXAMPLE"].join("");
    assert.equal(await host({ "log --format": `+++ b/x\n+const k = "${key}";\n` }).git.addsSecret({ base: BASE, sha: SHA }), true);
    assert.equal(await host({ "log --format": `--- a/x\n-const k = "${key}";\n+const k = env.KEY;\n` }).git.addsSecret({ base: BASE, sha: SHA }), false);
    assert.equal((await host().git.risk({ base: BASE, sha: SHA })).clean, false);
  });

  test("in a real repository, a file moved out of the bridge is listed under the path it left", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-githost-"));
    try {
      const git = (...args) => execFileSync("git", ["-C", dir, "-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8" }).trim();
      git("init", "-q", "-b", "main");
      mkdirSync(path.join(dir, "apps", "bridge"), { recursive: true });
      writeFileSync(path.join(dir, "apps", "bridge", "wall.mjs"), "export const wall = 1;\n".repeat(20));
      git("add", "-A");
      git("commit", "-q", "-m", "one");
      const base = git("rev-parse", "HEAD");
      mkdirSync(path.join(dir, "lib"));
      git("mv", "apps/bridge/wall.mjs", "lib/wall.mjs");
      git("commit", "-q", "-m", "move");
      const sha = git("rev-parse", "HEAD");
      assert.equal(await createGitHost(dir).descends({ base, sha }), true);
      assert.equal(await createGitHost(dir).descends({ base: sha, sha: base }), false, "a commit that is not built on the base");
      const files = await createGitHost(dir).changed({ base, sha });
      assert.deepEqual(files.sort(), ["apps/bridge/wall.mjs", "lib/wall.mjs"]);
      assert.equal(files.some(isUserMergePath), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("in a real repository, every commit that would be pushed is read for a secret, binary files and file names included", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "den-githost-"));
    try {
      const git = (...args) => execFileSync("git", ["-C", dir, "-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8" }).trim();
      const key = ["AKIA", "IOSFODNN7", "EXAMPLE"].join("");
      const commitAll = (message) => (git("add", "-A"), git("commit", "-q", "-m", message), git("rev-parse", "HEAD"));
      git("init", "-q", "-b", "main");
      writeFileSync(path.join(dir, "a.mjs"), "export const a = 1;\n");
      const base = commitAll("one");
      const host = createGitHost(dir);

      writeFileSync(path.join(dir, "a.mjs"), "export const a = 2;\n");
      writeFileSync(path.join(dir, ".env.example"), "KEY=\n");
      assert.equal(await host.addsSecret({ base, sha: commitAll("a clean change") }), false);

      writeFileSync(path.join(dir, "k.mjs"), `export const k = "${key}";\n`);
      commitAll("a key");
      writeFileSync(path.join(dir, "k.mjs"), "export const k = process.env.K;\n");
      const removed = commitAll("the key is taken out again");
      assert.equal(git("diff", base, removed).includes(key), false, "the two ends do not show it");
      assert.equal(await host.addsSecret({ base, sha: removed }), true, "a secret added and then removed is still pushed");

      git("checkout", "-q", "-b", "binary", base);
      writeFileSync(path.join(dir, "blob.bin"), Buffer.concat([Buffer.alloc(16), Buffer.from(`\nkey=${key}\n`)]));
      assert.equal(await host.addsSecret({ base, sha: commitAll("a file git calls binary") }), true);

      for (const name of [".env", "deploy.pem", path.join("keys", "id_ed25519")]) {
        git("checkout", "-q", "-B", "named", base);
        mkdirSync(path.join(dir, path.dirname(name)), { recursive: true });
        writeFileSync(path.join(dir, name), "x\n");
        assert.equal(await host.addsSecret({ base, sha: commitAll("a file named like a secret") }), true, name);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("waiting for checks ends when the watch ends, and waits a little for checks that are not registered yet", async () => {
    let tries = 0;
    const exec = async () => {
      tries += 1;
      if (tries < 3) throw Object.assign(new Error("x"), { stderr: "no checks reported on the 'den/x' branch" });
      return { stdout: "", stderr: "" };
    };
    await createGitHost("/repo", { exec, waitMs: 1 }).waitChecks({ number: 9 });
    assert.equal(tries, 3);
    let failed = 0;
    await createGitHost("/repo", { exec: async () => { failed += 1; throw Object.assign(new Error("x"), { stderr: "some checks failed" }); }, waitMs: 1 }).waitChecks({ number: 9 });
    assert.equal(failed, 1, "a red check ends the wait; prState says what it showed");
  });
});
