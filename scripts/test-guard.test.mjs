// den-mvp/70: the test-tamper guard. Each case is a fixture repository: a base commit, a head commit, and the guard run
// over base...head. A weakening diff is flagged; the clean twin of it is not.
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { testGuard } from "./test-guard.mjs";

const SCRIPT = fileURLToPath(new URL("./test-guard.mjs", import.meta.url));
const roots = [];
afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=fx", "-c", "user.email=fx@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { cwd, encoding: "utf8" }).trim();

// A repository whose base commit holds `before` and whose head commit holds `after` (a null value deletes the file).
function fixture(before, after, parent = os.tmpdir()) {
  const root = (mkdirSync(parent, { recursive: true }), mkdtempSync(path.join(parent, "test-guard-")));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  const write = (files) => {
    for (const [file, text] of Object.entries(files)) {
      if (text === null) rmSync(path.join(root, file), { force: true });
      else (mkdirSync(path.dirname(path.join(root, file)), { recursive: true }), writeFileSync(path.join(root, file), text));
    }
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "x");
  };
  write(before);
  git(root, "branch", "base");
  write(after);
  return root;
}
const reasons = (root, opts = {}) => testGuard({ range: "base...HEAD", cwd: root, rerun: false, ...opts }).hits.map((h) => `${h.file}: ${h.reason}`);
const flagged = (hits, re) => assert.ok(hits.some((h) => re.test(h)), `expected a hit matching ${re}, got ${JSON.stringify(hits)}`);

const T = (body) => `import { test } from "node:test";\nimport assert from "node:assert/strict";\n${body}`;
const SRC = "export const add = (a, b) => a + b;\n";

describe("a weakening diff is flagged", () => {
  test("a deleted test file", () => {
    const root = fixture({ "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n'), "a.mjs": SRC }, { "a.test.mjs": null });
    flagged(reasons(root), /^a\.test\.mjs: test file deleted/);
  });

  test("a test file renamed to a name that is not a test", () => {
    const body = T('test("adds", () => { assert.strictEqual(1, 1); });\n');
    const root = fixture({ "a.test.mjs": body }, { "a.test.mjs": null, "a.check.mjs": body });
    flagged(reasons(root), /a\.test\.mjs: test file renamed away/);
  });

  test("a test removed", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\ntest("subtracts", () => { assert.strictEqual(2, 2); });\n') },
      { "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: test removed or renamed away: "subtracts"/);
  });

  test("a test renamed away", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') },
      { "a.test.mjs": T('test("sums", () => { assert.strictEqual(1, 1); });\n') },
    );
    flagged(reasons(root), /"adds"/);
  });

  for (const [name, line] of [
    ["test.skip", 'test.skip("adds", () => { assert.strictEqual(1, 1); });'],
    ["describe.only", 'test.only("adds", () => { assert.strictEqual(1, 1); });'],
    ["test.todo", 'test.todo("adds", () => { assert.strictEqual(1, 1); });'],
    ["a skip option", 'test("adds", { skip: true }, () => { assert.strictEqual(1, 1); });'],
    ["a todo option", 'test("adds", { todo: "later" }, () => { assert.strictEqual(1, 1); });'],
    ["t.skip()", 'test("adds", (t) => { t.skip("later"); assert.strictEqual(1, 1); });'],
  ]) {
    test(`an added ${name}`, () => {
      const root = fixture({ "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') }, { "a.test.mjs": T(`${line}\n`) });
      flagged(reasons(root), /a\.test\.mjs: skip, todo or only added/);
    });
  }

  test("an early return in a test", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => {\n  assert.strictEqual(1, 1);\n});\n') },
      { "a.test.mjs": T('test("adds", () => {\n  return;\n  assert.strictEqual(1, 1);\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: early return added/);
  });

  test("strictEqual loosened to ok", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => {\n  assert.strictEqual(add(1, 2), 3);\n});\n') },
      { "a.test.mjs": T('test("adds", () => {\n  assert.ok(add(1, 2));\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: assertion loosened \(strict to ok\)/);
  });

  test("an assertion removed", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => {\n  assert.strictEqual(add(1, 2), 3);\n  assert.strictEqual(add(2, 2), 4);\n});\n') },
      { "a.test.mjs": T('test("adds", () => {\n  assert.strictEqual(add(1, 2), 3);\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: assertion removed/);
  });

  test("a regex widened", () => {
    const root = fixture(
      { "a.test.mjs": T('test("says", () => {\n  assert.match(say(), /^hello world$/);\n});\n') },
      { "a.test.mjs": T('test("says", () => {\n  assert.match(say(), /hello.*/i);\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: regex widened/);
  });

  test("a tolerance widened", () => {
    const root = fixture(
      { "a.test.mjs": T('test("near", () => {\n  assert.ok(Math.abs(a - b) < 0.01);\n});\n') },
      { "a.test.mjs": T('test("near", () => {\n  assert.ok(Math.abs(a - b) < 5);\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: tolerance widened/);
  });

  // The repo's dominant assertion is assert.equal (node:assert/strict), so loosening must be seen beyond strictEqual.
  for (const [name, was, now] of [
    ["equal to ok(true)", "assert.equal(add(1, 2), 3);", "assert.ok(true);"],
    ["deepEqual to ok(x)", "assert.deepEqual(list(), [1]);", "assert.ok(list());"],
    ["match to ok(true)", "assert.match(say(), /^hi$/);", "assert.ok(true);"],
    ["notEqual to ok(1)", "assert.notEqual(add(1, 2), 4);", "assert.ok(1);"],
    ["throws to a bare assert(x)", "assert.throws(() => boom(), /bad/);", "assert(boom);"],
    ["rejects to ok(true)", "await assert.rejects(boom());", "assert.ok(true);"],
    ["t.assert.equal to t.assert.ok(true)", "t.assert.equal(add(1, 2), 3);", "t.assert.ok(true);"],
    ["ok(x) to ok(true)", "assert.ok(add(1, 2) === 3);", "assert.ok(true);"],
    ["strictEqual to equal", "assert.strictEqual(add(1, 2), 3);", "assert.equal(add(1, 2), 3);"],
  ]) {
    test(`${name} is loosened`, () => {
      const root = fixture({ "a.test.mjs": T(`test("adds", async (t) => {\n  ${was}\n});\n`) }, { "a.test.mjs": T(`test("adds", async (t) => {\n  ${now}\n});\n`) });
      flagged(reasons(root), /a\.test\.mjs: assertion loosened \(/);
    });
  }

  test("a test commented out line by line", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\ntest("subtracts", () => { assert.equal(2, 2); });\n') },
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\n// test("subtracts", () => { assert.equal(2, 2); });\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: test removed or renamed away: "subtracts"/);
  });

  test("a test commented out in a block", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\ntest("subtracts", () => {\n  assert.equal(2, 2);\n});\n') },
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\n/*\ntest("subtracts", () => {\n  assert.equal(2, 2);\n});\n*/\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: test removed or renamed away: "subtracts"/);
  });

  test("an assertion commented out", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => {\n  assert.equal(add(1, 2), 3);\n  assert.equal(add(2, 2), 4);\n});\n') },
      { "a.test.mjs": T('test("adds", () => {\n  assert.equal(add(1, 2), 3);\n  // assert.equal(add(2, 2), 4);\n});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: assertion/);
  });

  test("a one-line test with its body emptied", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.equal(add(1, 2), 3); });\n') },
      { "a.test.mjs": T('test("adds", () => {});\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: assertion count dropped in "adds" \(1 to 0\)/);
  });

  test("a test that lost one of its assertions to a line elsewhere", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); assert.equal(2, 2); });\ntest("subs", () => { assert.equal(3, 3); });\n') },
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\ntest("subs", () => { assert.equal(3, 3); assert.equal(2, 2); });\n') },
    );
    flagged(reasons(root), /a\.test\.mjs: assertion count dropped in "adds" \(2 to 1\)/);
  });
});

describe("a clean diff passes", () => {
  test("assertions kept or strengthened across the assert family", () => {
    const root = fixture(
      { "a.test.mjs": T('test("t", () => {\n  assert.equal(add(1, 2), 3);\n  assert.deepEqual(list(), [1]);\n  assert.ok(list());\n  assert.throws(() => boom());\n});\n') },
      { "a.test.mjs": T('test("t", () => {\n  assert.strictEqual(add(1, 2), 3);\n  assert.deepStrictEqual(list(), [1]);\n  assert.equal(list().length, 1);\n  assert.throws(() => boom(), /bad/);\n});\n') },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("an equal assertion given another expected value", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => {\n  assert.equal(add(1, 2), 4);\n});\n') },
      { "a.test.mjs": T('test("adds", () => {\n  assert.equal(add(1, 2), 3);\n});\n') },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("comments added, edited and removed around the tests", () => {
    const root = fixture(
      { "a.test.mjs": T('// test("old", () => {});\n/* assert.equal(1, 1); */\ntest("adds", () => {\n  assert.equal(add(1, 2), 3); // was 4\n});\n') },
      { "a.test.mjs": T('// a note about test("new", ...)\ntest("adds", () => {\n  // adds small numbers\n  assert.equal(add(1, 2), 3);\n});\n') },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("a test inserted ahead of assertions that sit outside any test", () => {
    const rows = 'for (const [a, b] of [[1, 2]]) {\n  assert.equal(add(a, a), b);\n}\n';
    const root = fixture(
      { "a.test.mjs": T(`test("adds", () => {\n  assert.equal(add(1, 2), 3);\n});\n${rows}`) },
      { "a.test.mjs": T(`test("adds", () => {\n  assert.equal(add(1, 2), 3);\n});\ntest("subs", () => {\n  assert.equal(sub(2, 1), 1);\n});\n${rows}`) },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("a test body that gains assertions", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); });\n') },
      { "a.test.mjs": T('test("adds", () => { assert.equal(1, 1); assert.equal(2, 2); });\n') },
    );
    assert.deepEqual(reasons(root), []);
  });
  test("a source change with no test touched", () => {
    const root = fixture({ "a.mjs": SRC, "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') }, { "a.mjs": `${SRC}// more\n` });
    assert.deepEqual(reasons(root), []);
  });

  test("a new test with its assertions", () => {
    const root = fixture(
      { "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') },
      { "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\ntest("subtracts", () => { assert.strictEqual(2, 2); assert.deepStrictEqual([1], [1]); });\n') },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("an assertion made stricter, a regex narrowed, a tolerance tightened", () => {
    const root = fixture(
      { "a.test.mjs": T('test("t", () => {\n  assert.ok(add(1, 2) === 3);\n  assert.match(say(), /hello.*/i);\n  assert.ok(Math.abs(a - b) < 5);\n});\n') },
      { "a.test.mjs": T('test("t", () => {\n  assert.strictEqual(add(1, 2), 3);\n  assert.match(say(), /^hello world$/);\n  assert.ok(Math.abs(a - b) < 0.01);\n});\n') },
    );
    assert.deepEqual(reasons(root), []);
  });

  test("a test file renamed to another test name", () => {
    const body = T('test("one", () => { assert.strictEqual(1, 1); });\ntest("two", () => { assert.strictEqual(2, 2); });\n');
    const root = fixture({ "a.test.mjs": body }, { "a.test.mjs": null, "b.test.mjs": body });
    assert.deepEqual(reasons(root), []);
  });

  test("a test moved within its file", () => {
    const one = 'test("one", () => { assert.strictEqual(1, 1); });\n';
    const two = 'test("two", () => { assert.strictEqual(2, 2); });\n';
    const root = fixture({ "a.test.mjs": T(one + two) }, { "a.test.mjs": T(two + one) });
    assert.deepEqual(reasons(root), []);
  });

  test("a source file whose name or content mentions skip is not a test", () => {
    const root = fixture({ "a.mjs": SRC }, { "a.mjs": `${SRC}export const skip = (x) => x.skip(); const only = 1;\n` });
    assert.deepEqual(reasons(root), []);
  });
});

// The can't-fail check runs the head's changed test files on the merge base.
describe("a new test that passes on the merge base", () => {
  const before = { "add.mjs": "export const add = (a, b) => a + b;\n", "add.test.mjs": T('import { add } from "./add.mjs";\ntest("adds", () => { assert.strictEqual(add(1, 2), 3); });\n') };
  const withNew = (extra) => ({ ...before, "add.test.mjs": before["add.test.mjs"] + extra });

  test("is flagged as can't fail", () => {
    // `add` already works at the base, so a new test of it asserts nothing the change made true.
    const root = fixture(before, withNew('test("adds zero", () => { assert.strictEqual(add(0, 0), 0); });\n'));
    const hits = reasons(root, { rerun: true, box: "never" });
    flagged(hits, /add\.test\.mjs: can't fail: "adds zero" passes on the merge base/);
    assert.equal(hits.some((h) => /"adds"/.test(h)), false, "the test that was already there is not new");
  });

  test("is not flagged when it fails there", () => {
    const root = fixture(before, { ...withNew('import { sub } from "./add.mjs";\ntest("subtracts", () => { assert.strictEqual(sub(3, 1), 2); });\n'), "add.mjs": "export const add = (a, b) => a + b;\nexport const sub = (a, b) => a - b;\n" });
    assert.deepEqual(reasons(root, { rerun: true, box: "never" }), []);
  });

  test("a new test file that cannot load on the merge base is not flagged", () => {
    const root = fixture(before, { "new.test.mjs": T('import { nope } from "./nope.mjs";\ntest("n", () => { assert.ok(nope); });\n'), "nope.mjs": "export const nope = 1;\n" });
    assert.deepEqual(reasons(root, { rerun: true, box: "never" }), []);
  });

  test("leaves no worktree behind, and the checkout is untouched", () => {
    const root = fixture(before, withNew('test("adds zero", () => { assert.strictEqual(add(0, 0), 0); });\n'));
    reasons(root, { rerun: true, box: "never" });
    assert.equal(git(root, "worktree", "list", "--porcelain").split("\n").filter((l) => l.startsWith("worktree ")).length, 1);
    assert.deepEqual(readdirSync(root).filter((f) => !f.startsWith(".")).sort(), ["add.mjs", "add.test.mjs"]);
  });

  test("a rerun that runs past its limit is a hit, not a hang", () => {
    const hang = ('test("hangs", async () => { await new Promise(() => setInterval(() => {}, 1000)); });\n');
    const root = fixture(before, { ...before, "add.test.mjs": before["add.test.mjs"] + hang });
    const started = Date.now();
    flagged(reasons(root, { rerun: true, box: "never", timeoutSec: 2 }), /can't-fail check did not finish/);
    assert.ok(Date.now() - started < 20000);
  });

  test("with box required and no bubblewrap, the check says it did not run", () => {
    const root = fixture(before, withNew('test("adds zero", () => { assert.strictEqual(add(0, 0), 0); });\n'));
    flagged(reasons(root, { rerun: true, box: "require", bwrap: null }), /can't-fail check not run: no bubblewrap/);
  });

  const boxWorks = (() => {
    const r = spawnSync("bwrap", ["--unshare-all", "--ro-bind", "/", "/", "true"], { stdio: "ignore" });
    return r.status === 0;
  })();
  test("runs boxed when bubblewrap works", { skip: !boxWorks && "no working bubblewrap here" }, () => {
    const root = fixture(before, withNew('test("adds zero", () => { assert.strictEqual(add(0, 0), 0); });\n'), path.join(os.homedir(), ".cache", "test-guard-fixtures"));  // the box has its own /tmp, so a fixture under /tmp would be hidden
    flagged(reasons(root, { rerun: true, box: "require" }), /can't fail: "adds zero"/);
    assert.equal(existsSync(path.join(root, ".claude", "worktrees")) ? readdirSync(path.join(root, ".claude", "worktrees")).length : 0, 0);
  });
});

describe("the script", () => {
  const run = (root, ...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: "utf8" });

  test("exits 1 and prints file: reason for a hit", () => {
    const root = fixture({ "a.test.mjs": T('test("adds", () => { assert.strictEqual(1, 1); });\n') }, { "a.test.mjs": null });
    const r = run(root, "base...HEAD", "--no-rerun");
    assert.equal(r.status, 1);
    assert.match(r.stdout, /^test-guard: 1 hit\(s\) on base\.\.\.HEAD/);
    assert.match(r.stdout, /^a\.test\.mjs: test file deleted/m);
  });

  test("exits 0 and says clean for a clean diff", () => {
    const root = fixture({ "a.mjs": SRC }, { "a.mjs": `${SRC}// x\n` });
    const r = run(root, "base...HEAD");
    assert.equal(r.status, 0);
    assert.match(r.stdout, /test-guard: clean/);
  });

  test("refuses a range that looks like an option", () => {
    const root = fixture({ "a.mjs": SRC }, { "a.mjs": `${SRC}// x\n` });
    const r = run(root, "--output=/tmp/x");
    assert.equal(r.status, 2);
    assert.match(r.stderr, /option-shaped/);
  });
});
