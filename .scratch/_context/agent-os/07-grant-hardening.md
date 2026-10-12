Jevgrep: 14 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 1 file(s).
- "apps/bridge/cells/claude-adapter.mjs" — implementation, caller, helper; source below
- "apps/bridge/cells/grants-paths.test.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/host.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/host-task-grants.test.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/governance.json" — caller, helper; locations only
- "apps/bridge/cells/grants.test.mjs" — test, fixture, helper; source below
- "apps/bridge/server.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/claude-runtime.mjs" — caller, helper; locations only
- "scripts/exposure.mjs" — helper; locations only
- "apps/bridge/cells/host-workspace.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/routes.mjs" — helper; locations only
- "apps/bridge/cells/claude-runtime-wall.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/ceilings.test.mjs" — test, helper; locations only
- "docs/adr/0021-agent-wall-grants-and-the-bridge-as-kernel.md" — helper; locations only
End file list. Declaration locations follow source.

Source block "apps/bridge/cells/claude-adapter.mjs" lines 81-109:
```
// agent-os/02 (ADR 0021 decision 3): task grants, data in a fixed shape: { kind: "host", value: <host name> } or
// { kind: "path", value: <absolute or ~/ path of plain segments> }, at most six. Nothing else is accepted, and the error
// text never echoes a value back.
const GRANTS_MAX = 6;
const GRANT_PATH_RE = /^~?(?:\/[A-Za-z0-9._@+-]+)+$/;
export function isGrantPath(p) {
  return typeof p === "string" && GRANT_PATH_RE.test(p) && !p.split("/").some((part) => part === "." || part === "..");
}
/** The validated grants as { hosts, paths }, repeats dropped. Anything outside the fixed shape is a TypeError. */
export function parseGrants(grants) {
  const hosts = [];
  const paths = [];
  if (grants === undefined) return { hosts, paths };
  if (!isDense(grants) || grants.length > GRANTS_MAX) throw new TypeError(`grants must be a list of at most ${GRANTS_MAX} grants`);
  for (const g of grants) {
    if (!isPlainObject(g) || Object.keys(g).length !== 2 || !Object.hasOwn(g, "kind") || !Object.hasOwn(g, "value")) throw new TypeError("a grant must be { kind, value }");
    if (g.kind === "host" && isWallHost(g.value)) {
      if (!hosts.includes(g.value)) hosts.push(g.value);
    } else if (g.kind === "path" && isGrantPath(g.value)) {
      if (!paths.includes(g.value)) paths.push(g.value);
    } else {
      throw new TypeError("a grant must be a host name or an absolute (or ~/) path of plain segments");
    }
  }
  return { hosts, paths };
}

// Governed paths of the main checkout that a path grant reaches (compileCeiling's denyAbs): absolute, plain segments, an
// optional trailing /**. A grant list is at most six and the governed list at most 40 a side, so the cap is generous.
```

Source block "apps/bridge/cells/claude-adapter.mjs" lines 186-249:
```

// The governed paths (absolute, in the main checkout) that one path grant reaches: the grant itself when it is inside a governed
// directory, the governed path when the grant is above it. A grant in the agent's own worktree is left to the relative denies.
function governedUnder(grant, root, worktree) {
  if (!grant.startsWith("/") || (worktree !== undefined && covers(worktree, grant))) return [];
  const out = [];
  for (const entry of [...GOVERNANCE.guardrailPaths, ...GOVERNANCE.ciPaths]) {
    const governed = `${root}/${baseOf(entry)}`;
    if (grant === governed) out.push(`${root}/${entry}`);
    else if (covers(governed, grant)) out.push(`${grant}/**`);
    else if (covers(grant, governed)) out.push(`${root}/${entry}`);
  }
  return out;
}

/**
 * The buildClaudeArgs options for a role's ceiling plus its task grants: the wall with the ceiling's hosts and the granted
 * ones, Write and Edit allow rules for the worktree when the role writes and for each granted path, and the governance
 * denies (CI and guardrail paths, and the commands). A host brings a read limit with it. Forbid beats permit: no grant lifts
 * a deny, except that a role in governance.json's ciGrantRoles (security) drops the CI-path denies a granted path covers.
 * null for a role with no ceiling. A role that writes and gets a worktree that is not a plain absolute path is a TypeError;
 * worktree undefined leaves the write rules out (the wall stays, the Write request stays). Any grant outside the fixed shape,
 * any grant for a role that cannot write, and a path grant that contains the worktree are TypeErrors.
 */
export function compileCeiling(role, { worktree, grants, root, home } = {}) {
  const { hosts: grantHosts, paths } = parseGrants(grants);
  if (root !== undefined && !isWorktreePath(root)) throw new TypeError("compileCeiling: root must be a plain absolute path");
  if (home !== undefined && !isWorktreePath(home)) throw new TypeError("compileCeiling: home must be a plain absolute path");
  const ceiling = Object.hasOwn(CEILINGS, role) ? CEILINGS[role] : undefined;
  if (ceiling === undefined) {
    if (grantHosts.length + paths.length > 0) throw new TypeError("compileCeiling: this role takes no grants");
    return null;
  }
  if (ceiling.write === "none" && grantHosts.length + paths.length > 0) throw new TypeError("compileCeiling: this role takes no grants");
  const options = {};
  if (ceiling.write === "worktree" && worktree !== undefined) {
    if (!isWorktreePath(worktree)) throw new TypeError("compileCeiling: worktree must be a plain absolute path");
    options.worktree = worktree;
  }
  // A grant above the worktree would open the main checkout and its sibling worktrees, where the governance denies do not reach.
  if (paths.some((p) => grantContainsWorktrees(p, { root, home, worktree }))) throw new TypeError("compileCeiling: a path grant may not contain the worktree");
  const lifted = (entry) =>
    options.worktree !== undefined && GOVERNANCE.ciGrantRoles.includes(role) && paths.some((p) => p.startsWith("/") && covers(p, `${options.worktree}/${baseOf(entry)}`));
  // A path grant inside the main checkout: the governed paths it reaches are denied in absolute form. The CI exception is not
  // carried over; it is for the role's own worktree only.
  const denyAbs = root === undefined ? [] : [...new Set(paths.flatMap((g) => governedUnder(expandHome(g, home), root, worktree)))];
  const hosts = [...new Set([...ceiling.hosts, ...grantHosts])];
  return {
    wall: { hosts },
    ...options,
    forbid: { write: [...GOVERNANCE.guardrailPaths, ...GOVERNANCE.ciPaths.filter((e) => !lifted(e))], run: [...GOVERNANCE.denyRun] },
    ...(denyAbs.length === 0 ? {} : { denyAbs }),
    ...(paths.length === 0 ? {} : { writePaths: paths }),
    ...(hosts.length === 0 ? {} : { readLimit: true }),
  };
}

// ---- argv ----------------------------------------------------------------------------------

/**
 * The whole argv (no binary name) for one child. Rejects anything outside { sessionId, agent, model?, ticketFile?,
 * wall?, worktree? }. No passthrough parameter exists, so no permission-broadening flag can be constructed; ticketFile adds
 * the one Read rule above, wall adds the sandbox block above, and worktree adds Write and Edit rules for that one directory.
 */
```

Source block "apps/bridge/cells/grants-paths.test.mjs" lines 22-211:
```
  const argv = buildClaudeArgs({ sessionId: SID, agent: opts.agent ?? "developer", ...opts.compiled });
  return JSON.parse(argv[argv.indexOf("--settings") + 1]);
};
const compile = (role, grants, extra = {}) => compileCeiling(role, { worktree: WT, root: ROOT, grants, ...extra });
const path_ = (value) => ({ kind: "path", value });
const denyOf = (role, grants) => {
  const compiled = compile(role, grants);
  const s = settingsOf({ agent: role, compiled });
  return { deny: s.permissions.deny, denyWrite: s.sandbox.filesystem.denyWrite ?? [] };
};

describe("a path grant inside the main checkout meets the governance denies", () => {
  test("a grant on a governed directory is denied for Write, Edit and shell writes", () => {
    const { deny, denyWrite } = denyOf("developer", [path_(`${ROOT}/.github/workflows`)]);
    assert.ok(deny.includes(`Write(/${ROOT}/.github/workflows/**)`), JSON.stringify(deny));
    assert.ok(deny.includes(`Edit(/${ROOT}/.github/workflows/**)`));
    assert.ok(denyWrite.includes(`${ROOT}/.github/workflows`), JSON.stringify(denyWrite));
  });

  test("a grant under a governed directory is denied at the grant", () => {
    const { deny, denyWrite } = denyOf("developer", [path_(`${ROOT}/.github/workflows/sub`)]);
    assert.ok(deny.includes(`Write(/${ROOT}/.github/workflows/sub/**)`), JSON.stringify(deny));
    assert.ok(denyWrite.includes(`${ROOT}/.github/workflows/sub`));
  });

  test("a grant above a governed file denies that file", () => {
    const { deny, denyWrite } = denyOf("developer", [path_(`${ROOT}/apps/bridge`)]);
    assert.ok(deny.includes(`Write(/${ROOT}/apps/bridge/cells/ceilings.json)`), JSON.stringify(deny));
    assert.ok(deny.includes(`Edit(/${ROOT}/apps/bridge/cells/governance.json)`));
    assert.ok(denyWrite.includes(`${ROOT}/apps/bridge/cells/ceilings.json`));
  });

  test("a governed file named as the grant is denied", () => {
    const { deny } = denyOf("developer", [path_(`${ROOT}/Jenkinsfile`)]);
    assert.ok(deny.includes(`Write(/${ROOT}/Jenkinsfile)`), JSON.stringify(deny));
  });

  test("security's CI-path exception does not reach the main checkout", () => {
    const { deny } = denyOf("security", [path_(`${ROOT}/.github/workflows`)]);
    assert.ok(deny.includes(`Write(/${ROOT}/.github/workflows/**)`), JSON.stringify(deny));
  });

  test("the guardrail paths of the main checkout are denied under a grant that reaches them, for every role that takes grants", () => {
    for (const role of ["developer", "qa", "security"]) {
      const { deny } = denyOf(role, [path_(`${ROOT}/apps`)]);
      assert.ok(deny.includes(`Write(/${ROOT}/apps/bridge/cells/governance.json)`), role);
    }
  });

  test("a grant that reaches no governed path adds no main-checkout deny", () => {
    const { deny, denyWrite } = denyOf("developer", [path_(`${ROOT}/docs/notes`), path_("/srv/shared")]);
    assert.equal(deny.some((r) => r.includes(`/${ROOT}`) && !r.includes(WT)), false, JSON.stringify(deny));
    assert.equal(denyWrite.some((p) => p.startsWith(ROOT) && !p.startsWith(WT)), false);
  });

  test("a grant inside the agent's own worktree adds no main-checkout deny", () => {
    const { deny } = denyOf("developer", [path_(`${WT}/src`)]);
    assert.equal(deny.some((r) => r.includes(`/${ROOT}/`) && !r.includes(WT)), false, JSON.stringify(deny));
  });

  test("a grant in a sibling worktree is denied at the grant, and the agent's own worktree stays writable", () => {
    const sibling = `${ROOT}/.claude/worktrees/den-other-02-ffff0000`;
    const s = settingsOf({ compiled: compile("developer", [path_(sibling)]) });
    assert.ok(s.permissions.deny.includes(`Write(/${sibling}/**)`), JSON.stringify(s.permissions.deny));
    assert.equal(s.permissions.deny.includes(`Write(/${ROOT}/.claude/**)`), false, "the whole .claude tree would deny the agent's own worktree");
    assert.ok(s.permissions.allow.includes(`Write(/${WT}/**)`));
  });

  test("without a root the compile is as before (no main-checkout denies)", () => {
    const compiled = compileCeiling("developer", { worktree: WT, grants: [path_(`${ROOT}/.github/workflows`)] });
    assert.equal(compiled.denyAbs, undefined);
  });
});

// agent-os/02, user decision 2026-10-11 after qa verify bounce 1: the main checkout's .git is never grantable. It is a governed
// path (governance.json guardrailPaths), so a grant naming it or anything under it meets the deny and forbid beats permit.
describe("the main checkout's .git is never grantable", () => {
  for (const [name, p, denied] of [
    ["the .git directory", `${ROOT}/.git`, `${ROOT}/.git`],
    ["its config file", `${ROOT}/.git/config`, `${ROOT}/.git/config`],
    ["its hooks directory", `${ROOT}/.git/hooks`, `${ROOT}/.git/hooks`],
    ["a worktree admin directory", `${ROOT}/.git/worktrees/den-fx-01-abcd1234`, `${ROOT}/.git/worktrees/den-fx-01-abcd1234`],
  ]) {
    for (const role of ["developer", "qa", "security"]) {
      test(`${role}: a grant on ${name} is denied for Write, Edit and shell writes`, () => {
        const { deny, denyWrite } = denyOf(role, [path_(p)]);
        assert.ok(deny.includes(`Write(/${denied}/**)`), JSON.stringify(deny));
        assert.ok(deny.includes(`Edit(/${denied}/**)`), JSON.stringify(deny));
        assert.ok(denyWrite.includes(denied), JSON.stringify(denyWrite));
      });
    }
  }

  test("a grant above .git cannot be made without containing the worktree, so it is a TypeError", () => {
    assert.throws(() => compile("developer", [path_(ROOT)]), TypeError);
  });

  test("a grant on .gitignore is not caught by the .git deny", () => {
    const { deny } = denyOf("developer", [path_(`${ROOT}/.gitignore`)]);
    assert.equal(deny.some((r) => r.includes(`/${ROOT}/`) && !r.includes(WT)), false, JSON.stringify(deny));
  });

  test("with no grant, the ceiling denies .git writes under the worktree too", () => {
    const s = settingsOf({ compiled: compile("developer", []) });
    assert.ok(s.permissions.deny.includes("Write(.git/**)"), JSON.stringify(s.permissions.deny));
    assert.ok(s.permissions.deny.includes("Edit(.git/**)"));
    assert.ok(s.sandbox.filesystem.denyWrite.includes(`${WT}/.git`), JSON.stringify(s.sandbox.filesystem.denyWrite));
  });
});

describe("a path grant that contains the worktree", () => {
  const reaching = [
    ["the main checkout", ROOT],
    ["its .claude directory", `${ROOT}/.claude`],
    ["the worktrees directory", `${ROOT}/.claude/worktrees`],
    ["a parent of the main checkout", "/work"],
  ];
  for (const [name, p] of reaching) {
    test(`${name} is a TypeError from compileCeiling`, () => {
      assert.throws(() => compile("developer", [path_(p)]), TypeError);
    });
  }

  test("a ~/ grant that reaches the worktree is a TypeError when home is known", () => {
    assert.throws(() => compileCeiling("developer", { worktree: "/home/u/den/.claude/worktrees/w-1", root: "/home/u/den", home: "/home/u", grants: [path_("~/den")] }), TypeError);
    assert.throws(() => compileCeiling("developer", { worktree: "/home/u/den/.claude/worktrees/w-1", root: "/home/u/den", home: "/home/u", grants: [path_("~/den/.claude")] }), TypeError);
  });

  test("a ~/ grant elsewhere in home is fine", () => {
    const c = compileCeiling("developer", { worktree: "/home/u/den/.claude/worktrees/w-1", root: "/home/u/den", home: "/home/u", grants: [path_("~/notes")] });
    assert.deepEqual(c.writePaths, ["~/notes"]);
  });
});

describe("the read limit keeps the ticket file readable", () => {
  const TICKET = "/work/den/.scratch/den/issues/01-task.md";
  test("a host grant adds the ticket's directory as an additional directory", () => {
    const compiled = compile("developer", [{ kind: "host", value: "api.example.com" }]);
    const s = settingsOf({ compiled: { ...compiled, ticketFile: TICKET } });
    assert.equal(s.permissions.blockReadsOutsideWorkingDirectories, true);
    assert.deepEqual(s.permissions.additionalDirectories, ["/work/den/.scratch/den/issues"]);
    assert.ok(s.permissions.allow.includes(`Read(/${TICKET})`));
  });

  test("with no read limit there is no additional directory", () => {
    const s = settingsOf({ compiled: { ...compile("developer", []), ticketFile: TICKET } });
    assert.equal(s.permissions.additionalDirectories, undefined);
  });
});

describe("POST /tasks refuses a path grant that contains the worktree", () => {
  let t;
  afterEach(async () => {
    await t?.close();
    t = undefined;
  });
  const tickets = async () => (await readdir(path.join(t.fx.root, ".scratch", DEN_FEATURE, "issues")).catch(() => [])).filter((n) => n.endsWith(".md"));
  const reaching = (root) => [
    ["the main checkout", root],
    ["its .claude directory", path.join(root, ".claude")],
    ["the worktrees directory", path.join(root, ".claude", "worktrees")],
    ["a parent of the main checkout", path.dirname(root)],
  ];
  for (const [i, name] of ["the main checkout", "its .claude directory", "the worktrees directory", "a parent of the main checkout"].entries()) {
    test(`${name} is a 400, nothing written, nothing spawned`, async () => {
      t = await makeBridge();
      const value = reaching(t.fx.root)[i][1];
      const res = await t.post("/tasks", { role: "developer", text: TEXT, grants: [{ kind: "path", value }] });
      assert.equal(res.status, 400, res.text);
      assert.equal(res.body.error.includes(value), false, "the error does not echo the path");
      assert.deepEqual(await tickets(), []);
      assert.equal(t.fake.spawns.length, 0);
    });
  }

  test("a path grant inside the main checkout is allowed and reaches the runtime with the root", async () => {
    t = await makeBridge();
    const value = path.join(t.fx.root, "docs", "notes");
    const res = await t.post("/tasks", { role: "developer", text: TEXT, grants: [{ kind: "path", value }] });
    assert.equal(res.status, 201, res.text);
    assert.equal(t.fake.spawns[0].args.root, await realpath(t.fx.root));
  });

  test("a path grant elsewhere is allowed", async () => {
    t = await makeBridge();
    const res = await t.post("/tasks", { role: "developer", text: TEXT, grants: [{ kind: "path", value: "/srv/shared/data" }] });
    assert.equal(res.status, 201, res.text);
  });
});

```

Source block "apps/bridge/cells/host-task-grants.test.mjs" lines 23-91:
```
});
const tickets = async () => (await readdir(path.join(t.fx.root, ".scratch", DEN_FEATURE, "issues")).catch(() => [])).filter((n) => n.endsWith(".md"));

describe("POST /tasks grants", () => {
  test("a developer task with grants starts, and the runtime gets exactly the validated grants", async () => {
    t = await makeBridge();
    const res = await t.post("/tasks", { role: "developer", text: TEXT, grants: GOOD });
    assert.equal(res.status, 201, res.text);
    assert.deepEqual(t.fake.spawns[0].args.grants, GOOD);
  });

  test("no grant string reaches the prompt template", async () => {
    t = await makeBridge();
    await t.post("/tasks", { role: "developer", text: TEXT, grants: GOOD });
    const { prompt } = t.fake.spawns[0].args;
    for (const g of GOOD) assert.equal(prompt.includes(g.value), false, g.value);
  });

  test("a task with no grants spawns with none", async () => {
    t = await makeBridge();
    const res = await t.post("/tasks", { role: "developer", text: TEXT });
    assert.equal(res.status, 201, res.text);
    assert.ok([undefined, null].includes(t.fake.spawns[0].args.grants) || t.fake.spawns[0].args.grants.length === 0);
  });

  const bad = [
    ["not an array", "api.example.com"],
    ["an object", { kind: "host", value: "api.example.com" }],
    ["a string entry", ["api.example.com"]],
    ["an IP host", [{ kind: "host", value: "127.0.0.1" }]],
    ["the metadata address", [{ kind: "host", value: "169.254.169.254" }]],
    ["localhost", [{ kind: "host", value: "localhost" }]],
    ["a scheme", [{ kind: "host", value: "https://example.com" }]],
    ["a port", [{ kind: "host", value: "example.com:8080" }]],
    ["a relative path", [{ kind: "path", value: "notes/x" }]],
    ["a .. path", [{ kind: "path", value: "/srv/../etc" }]],
    ["a glob path", [{ kind: "path", value: "/srv/*" }]],
    ["an unknown kind", [{ kind: "flag", value: "--dangerously-skip-permissions" }]],
    ["an extra key", [{ kind: "host", value: "api.example.com", flag: "--x" }]],
    ["seven grants", Array.from({ length: 7 }, (_, i) => ({ kind: "host", value: `h${i}.example.com` }))],
    ["a non-string value", [{ kind: "host", value: 7 }]],
  ];
  for (const [name, grants] of bad) {
    test(`${name} is a 400, nothing written, nothing spawned`, async () => {
      t = await makeBridge();
      const res = await t.post("/tasks", { role: "developer", text: TEXT, grants });
      assert.equal(res.status, 400, res.text);
      assert.equal(typeof res.body.error, "string");
      assert.equal(res.body.error.includes("--dangerously"), false, "the error does not echo a flag back as advice");
      assert.deepEqual(await tickets(), [], "no ticket");
      assert.equal(t.fake.spawns.length, 0, "no agent");
    });
  }

  test("scout takes no grant", async () => {
    t = await makeBridge();
    const res = await t.post("/tasks", { role: "scout", text: TEXT, grants: [GOOD[0]] });
    assert.equal(res.status, 400, res.text);
    assert.equal(t.fake.spawns.length, 0);
  });

  test("a role with no ceiling takes no grant", async () => {
    t = await makeBridge();
    const res = await t.post("/tasks", { role: "architect", text: TEXT, grants: [GOOD[0]] });
    assert.equal(res.status, 400, res.text);
    assert.equal(t.fake.spawns.length, 0);
  });
});

```

Source block "apps/bridge/cells/grants.test.mjs" lines 41-50:
```
const GUARDRAIL_PATHS = ["apps/bridge/cells/ceilings.json", ".claude/settings.json", ".claude/agents/developer.md"];
const GOVERNANCE_COMMANDS = ["git push origin HEAD", "git push origin main", "gh pr create --fill", "gh pr review 12 --approve", "gh pr merge 12", "gh issue close 5", "gh release create v1.0"];

const compile = (role, grants, extra = {}) => need("compileCeiling")(role, { worktree: WT, ...(grants === undefined ? {} : { grants }), ...extra });
const argvFor = (role, grants) => need("buildClaudeArgs")({ sessionId: SID, agent: role, ...compile(role, grants) });
const settingsOf = (argv) => JSON.parse(argv[argv.indexOf("--settings") + 1]);
const settingsFor = (role, grants) => settingsOf(argvFor(role, grants));
const sorted = (xs) => [...xs].sort();

// ---- reference matchers (test-local, independent of the code under test) ----
```

Source block "apps/bridge/cells/grants.test.mjs" lines 235-286:
```
  });
});

describe("forbid beats permit: no grant shape lifts a deny", () => {
  const GRANTS = [
    [{ kind: "host", value: "github.com" }], [{ kind: "host", value: "api.github.com" }],
    [{ kind: "path", value: WT }], [{ kind: "path", value: `${WT}/.claude` }], [{ kind: "path", value: `${WT}/.github` }],
    [{ kind: "path", value: `${WT}/apps/bridge/cells` }], [{ kind: "path", value: `${WT}/apps/bridge/cells/ceilings.json` }],
    [{ kind: "path", value: "/work/den" }], [{ kind: "path", value: "/srv/shared/data" }], [{ kind: "path", value: "~/projects/x" }],
    [{ kind: "host", value: "github.com" }, { kind: "path", value: `${WT}/.claude` }],
  ];
  for (const role of ROLES_WITH_GRANTS) {
    GRANTS.forEach((grants, i) => {
      test(`${role}, grant set ${i} (${grants.map((g) => `${g.kind}:${g.value}`).join(" + ")})`, () => {
        let s;
        try { s = settingsFor(role, grants); } catch (e) { assert.ok(e instanceof TypeError, "a refused grant is a TypeError"); return; }
        const covered = (file) => grants.some((g) => g.kind === "path" && (`${WT}/${file}`.startsWith(`${g.value}/`) || `${WT}/${file}` === g.value));
        for (const file of GUARDRAIL_PATHS) assert.ok(fileDenied(s, file) && writeToolDenied(s, file), `${role}: ${file} stays denied`);
        for (const file of CI_PATHS) {
          if (role === "security" && covered(file)) continue; // the one stated exception
          assert.ok(fileDenied(s, file) && writeToolDenied(s, file), `${role}: ${file} stays denied`);
        }
        for (const command of GOVERNANCE_COMMANDS) assert.ok(bashDenied(s.permissions.deny, command), `${role}: ${command} stays denied`);
        for (const rule of FOUR) assert.ok(s.permissions.deny.includes(rule), rule);
      });
    });
  }
});

describe("bypass forms: the compiled rules refuse each wrapped governance command", () => {
  const WRAPS = [
    ["plain", (c) => c], ["newline between commands", (c) => `echo ok\n${c}`], ["newline after", (c) => `${c}\necho ok`], ["semicolon", (c) => `true; ${c}`],
    ["and-list", (c) => `true && ${c}`], ["pipe", (c) => `echo x | ${c}`], ["$(...)", (c) => `echo $(${c})`], ["backticks", (c) => `echo \`${c}\``],
```

Output truncated at the byte limit (24576 bytes); 4600 original bytes omitted.

End context.
