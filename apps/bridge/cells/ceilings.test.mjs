// agent-os/04 (ADR 0021 decisions 2 to 5): the role ceilings, and how the adapter compiles one into the inline settings.
//
// PINNED INTERFACE (what these tests hold the developer to; anything not named here is the developer's to choose):
//   apps/bridge/cells/ceilings.json     one data file, a JSON object keyed by role name. Exactly four keys: scout, developer,
//                                       qa, security. A role with no key (designer, architect, product, herald, orchestrator)
//                                       has no ceiling. The shape of each value is the developer's.
//   compileCeiling(role, { worktree })  exported from ./claude-adapter.mjs, pure. Returns null (or undefined) for a role with
//                                       no ceiling; otherwise an options object that, spread into buildClaudeArgs, gives
//                                       the recorded settings. The option names it returns are not pinned: these tests only
//                                       compose  buildClaudeArgs({ sessionId, agent, ...compileCeiling(agent, { worktree }) }).
//   buildClaudeArgs                     unchanged for every call that does not spread a ceiling in (the agent-os/01 tests
//                                       in claude-adapter.test.mjs keep passing).
//
// The recorded settings (ADR 0021 amendment 1, and the spike's finding that Write in the worktree still asks):
//   - sandbox: the wall block with an EMPTY host list, for every role with a ceiling (no role has a host yet)
//   - permissions.deny: the four deny rules stay, so git push and gh pr create are still refused with the wall on
//   - permissions.allow: Write and Edit inside the worktree for the roles that write (developer, qa, security);
//     none for scout. Rules use the adapter's absolute-path form, the same as the ticket Read rule: `Write(/${worktree}/**)`.
//   - a worktree the adapter cannot write as a rule (not plain absolute segments) is a TypeError.
// Expected values below are hand-written literals, never computed with the code under test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { ROLES } from "./policy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const adapter = await import("./claude-adapter.mjs").catch(() => ({}));
const need = (name) => {
  assert.equal(typeof adapter[name], "function", `claude-adapter.mjs must export the function ${name}`);
  return adapter[name];
};

const SID = "0b8f1c1e-5c1a-4c0e-9a55-3f2d9e7a4b10";
const WT = "/work/den/.claude/worktrees/den-fx-01-abcd1234";
const TICKET = "/work/den/.scratch/fx/issues/01-thing.md";
const DENY = ["Write(.claude/**)", "Edit(.claude/**)", "Bash(git push:*)", "Bash(gh pr create:*)"];
const WALL_NO_HOSTS = {
  enabled: true,
  failIfUnavailable: true,
  allowUnsandboxedCommands: false,
  autoAllowBashIfSandboxed: true,
  network: { allowedDomains: [], strictAllowlist: true },
};
const WRITERS = ["developer", "qa", "security"];
const CEILING_ROLES = ["developer", "qa", "scout", "security"];
const NO_CEILING_ROLES = ["architect", "designer", "herald", "orchestrator", "product"];

const argvFor = (agent, extra = {}, worktree = WT) =>
  need("buildClaudeArgs")({ sessionId: SID, agent, ...(need("compileCeiling")(agent, { worktree }) ?? {}), ...extra });
const settingsOf = (argv) => JSON.parse(argv[argv.indexOf("--settings") + 1]);
const sorted = (xs) => [...xs].sort();
const noFs = (sandbox) => ({ ...sandbox, filesystem: undefined });

describe("ceilings.json: one data file beside policy.mjs", () => {
  const ceilings = () => JSON.parse(readFileSync(path.join(HERE, "ceilings.json"), "utf8"));

  test("it gives scout, developer, qa and security a ceiling and nobody else", () => {
    const data = ceilings();
    assert.ok(data !== null && typeof data === "object" && !Array.isArray(data), "a JSON object keyed by role");
    assert.deepEqual(Object.keys(data).sort(), CEILING_ROLES);
    for (const role of CEILING_ROLES) assert.ok(ROLES.includes(role), `${role} is a known role`);
    for (const role of CEILING_ROLES) assert.ok(data[role] !== null && typeof data[role] === "object" && !Array.isArray(data[role]), `${role} has an object`);
  });
});

describe("compileCeiling: the four ceilings", () => {
  for (const role of CEILING_ROLES) {
    test(`${role}: the wall is on with an empty host list, and the four deny rules stay`, () => {
      const settings = settingsOf(argvFor(role));
      assert.deepEqual(noFs(settings.sandbox), noFs(WALL_NO_HOSTS)); // agent-os/02: sandbox.filesystem (governance denyWrite) may now ride along
      for (const rule of DENY) assert.ok(settings.permissions.deny.includes(rule), `deny keeps ${rule}`);
    });
  }

  for (const role of WRITERS) {
    test(`${role}: Write and Edit inside the worktree are allowed, and nothing else is`, () => {
      const settings = settingsOf(argvFor(role));
      assert.deepEqual(sorted(settings.permissions.allow), sorted([`Write(/${WT}/**)`, `Edit(/${WT}/**)`]));
    });

    test(`${role}: the ticket Read rule stays beside the worktree rules`, () => {
      const settings = settingsOf(argvFor(role, { ticketFile: TICKET }));
      assert.deepEqual(sorted(settings.permissions.allow), sorted([`Read(/${TICKET})`, `Write(/${WT}/**)`, `Edit(/${WT}/**)`]));
      assert.deepEqual(noFs(settings.sandbox), noFs(WALL_NO_HOSTS)); // agent-os/02: sandbox.filesystem (governance denyWrite) may now ride along
    });
  }

  test("scout: no Write or Edit allow at all (read the project and the web, no write)", () => {
    const withTicket = settingsOf(argvFor("scout", { ticketFile: TICKET }));
    assert.deepEqual(withTicket.permissions.allow, [`Read(/${TICKET})`]);
    const bare = settingsOf(argvFor("scout"));
    assert.deepEqual(bare.permissions.allow ?? [], []);
  });

  test("no ceiling adds a network host, a wildcard or a broader path than the worktree", () => {
    for (const role of CEILING_ROLES) {
      const settings = settingsOf(argvFor(role, { ticketFile: TICKET }));
      assert.deepEqual(settings.sandbox.network.allowedDomains, [], role);
      for (const rule of settings.permissions.allow ?? []) {
        assert.ok(rule === `Read(/${TICKET})` || rule === `Write(/${WT}/**)` || rule === `Edit(/${WT}/**)`, `${role}: unexpected allow ${rule}`);
      }
    }
  });

  test("the argv outside --settings is the plain template: the ceiling touches the settings value only", () => {
    for (const role of CEILING_ROLES) {
      const plain = need("buildClaudeArgs")({ sessionId: SID, agent: role });
      const walled = argvFor(role);
      const at = plain.indexOf("--settings");
      assert.deepEqual(walled.filter((_, i) => i !== at + 1), plain.filter((_, i) => i !== at + 1), role);
    }
  });

  test("a worktree the adapter cannot write as a plain rule is a TypeError, not a looser rule", () => {
    const bad = ["relative/path", "/work/../etc", "/work/./x", "/has space/wt", "/glob/*/wt", "/brace/{a,b}", "/paren/(x)", "/work/wt\n", "", "/", 42, null];
    for (const worktree of bad) {
      for (const role of WRITERS) {
        assert.throws(() => argvFor(role, {}, worktree), TypeError, `${role} with worktree ${JSON.stringify(worktree)}`);
      }
    }
  });
});

describe("compileCeiling: a role with no ceiling gets today's settings", () => {
  for (const role of NO_CEILING_ROLES) {
    test(`${role}: no ceiling, and the argv is exactly what buildClaudeArgs gives without one`, () => {
      assert.ok(need("compileCeiling")(role, { worktree: WT }) == null, "null or undefined");
      assert.deepEqual(argvFor(role), need("buildClaudeArgs")({ sessionId: SID, agent: role }));
      const settings = settingsOf(argvFor(role, { ticketFile: TICKET }));
      assert.equal(Object.hasOwn(settings, "sandbox"), false, "no wall");
      assert.deepEqual(settings, { permissions: { deny: DENY, allow: [`Read(/${TICKET})`] } });
    });
  }

  test("every role is either in the four or in the five: none was forgotten", () => {
    assert.deepEqual(sorted([...CEILING_ROLES, ...NO_CEILING_ROLES]), sorted(ROLES));
  });
});
