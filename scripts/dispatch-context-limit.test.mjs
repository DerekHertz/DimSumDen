// organism-infra/97: dispatch-context must stay inside jg's resource limit on the full repo root.
// Found by the 96 developer: jg on the whole repo prints "discovery incomplete" with Issue "resource_limit": 1 and exits
// non-zero, so every run fell back jg-exit-1. jg on a subtree succeeds. The fix is the developer's to choose (narrow the
// search root to a subtree, such as the directory of a path the ticket names, or pass a supported limit); these tests pin
// only what a caller can see.
//
//   AC1 (a live run against this repo returns a non-null path, no fallback): human-verified. Recorded in the developer's
//       handoff, not tested here, because it needs the real jg and the user's key.
//   AC2 (when jg still fails, the run falls back exactly as before, exit 0, a named fallback): tests tagged [97] AC2.
//   AC3 (secret scan and size gate unchanged): the existing dispatch-context.test.mjs stays green, plus the [97] AC3
//       tests here, which run the same gates while jg would hit its limit.
//   The "fix" tests (tagged [97] fix) stand in for AC1 at the seam: a jg that hits resource_limit whenever it is aimed at
//       the whole repo root, and succeeds when aimed at any subtree. They are red until the context step stops aiming
//       the one search at the whole root. If the developer finds the limit is a flag rather than the root size, qa
//       revises these tests with the developer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile, execFileSync, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const buildContext = async (...a) => (await import("./dispatch-context.mjs")).buildContext(...a);
const execFileP = promisify(execFile);
const SCRIPT = fileURLToPath(new URL("./dispatch-context.mjs", import.meta.url));
const tmp = (p) => mkdtempSync(path.join(realpathSync(tmpdir()), p));
const FAKE_AWS_KEY = "AKI" + "A" + "ABCDEFGHIJKLMNOP"; // built at run time so this file holds no secret-looking literal
const MB = 1024 * 1024;
const NOW = () => 1_700_000_000_000;

const LIMIT_STDERR = 'discovery incomplete\nIssue "resource_limit": 1\n';
const JG_OK = "## scripts/dispatch-context.mjs\nexcerpt a\n## apps/organism-infra/board.mjs\nexcerpt b\nEnd context.\n";

function makeRepo(files) {
  const root = tmp("dc97-repo-");
  execFileSync("git", ["init", "-q"], { cwd: root });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  execFileSync("git", ["add", "-A"], { cwd: root });
  return root;
}

// A small repo with three top-level source directories and one path the ticket can name.
const sourceRepo = () =>
  makeRepo({
    "scripts/dispatch-context.mjs": "export {};\n",
    "apps/organism-infra/board.mjs": "export {};\n",
    "docs/note.md": "note\n",
  });

const ticket = (what = "Fix the retry in scripts/dispatch-context.mjs.") =>
  `# 99: sample\n\n**Type:** bug\n\n**Priority:** P1\n\n**What to build:** ${what}\n\n**Blocked by:** none\n\n**Status:** ready-for-agent\n\n- [ ] ACCEPTANCE-CRITERION-TEXT\n\n## Comments\n\n`;

// The jg search root is the last argument (wrapper argv: --exclude ... flags... question root).
const rootArg = (args) => args[args.length - 1];

// A fake `run`: git goes to real git; jg search is answered by `search(args)`.
function fake(search) {
  const calls = [];
  const run = async (cmd, args, opts = {}) => {
    calls.push({ cmd, args, opts });
    if (cmd === "jg") return search(args, opts);
    try {
      const { stdout } = await execFileP(cmd, args, { cwd: opts.cwd, encoding: "utf8" });
      return { stdout, exitCode: 0 };
    } catch (e) {
      return { stdout: e.stdout ?? "", exitCode: typeof e.code === "number" ? e.code : 1 };
    }
  };
  return { run, searches: () => calls.filter((c) => c.cmd === "jg") };
}

const limitHit = (exitCode = 1) => ({ stdout: "", stderr: LIMIT_STDERR, exitCode });
const contentOf = (f) => (typeof f === "string" ? f : f?.content);
const build = (over) => buildContext({ ticketText: ticket(), now: NOW, ...over });

// jg's behaviour per the 96 finding: the whole root is too much, a subtree is fine.
const limitOnFullRoot = (root) => (args) => (rootArg(args) === root ? limitHit() : { stdout: JG_OK, exitCode: 0 });

// ── fix (stands in for AC1 at the seam) ──────────────────────────────────────

test("[97] fix: when jg hits resource_limit on the full root, the context step still returns a context file with no fallback", async () => {
  const root = sourceRepo();
  const f = fake(limitOnFullRoot(root));
  const { file, row } = await build({ root, run: f.run });
  assert.ok(contentOf(file), "a context file came back");
  assert.match(contentOf(file), /End context\./);
  assert.equal(row.fallback ?? null, null);
  assert.equal(row.skipped ?? null, null);
  assert.equal(row.kind, "jg");
  assert.ok(row.bytes > 0);
});

test("[97] fix: the search that succeeds is aimed at a subtree of the repo, never at .scratch/ or .claude/", async () => {
  const root = sourceRepo();
  const f = fake(limitOnFullRoot(root));
  await build({ root, run: f.run });
  const roots = f.searches().map((c) => rootArg(c.args));
  const last = roots[roots.length - 1];
  assert.notEqual(last, root, "the final search is not the whole root");
  const rel = path.relative(root, last);
  assert.ok(rel && !rel.startsWith("..") && !path.isAbsolute(rel), `the final search root ${last} lies inside the repo`);
  for (const r of roots) {
    const segs = path.relative(root, r).split(path.sep);
    assert.ok(!segs.some((s) => s.startsWith(".")), `search root ${r} is not inside a dot-directory`);
  }
});

test("[97] fix: every search call keeps the wrapper's excludes and the 24 KB output cap", async () => {
  const root = sourceRepo();
  const f = fake(limitOnFullRoot(root));
  await build({ root, run: f.run });
  assert.ok(f.searches().length >= 1);
  for (const { args, opts } of f.searches()) {
    const i = args.indexOf("--exclude");
    assert.ok(i >= 0 && args[i + 1] === ".scratch/", "--exclude .scratch/");
    assert.ok(args.includes(".claude/"), "--exclude .claude/");
    assert.equal(args[args.indexOf("--max-source-bytes") + 1], "24576");
    assert.equal(opts.timeoutMs, 90000);
  }
});

// A fake jg on PATH for the CLI: fails with the resource limit when aimed at FAKE_JG_FULL_ROOT (or always, in mode "always").
function cliEnv() {
  const bin = tmp("dc97-bin-");
  symlinkSync(process.execPath, path.join(bin, "node"));
  const log = path.join(bin, "calls.log");
  const jg = path.join(bin, "jg");
  writeFileSync(jg, `#!/usr/bin/env node
const fs = require("fs");
const argv = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(argv) + "\\n");
if (argv[0] === "files") { console.log("3 files, 1000 bytes eligible"); process.exit(0); }
const aimed = argv[argv.length - 1];
if (process.env.FAKE_JG_MODE === "always" || aimed === process.env.FAKE_JG_FULL_ROOT) {
  console.error('discovery incomplete');
  console.error('Issue "resource_limit": 1');
  process.exit(1);
}
console.log("## scripts/dispatch-context.mjs\\nexcerpt\\nEnd context.");
`);
  chmodSync(jg, 0o755);
  const searchCalls = () =>
    (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []).filter((a) => a[0] !== "files");
  return { bin, searchCalls, home: tmp("dc97-home-") };
}

function cliWorld() {
  const root = sourceRepo();
  mkdirSync(path.join(root, ".scratch", "feat-x", "issues"), { recursive: true });
  writeFileSync(path.join(root, ".scratch", "feat-x", "issues", "01-thing.md"), ticket());
  return root;
}

function cli(root, e, mode = "full-root-only") {
  const r = spawnSync(process.execPath, [SCRIPT, "--ticket", "feat-x/01-thing", "--root", root], {
    encoding: "utf8",
    timeout: 60000,
    env: { PATH: `${e.bin}:/usr/bin:/bin`, HOME: e.home, ORGANISM_ROOT: root, FAKE_JG_MODE: mode, FAKE_JG_FULL_ROOT: root },
  });
  let out = null;
  try { out = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { /* not JSON */ }
  return { status: r.status, out, stderr: r.stderr };
}

test("[97] fix: CLI with a jg that rejects the full root returns a non-null path, no fallback, and writes the context file", () => {
  const root = cliWorld();
  const e = cliEnv();
  const { status, out } = cli(root, e);
  const expected = path.join(root, ".scratch", "_context", "feat-x", "01-thing.md");
  assert.equal(status, 0);
  assert.equal(out.path, expected);
  assert.equal(out.fallback ?? null, null);
  assert.equal(out.skipped ?? null, null);
  assert.match(readFileSync(expected, "utf8"), /End context\./);
});

// ── AC2: when jg still fails, the run falls back exactly as before ───────────

for (const exitCode of [1, 2]) {
  test(`[97] AC2: jg failing on every root (resource_limit, exit ${exitCode}) writes no file and names jg-exit-${exitCode}, as before`, async () => {
    const root = sourceRepo();
    const f = fake(() => limitHit(exitCode));
    const { file, row } = await build({ root, run: f.run });
    assert.equal(file, undefined);
    assert.equal(row.fallback, `jg-exit-${exitCode}`);
    assert.equal(row.skipped ?? null, null);
    assert.equal(row.kind, "jg");
    assert.equal(row.bytes, 0);
    assert.ok(f.searches().length >= 1, "jg was tried");
  });
}

test("[97] AC2: when every attempt fails the step gives up after a bounded number of jg calls", async () => {
  const root = sourceRepo();
  const f = fake(() => limitHit());
  await build({ root, run: f.run });
  assert.ok(f.searches().length <= 5, `${f.searches().length} jg calls for a 3-directory repo`);
});

test("[97] AC2: jg not installed after the change still falls back jg-missing", async () => {
  const root = sourceRepo();
  const f = fake(() => { throw Object.assign(new Error("spawn jg ENOENT"), { code: "ENOENT" }); });
  const { file, row } = await build({ root, run: f.run });
  assert.equal(file, undefined);
  assert.equal(row.fallback, "jg-missing");
});

test("[97] AC2: a jg timeout after the change still falls back timeout", async () => {
  const root = sourceRepo();
  const f = fake(() => ({ stdout: "", exitCode: null, timedOut: true }));
  const { file, row } = await build({ root, run: f.run });
  assert.equal(file, undefined);
  assert.equal(row.fallback, "timeout");
});

test("[97] AC2: CLI with jg failing on every root exits 0, writes no context file, prints a named fallback and logs a jg row", () => {
  const root = cliWorld();
  const e = cliEnv();
  const { status, out } = cli(root, e, "always");
  assert.equal(status, 0);
  assert.equal(out.path ?? null, null);
  assert.equal(out.fallback, "jg-exit-1");
  assert.equal(existsSync(path.join(root, ".scratch", "_context", "feat-x", "01-thing.md")), false);
  const rows = readFileSync(path.join(root, ".scratch", "usage.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((r) => r.kind === "jg");
  assert.equal(rows.length, 1, "one kind:jg row for the ticket run");
  assert.equal(rows[0].ticket, "feat-x/01-thing");
  assert.equal(rows[0].fallback, "jg-exit-1");
});

// ── AC3: the secret scan and the size gate still run first and still win ─────

test("[97] AC3: a secret in an untracked, non-ignored file still falls back secret-in-root and jg is never called", async () => {
  const root = sourceRepo();
  writeFileSync(path.join(root, "scripts", "leak.env"), `AWS=${FAKE_AWS_KEY}\n`);
  const f = fake(limitOnFullRoot(root));
  const { file, row } = await build({ root, run: f.run });
  assert.equal(file, undefined);
  assert.equal(row.fallback, "secret-in-root");
  assert.equal(f.searches().length, 0, "nothing is sent to jg");
});

test("[97] AC3: over 5 MB of tracked text is still skipped with the 'root over 5 MB eligible' reason and jg is never called", async () => {
  const root = makeRepo({ "src/big.mjs": Buffer.alloc(5 * MB + 1024, "a"), "scripts/dispatch-context.mjs": "x" });
  const f = fake(limitOnFullRoot(root));
  const { file, row } = await build({ root, run: f.run });
  assert.equal(file, undefined);
  assert.equal(row.skipped, "root over 5 MB eligible");
  assert.equal(f.searches().length, 0);
});

test("[97] fix: a secret in the narrowed search's output is still refused as secret-in-output", async () => {
  const root = sourceRepo();
  const f = fake((args) => (rootArg(args) === root ? limitHit() : { stdout: `## a.mjs\nkey ${FAKE_AWS_KEY}\nEnd context.\n`, exitCode: 0 }));
  const { file, row } = await build({ root, run: f.run });
  assert.equal(file, undefined);
  assert.equal(row.fallback, "secret-in-output");
});
