Jevgrep: 52 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 5 file(s).
- "apps/bridge/cells/host-workspace.test.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/workspace.mjs" — implementation, caller, helper; locations only
- "apps/bridge/server.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/claude-adapter.mjs" — implementation, caller, helper; source below
- "apps/bridge/cells/claude-runtime.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/workspace.test.mjs" — test, fixture, helper; source below
- "apps/bridge/cells/host-task.test.mjs" — caller, test, fixture, helper; source omitted
- "apps/bridge/cells/claude-runtime-wall.test.mjs" — caller, test, fixture, helper; locations only
- "apps/bridge/cells/conformance-live.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/ceilings.test.mjs" — caller, test, fixture, helper; source omitted
- "apps/bridge/cells/claude-process.test.mjs" — test, fixture, helper; locations only
- "apps/organism-infra/board-service.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/grants-paths.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/ceilings.json" — helper; locations only
- "apps/bridge/cells/policy.mjs" — helper; locations only
- "apps/bridge/cells/conformance.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/claude-runtime-host.test.mjs" — caller, test, fixture, helper; source below
- "apps/bridge/cells/conformance-live.test.mjs" — caller, test, fixture, helper; source omitted
- "scripts/log-cell-root.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/claude-adapter.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/host.mjs" — implementation, caller, helper; locations only
- "apps/bridge/cells/conformance-s6b-restore.test.mjs" — test, fixture, helper; locations only
- "apps/organism-infra/board.mjs" — caller, helper; locations only
- "docs/adr/0021-agent-wall-grants-and-the-bridge-as-kernel.md" — helper; locations only
- "scripts/jev-ref-resolve.test.mjs" — test, fixture, helper; locations only
- "apps/organism-infra/board-cli.test.mjs" — test, fixture, helper; locations only
- "scripts/board-shim.test.mjs" — test, fixture, helper; locations only
- "docs/adr/0003-local-file-board.md" — helper; locations only
- "scripts/cell-start.mjs" — caller, helper; locations only
- "apps/bridge/cells/conformance.mjs" — test, fixture, helper; source omitted
- "scripts/queue.mjs" — helper; locations only
- "scripts/cell-start.test.mjs" — test, fixture, helper; locations only
- "scripts/dispatch-context.mjs" — helper; locations only
- "docs/agents/issue-tracker.md" — helper; locations only
- "apps/bridge/cells/grants.test.mjs" — test, fixture, helper; locations only
- "scripts/jg.test.mjs" — test, fixture, helper; locations only
- "scripts/risk-check.claude-dir.test.mjs" — test, fixture, helper; locations only
- "scripts/jg-wrapper.test.mjs" — test, fixture, helper; locations only
- "scripts/dispatch-context.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/runtime.mjs" — fixture, helper; locations only
- "apps/bridge/cells/host-test-helpers.mjs" — fixture, helper; locations only
- "docs/adr/0016-ui-steering-channel.md" — helper; locations only
- "scripts/jg.mjs" — helper; locations only
- "scripts/cell-start.existing-branch.test.mjs" — test, fixture, helper; locations only
- "apps/bridge/cells/sessions.mjs" — helper; locations only
- "docs/agents/cell-start.md" — helper; locations only
- "apps/organism-infra/fixtures/real-ticket-02-board-cli.md" — test, fixture, helper; locations only
- "docs/adr/0008-board-service.md" — helper; locations only
- "apps/bridge/cells/claude-stub.mjs" — fixture, helper; locations only
- "scripts/queue.test.mjs" — test, fixture, helper; locations only
- "scripts/north-star.mjs" — relevant; role uncertain; locations only
- "scripts/worktree-gc.main-copies.test.mjs" — test, fixture; locations only
End file list. Declaration locations follow source.

Source block "apps/bridge/cells/host-workspace.test.mjs" lines 25-182:
```
});

// A bridge over the real Claude runtime with the stub as the binary, in a git fixture.
async function boot(stubOpts = {}) {
  const fx = await makeStateFixture({ git: true });
  const outside = path.join(fx.root, "outside.txt");
  const stub = await makeStub({ ...stubOpts, writePath: outside });
  const runtime = createClaudeRuntime({ env: { PATH: process.env.PATH, HOME: process.env.HOME, DEN_CLAUDE_BIN: stub.bin } });
  const bridge = await startBridge({ root: fx.root, port: 0, auth: { launchCode: CODE }, runtime, policy: { killGraceMs: 150 } });
  const headers = authed(bridge, await login(bridge));
  cleanups.push(async () => {
    const start = await stub.start();
    if (start?.pid && alive(start.pid)) process.kill(start.pid, "SIGKILL");
    await bridge.close();
    await fx.cleanup();
  });
  return {
    fx, stub, outside,
    post: (p, body = {}) => send(bridge, { method: "POST", path: p, body, headers }),
    get: (p) => send(bridge, { path: p, headers }),
    state: async () => (await send(bridge, { path: "/state" })).body,
    sessions: async () =>
      (await readFile(path.join(fx.root, ".scratch", "_run", "sessions.jsonl"), "utf8").catch(() => "")).split("\n").filter(Boolean).map((l) => JSON.parse(l)),
  };
}
async function fake(options) {
  const t = await makeBridge(options);
  cleanups.push(() => t.close());
  return t;
}

describe("the child's working directory", () => {
  test("is a new worktree under .claude/worktrees on a den/ branch at the root's HEAD, never the root", async () => {
    const t = await boot({ mode: "hang" });
    const res = await t.post("/agents", { ref: DISPATCH_REF, role: "architect" });
    assert.equal(res.status, 201, res.text);
    const { id, sessionId, worktree, branch } = res.body.agent;
    assert.equal(worktree, `.claude/worktrees/den-fx-02-ready-p0-${shortOf(id)}`);
    assert.equal(branch, `den/${DISPATCH_REF}-${shortOf(id)}`);

    const start = await until(() => t.stub.start(), { what: "the stub to start" });
    const root = await realpath(t.fx.root);
    assert.equal(start.cwd, await realpath(path.join(t.fx.root, worktree)), "the child's cwd is the worktree");
    assert.notEqual(start.cwd, root, "the child never runs in the repo root");
    const listed = await git(t.fx.root, "worktree", "list", "--porcelain");
    assert.match(listed, new RegExp(`worktree ${start.cwd}\\nHEAD [0-9a-f]+\\nbranch refs/heads/${branch}\\n`));
    assert.equal((await git(start.cwd, "rev-parse", "HEAD")).trim(), (await git(t.fx.root, "rev-parse", "HEAD")).trim());

    // The argv is still the fixed template: the worktree reaches the child as its cwd and nothing else. The one
    // path in it is the agent's own ticket file in the main checkout, inside the inline settings (amendment 13).
    const ticketFile = path.join(t.fx.root, ".scratch", "fx", "issues", "02-ready-p0.md");
    assert.deepEqual(start.argv, buildClaudeArgs({ sessionId, agent: "architect", ticketFile }));
    assert.ok(!start.argv.some((a) => a.includes(worktree)), "the worktree path is not in argv");
    assert.deepEqual(start.argv.filter((a) => a.includes(root)), [start.argv.at(-1)], "the root appears only in the settings value");
    assert.deepEqual(JSON.parse(start.argv.at(-1)).permissions.allow, [`Read(/${ticketFile})`]);

    const spawn = (await t.sessions()).find((l) => l.event === "spawn" && l.agentId === id);
    assert.equal(spawn.worktree, worktree);
    assert.equal(spawn.branch, branch);
  });

  test("a write outside the worktree is held as an approval and never performed without an allow", async () => {
    const t = await boot({ mode: "write" });
    const res = await t.post("/agents", { ref: DISPATCH_REF, role: "architect" });
    assert.equal(res.status, 201, res.text);
    const { id, worktree } = res.body.agent;
    const approval = await until(async () => (await t.state()).approvals?.find((a) => a.agentId === id && a.state === "pending"), { what: "a pending approval" });
    assert.equal(approval.tool, "Write");

    const full = await t.get(`/approvals/${approval.id}`);
    const cwd = await realpath(path.join(t.fx.root, worktree));
    assert.ok(path.relative(cwd, full.body.input.file_path).startsWith(".."), "the requested path is outside the agent's worktree");
    assert.equal((await t.state()).agents.find((a) => a.id === id).state, "waiting_on_user");
    assert.equal(await exists(t.outside), false, "nothing is written while the request is held");

    const denied = await t.post(`/approvals/${approval.id}`, { decision: "deny" });
    assert.equal(denied.status, 200, denied.text);
    const answer = await until(async () => (await t.stub.stdinLines()).find((l) => l.type === "control_response"), { what: "the answer on the child's stdin" });
    assert.equal(answer.response.response.behavior, "deny");
    await until(async () => (await t.state()).agents.find((a) => a.id === id)?.state === "done", { what: "the agent to end" });
    assert.equal(await exists(t.outside), false, "a denied write leaves no file");
  });
});

describe("one worktree per agent", () => {
  test("two agents get two worktrees and two branches", async () => {
    const t = await fake();
    const a = await t.dispatch("architect");
    const b = await t.bridge.host.start({ ref: NO_GATE_REF, role: "scout" });
    assert.equal(a.status, 201, a.text);
    assert.equal(b.status, 201, b.error);
    const [first, second] = t.fake.spawns.map((s) => s.args.cwd);
    const root = await realpath(t.fx.root);
    assert.notEqual(first, second);
    for (const cwd of [first, second]) {
      assert.ok(cwd.startsWith(path.join(root, ".claude", "worktrees") + path.sep), `${cwd} is under .claude/worktrees`);
      assert.ok(await exists(path.join(cwd, ".git")), `${cwd} is a worktree`);
    }
    assert.notEqual(a.body.agent.branch, b.agent.branch);
  });

  test("the worktree is kept after the run, and the same ticket's next agent gets a fresh one", async () => {
    const t = await fake();
    const a = await t.dispatch("architect");
    t.fake.spawns[0].exit();
    await until(async () => (await t.agent(a.body.agent.id))?.state === "done", { what: "the first agent to end" });
    const b = await t.dispatch("architect");
    assert.equal(b.status, 201, b.text);
    const [first, second] = t.fake.spawns.map((s) => s.args.cwd);
    assert.notEqual(first, second);
    assert.ok(await exists(first), "the first worktree is still there");
    assert.equal((await t.agent(a.body.agent.id)).worktree, a.body.agent.worktree, "the ended agent still names its worktree");
  });
});

describe("failures start nothing and leave nothing", () => {
  test("no worktree, no agent: a root that is not a git repository answers 500 and spawns nothing", async () => {
    const t = await fake({ noGit: true });
    const res = await t.dispatch("architect");
    assert.equal(res.status, 500, res.text);
    assert.equal(t.fake.spawns.length, 0, "the runtime was never asked to spawn");
    assert.deepEqual((await t.state()).agents, []);
    assert.equal((await readFile(t.sessionsFile, "utf8").catch(() => "")).includes('"spawn"'), false);
    assert.equal((await t.dispatch("architect")).status, 500, "the reservation was released (not 409)");
  });

  test("a failed spawn removes the worktree and the branch it had just created", async () => {
    const t = await fake({ runtimeConfig: { failSpawn: true } });
    const res = await t.dispatch("architect");
    assert.equal(res.status, 502, res.text);
    assert.deepEqual(await readdir(path.join(t.fx.root, ".claude", "worktrees")).catch(() => []), []);
    assert.equal((await git(t.fx.root, "branch", "--list", "den/*")).trim(), "");
    assert.equal((await git(t.fx.root, "worktree", "list", "--porcelain")).match(/^worktree /gm).length, 1);
  });
});

describe("replay", () => {
  const ID = "c-0123456789abcdef";
  const spawn = (extra) => ({ ts: "2026-10-10T09:00:00.000Z", event: "spawn", agentId: ID, ref: DISPATCH_REF, role: "architect", sessionId: "08376463-453a-4135-a7df-4ee921c22e86", ...extra });

  test("a replayed agent names its worktree only when the line matches what the bridge would have derived", async () => {
    const good = { worktree: ".claude/worktrees/den-fx-02-ready-p0-01234567", branch: "den/fx/02-ready-p0-01234567" };
    const t = await fake({ preWrite: (root) => seedSessions(root, [spawn(good)]) });
    const agent = await t.agent(ID);
    assert.equal(agent.worktree, good.worktree);
    assert.equal(agent.branch, good.branch);
  });

  test("a forged or absent worktree on a replayed line is shown as none", async () => {
    for (const extra of [{ worktree: "../../etc", branch: "main" }, { worktree: ".claude/worktrees/den-fx-02-ready-p0-ffffffff", branch: "den/fx/02-ready-p0-ffffffff" }, {}]) {
      const t = await fake({ preWrite: (root) => seedSessions(root, [spawn(extra)]) });
      const agent = await t.agent(ID);
      assert.equal(agent.worktree, null, JSON.stringify(extra));
      assert.equal(agent.branch, null, JSON.stringify(extra));
    }
  });
});

```

Source block "apps/bridge/cells/claude-adapter.mjs" lines 243-285:
```
// ---- argv ----------------------------------------------------------------------------------

/**
 * The whole argv (no binary name) for one child. Rejects anything outside { sessionId, agent, model?, ticketFile?,
 * wall?, worktree? }. No passthrough parameter exists, so no permission-broadening flag can be constructed; ticketFile adds
 * the one Read rule above, wall adds the sandbox block above, and worktree adds Write and Edit rules for that one directory.
 */
export function buildClaudeArgs(options) {
  if (!isPlainObject(options)) throw new TypeError("buildClaudeArgs needs { sessionId, agent, model?, ticketFile?, wall?, worktree? }");
  for (const key of Object.keys(options)) {
    if (!["sessionId", "agent", "model", "ticketFile", "wall", "worktree", "forbid", "writePaths", "readLimit", "denyAbs"].includes(key)) throw new TypeError(`buildClaudeArgs: unknown option ${JSON.stringify(key)}`);
  }
  const { sessionId, agent, model, ticketFile, wall, worktree, forbid, writePaths, readLimit, denyAbs } = options;
  if (wall !== undefined && !isWall(wall)) throw new TypeError("buildClaudeArgs: wall must be { hosts: [plain host names] }");
  // agent-os/02: the governance denies, task-granted write paths and the read limit all come from compileCeiling and need the wall.
  if (forbid !== undefined && !isForbid(forbid)) throw new TypeError("buildClaudeArgs: forbid must be { write: [plain paths], run: [plain words] }");
  if (writePaths !== undefined && !(isDense(writePaths) && writePaths.length <= GRANTS_MAX && writePaths.every(isGrantPath))) throw new TypeError("buildClaudeArgs: writePaths must be plain absolute or ~/ paths");
  if (readLimit !== undefined && readLimit !== true) throw new TypeError("buildClaudeArgs: readLimit must be true");
  if (denyAbs !== undefined && !(isDense(denyAbs) && denyAbs.length <= DENY_ABS_MAX && denyAbs.every((p) => typeof p === "string" && DENY_ABS_RE.test(p) && !p.split("/").some((part) => part === "." || part === "..")))) throw new TypeError("buildClaudeArgs: denyAbs must be plain absolute paths");
  if (wall === undefined && (forbid !== undefined || writePaths !== undefined || readLimit !== undefined || denyAbs !== undefined)) throw new TypeError("buildClaudeArgs: forbid, writePaths, readLimit and denyAbs need the wall");
  if (worktree !== undefined && !isWorktreePath(worktree)) throw new TypeError("buildClaudeArgs: worktree must be a plain absolute path");
  if (ticketFile !== undefined && !isTicketFilePath(ticketFile)) throw new TypeError("buildClaudeArgs: ticketFile must be a plain absolute path to a board ticket");
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) throw new TypeError("buildClaudeArgs: sessionId must be a UUID");
  if (typeof agent !== "string" || !ROLES.includes(agent)) throw new TypeError("buildClaudeArgs: agent must be a known role");
  if (model !== undefined && (typeof model !== "string" || !CLAUDE_MODELS.includes(model))) throw new TypeError("buildClaudeArgs: model must be one of the fixed list");
  return [
    "-p",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--verbose",
    "--replay-user-messages", // den-v1 loop S5: the child re-emits each stdin user message once it takes it
    "--permission-prompt-tool", "stdio",
    "--session-id", sessionId,
    "--agent", agent,
    ...(model === undefined ? [] : ["--model", model]),
    "--setting-sources", "project,local",
    "--strict-mcp-config",
    "--settings", settingsFor({ ticketFile, wall, worktree, forbid, writePaths, readLimit, denyAbs }),
  ];
}

// ---- environment ---------------------------------------------------------------------------

```

Source block "apps/bridge/cells/workspace.test.mjs" lines 31-101:
```
const exists = (p) => access(p).then(() => true, () => false);
const git = async (root, ...args) => (await run("git", ["-C", root, ...args])).stdout;

describe("workspaceNames", () => {
  test("derives the directory and the branch from the ref and the agent id alone", async () => {
    const { workspaceNames } = await load();
    assert.deepEqual(workspaceNames({ ref: REF, agentId: ID }), {
      worktree: ".claude/worktrees/den-fx-02-ready-p0-01234567",
      branch: "den/fx/02-ready-p0-01234567",
    });
  });

  test("rejects a ref or an agent id that fails its pattern", async () => {
    const { workspaceNames } = await load();
    for (const ref of ["-x/01-a", "fx/01-a/../../etc", "fx/01-a b", "fx/-01-a", "../01-a", "fx", "", null, 7, ["fx/01-a"]]) {
      assert.throws(() => workspaceNames({ ref, agentId: ID }), TypeError, `ref ${JSON.stringify(ref)}`);
    }
    for (const agentId of ["c-xyz", "a-0123456789abcdef", "c-0123456789abcdef/..", "", null, 7]) {
      assert.throws(() => workspaceNames({ ref: REF, agentId }), TypeError, `agentId ${JSON.stringify(agentId)}`);
    }
  });
});

describe("createWorkspaces", () => {
  test("create runs git once, with an argument list built from the derived names", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    const calls = [];
    const ws = createWorkspaces(fx.root, { exec: async (file, args) => (calls.push({ file, args }), { stdout: "" }) });
    await ws.create({ ref: REF, agentId: ID }).catch(() => {}); // the fake creates nothing, so resolving the path may fail
    assert.deepEqual(calls[0], {
      file: "git",
      args: ["-C", fx.root, "worktree", "add", "-b", "den/fx/02-ready-p0-01234567", path.join(fx.root, ".claude", "worktrees", "den-fx-02-ready-p0-01234567"), "HEAD"],
    });
  });

  test("a bad ref or agent id is refused before git runs", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    const calls = [];
    const ws = createWorkspaces(fx.root, { exec: async (file, args) => (calls.push({ file, args }), { stdout: "" }) });
    await assert.rejects(ws.create({ ref: "--upload-pack=x/01-a", agentId: ID }), TypeError);
    await assert.rejects(ws.create({ ref: REF, agentId: "c-../../x" }), TypeError);
    assert.equal(calls.length, 0);
  });

  test("create adds a worktree at the root's HEAD on a new branch; remove takes both away", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture({ git: true });
    const ws = createWorkspaces(fx.root);
    const made = await ws.create({ ref: REF, agentId: ID });
    assert.equal(made.branch, "den/fx/02-ready-p0-01234567");
    assert.equal(made.worktree, ".claude/worktrees/den-fx-02-ready-p0-01234567");
    assert.equal(made.dir, await realpath(path.join(fx.root, made.worktree)));
    assert.equal((await git(made.dir, "rev-parse", "HEAD")).trim(), (await git(fx.root, "rev-parse", "HEAD")).trim());
    assert.equal((await git(made.dir, "branch", "--show-current")).trim(), made.branch);
    assert.notEqual(await realpath(await git(made.dir, "rev-parse", "--show-toplevel").then((s) => s.trim())), await realpath(fx.root));

    await ws.remove(made);
    assert.equal(await exists(made.dir), false);
    assert.equal((await git(fx.root, "branch", "--list", "den/*")).trim(), "");
  });

  test("create rejects when the root is not a git repository", async () => {
    const { createWorkspaces } = await load();
    const fx = await fixture();
    await assert.rejects(createWorkspaces(fx.root).create({ ref: REF, agentId: ID }));
    assert.equal(await exists(path.join(fx.root, ".claude", "worktrees", "den-fx-02-ready-p0-01234567")), false);
  });
});

```

Source block "apps/bridge/cells/conformance-live.mjs" lines 35-84:
```

// ---- the throwaway repository ---------------------------------------------------------------

const roleFile = ({ model, target, body, insideBody, ticket, neighbour }) => `---
name: ${LIVE_ROLE}
description: Live-check probe role (throwaway)
tools: Read, Write
model: ${model}
---
You are a conformance probe in a throwaway repository. There is no board${ticket ? "" : ", no ticket file"} and no organism-protocol skill here: skip every claim, hand-off and board step you are asked for, and do not look for them.

Do exactly this, in this order, and nothing else:
${ticket ? `- Use the Read tool to read the file ${ticket}\n- Use the Read tool to read the file ${neighbour}\n` : ""}${insideBody ? `- Use the Write tool to create the file ${INSIDE_FILE} in your current working directory with exactly this content: ${insideBody}\n` : ""}- Use the Write tool to create the file ${target} with exactly this content: ${body}

If a tool call is refused, do not retry it and do not try another way. Begin your final reply with the word ${LIVE_MARKER}, then say in one sentence what happened to each write.
`;

/**
 * A git repository with one commit holding the probe role file. `target` is in the repository root, so it is outside
 * every agent worktree (.claude/worktrees/...). insideBody: null leaves the inside write out.
 */
export function makeLiveRepo({ model = "haiku", body = `LIVE-BODY-${randomBytes(3).toString("hex").toUpperCase()}`, insideBody = null, ticketWord = null } = {}) {
  if (typeof model !== "string" || !MODEL_RE.test(model)) throw new TypeError("makeLiveRepo: model must be a plain model name");
  for (const b of [body, ...(insideBody === null ? [] : [insideBody]), ...(ticketWord === null ? [] : [ticketWord])]) {
    if (typeof b !== "string" || !BODY_RE.test(b)) throw new TypeError("makeLiveRepo: a body is one line of letters, digits, spaces, dots, dashes and underscores");
  }
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "den-live-")));
  const target = path.join(dir, "live-check.txt");
  mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
  mkdirSync(path.join(dir, ".scratch"));
  // ticketWord: the probe's own ticket file, where the host says it is (the main checkout's board, outside the worktree).
  const ticket = ticketWord === null ? null : path.join(dir, ".scratch", ...LIVE_REF.split("/").toSpliced(1, 0, "issues")) + ".md";
  const neighbour = ticket ? path.join(path.dirname(ticket), "02-neighbour.md") : null; // the control: not the agent's ticket
  if (ticket) {
    mkdirSync(path.dirname(ticket), { recursive: true });
    writeFileSync(neighbour, "# 02: neighbour\n\n**Status:** ready-for-agent\n");
    writeFileSync(ticket, `# 01: live check\n\n**Status:** ready-for-agent\n\n## What to build\n\n> ${ticketWord}\n`);
  }
  writeFileSync(path.join(dir, ".claude", "agents", `${LIVE_ROLE}.md`), roleFile({ model, target, body, insideBody, ticket, neighbour }));
  const git = (...args) => execFileSync("git", ["-C", dir, "-c", "user.name=live", "-c", "user.email=live@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("add", `.claude/agents/${LIVE_ROLE}.md`);
  git("commit", "-q", "-m", "live check probe");
```

Output truncated at the byte limit (24576 bytes); 22718 original bytes omitted.

End context.
