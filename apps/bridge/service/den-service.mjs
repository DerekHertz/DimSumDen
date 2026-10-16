// den-mvp outcome 5 (ADR 0026 decision 4): `npm run den:install` and `npm run den:update`, the user's two commands that put the
// bridge under a systemd user service and move it to a new release. Both print what they will do first and each step's
// result, and both check the host before changing anything, so a refusal leaves nothing half-installed. No bridge route and
// no agent calls them: nothing under apps/bridge imports this file, and a test says so.
//   install()  fetch main, packages, first release, the four links, the unit, enable and start, check it answers
//   update(t)  fetch main and tags, packages if the lockfile changed, a release of the newest v* tag (or --main, or tag t),
//              the links, restart (skipped when nothing changed)
import { execFile } from "node:child_process";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveRoot } from "../../organism-infra/board-service.mjs";
import { createResourceLauncher, findUserBus } from "../cells/resource-group.mjs";
import { createBuildBox, findBwrap } from "../build/box.mjs";
import { createReleases, currentRelease } from "../build/releases.mjs";

export const UNIT_NAME = "den.service";
export const PORT = 4317;
const TEMPLATE = fileURLToPath(new URL("./den.service", import.meta.url));
const PLAIN = /^(?:\/[A-Za-z0-9._@+=,-]+)+$/; // a path that needs no quoting or escaping in a unit file
const PATH_ENTRY = /^\/[A-Za-z0-9._@+=,/ -]*$/;

export class DenServiceError extends Error {}

/** The unit text for this machine. Refuses any value that would need quoting in a unit file, rather than quoting it. */
export function renderUnit(template, { node, checkout, state, searchPath }) {
  for (const [name, value] of Object.entries({ node, checkout, state })) {
    if (typeof value !== "string" || !PLAIN.test(value)) throw new DenServiceError(`the ${name} path ${JSON.stringify(value)} has a character a unit file cannot hold safely; use a plainer path`);
  }
  // PATH is what `claude`, `git` and `gh` are found on: the entries of the installing shell's PATH that are plain, absolute paths.
  const entries = String(searchPath ?? "").split(":").filter((entry) => PATH_ENTRY.test(entry) && !entry.includes("//"));
  if (!entries.length) throw new DenServiceError("the installing shell's PATH has no usable entries");
  const out = template.replace(/@(NODE|CHECKOUT|STATE|PATH)@/g, (_, key) => ({ NODE: node, CHECKOUT: checkout, STATE: state, PATH: entries.join(":") })[key]);
  if (/@[A-Z]+@/.test(out.replace(/^#.*$/gm, ""))) throw new DenServiceError("the unit template has a mark that was not filled");
  return out;
}

const run = (file, args, opts = {}) => new Promise((resolve) => {
  execFile(file, args, { timeout: 120_000, maxBuffer: 4 * 1024 * 1024, ...opts }, (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout), err: String(stderr || err?.message || "").trim() }));
});

const defaultAnswers = async (url, { tries = 30, waitMs = 500 } = {}) => {
  for (let i = 0; i < tries; i += 1) {
    try {
      if ((await fetch(url)).status === 200) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return false;
};

/**
 * The host and its parts, each replaceable by a test. `systemctl(args)` -> { ok, out, err }; `answers(url)` -> boolean;
 * `releases` is a createReleases object; `git(args)` -> { ok, out, err } in the checkout.
 */
export function createDen({ env = process.env, say = (line) => console.log(line), platform = process.platform, node = process.execPath, repo, stateDir, unitDir, bus, bwrap, systemctl, git, answers = defaultAnswers, releases, remote = "origin" } = {}) {
  repo ??= resolveRoot(process.cwd(), env);
  const home = env.HOME || os.homedir();
  stateDir ??= path.join(env.XDG_STATE_HOME || path.join(home, ".local", "state"), "den");
  unitDir ??= path.join(env.XDG_CONFIG_HOME || path.join(home, ".config"), "systemd", "user");
  const unitFile = path.join(unitDir, UNIT_NAME);
  bus ??= findUserBus(env);
  if (bwrap === undefined) bwrap = findBwrap(); // null means there is none
  systemctl ??= (args) => run("systemctl", ["--user", ...args], { env: bus.env ?? {} });
  git ??= (args) => run("git", ["-C", repo, ...args]);
  releases ??= () => createReleases({ stateDir, repo, main: `${remote}/main`, box: createBuildBox({ launcher: createResourceLauncher({ env }) }) });
  let made;
  const rel = () => (made ??= typeof releases === "function" ? releases() : releases);

  // Nothing here changes anything: it is run before the first step so a refusal leaves the machine as it was.
  async function check() {
    if (platform !== "linux") throw new DenServiceError(`the den service needs Linux or WSL with systemd; this host is ${platform}`);
    if (!bus.env) throw new DenServiceError(`this host has no reachable systemd user manager: ${bus.reason}`);
    const manager = await systemctl(["show-environment"]);
    if (!manager.ok) throw new DenServiceError(`this host has no usable systemd user manager (systemctl --user: ${manager.err || "failed"})`);
    if (!bwrap) throw new DenServiceError("bubblewrap (bwrap) is not installed; the build box cannot be made without it (sudo apt install bubblewrap)");
    if (!(await stat(path.join(repo, ".git")).catch(() => null))) throw new DenServiceError(`${repo} is not a git checkout`);
    renderUnit("", { node, checkout: repo, state: stateDir, searchPath: env.PATH }); // the paths are plain enough for a unit file
  }

  const gitRaw = async (args) => {
    const out = await git(args);
    if (!out.ok) throw new DenServiceError(`git ${args[0]} failed: ${out.err}`);
    return out.out;
  };
  const gitOut = async (args) => (await gitRaw(args)).trim();

  async function steps(list) {
    say("This will:");
    list.forEach(([title], i) => say(`  ${i + 1}. ${title}`));
    for (const [title, fn] of list) {
      say(`> ${title}`);
      try {
        const result = await fn();
        say(`  done${result ? `: ${result}` : ""}`);
      } catch (err) {
        say(`  FAILED: ${err.message}`);
        throw err instanceof DenServiceError ? err : new DenServiceError(err.message);
      }
    }
  }

  // The files this script runs from the checkout while it builds a release of main (its imports, and the build box).
  const OWN_CODE = ["apps/bridge/service", "apps/bridge/build", "apps/bridge/cells/resource-group.mjs", "apps/organism-infra/board-service.mjs"];
  // Fetch main, then the packages and the release for its tip. `state.sha` is what the later steps use.
  // `target` is undefined (the newest v* tag), "--main" (the tip of main) or a tag name. Sets state.tag for a tag.
  const TAG = /^v\d+\.\d+\.\d+$/;
  const prepare = (state, target) => [
    [target === "--main" ? `fetch ${remote} main` : `fetch ${remote} main and its tags`, async () => {
      await gitOut(target === "--main" ? ["fetch", remote, "main"] : ["fetch", "--force", remote, "main", "+refs/tags/v*:refs/tags/v*"]);
      if (target === "--main") state.sha = await gitOut(["rev-parse", `${remote}/main`]);
      else {
        const known = (await gitOut(["tag", "--list", "v*", "--sort=-v:refname"])).split("\n").filter((t) => TAG.test(t));
        if (target === undefined && !known.length) throw new DenServiceError("there are no release tags yet; run npm run den:update -- --main to install the tip of main");
        if (target !== undefined && !known.includes(target)) throw new DenServiceError(`${JSON.stringify(target)} is not a known release tag; known: ${known.join(", ") || "none"}`);
        state.tag = target ?? known[0];
        state.sha = await gitOut(["rev-parse", `${state.tag}^{commit}`]);
      }
      // Friction F15: this script, and the box and wrapper it builds with, are the checkout's own files, not main's. A
      // checkout behind main whose copy of them differs builds the new release with the old code, so it stops here.
      const changed = (await gitOut(["diff", "--name-only", "HEAD", `${remote}/main`, "--", ...OWN_CODE])).split("\n").filter(Boolean);
      if (changed.length) {
        throw new DenServiceError(`the checkout's own install code differs from ${remote}/main (${changed.slice(0, 3).join(", ")}${changed.length > 3 ? ", ..." : ""}), and this script builds with the checkout's copy. Bring the checkout up to main (git switch main && git pull --ff-only), then run this again.`);
      }
      return state.sha.slice(0, 12);
    }],
    ["make the packages folder (needs the network, only here)", async () => {
      // The lockfile exactly as the release step will read it, so both hash it to the same packages folder.
      const [lockfile, packageJson] = await Promise.all(["package-lock.json", "package.json"].map((file) => gitRaw(["show", `${state.sha}:${file}`])));
      const { lock } = await rel().makeDeps({ lockfile, packageJson });
      return lock.slice(0, 12);
    }],
    ["build the release in the box", async () => (await rel().makeRelease(state.sha, state.tag ? { tag: state.tag } : {})).id],
  ];

  const LINKS = "switch the ui and bridge links";

  const check4317 = (what) => async () => {
    if (!(await answers(`http://127.0.0.1:${PORT}/`))) throw new DenServiceError(`the den did not answer on port ${PORT} after ${what}; see: journalctl --user -u ${UNIT_NAME} -n 50`);
    return `answers on ${PORT}`;
  };

  /** First install, and safe to run again. */
  async function install() {
    await check();
    const state = {};
    const template = await readFile(TEMPLATE, "utf8");
    await steps([
      ...prepare(state, "--main"),
      [LINKS, async () => {
        await rel().switchUi(state.sha);
        await rel().switchBridge(state.sha);
        return `ui and bridge at ${state.sha.slice(0, 12)}`;
      }],
      [`write ${unitFile}`, async () => {
        await mkdir(unitDir, { recursive: true });
        const tmp = `${unitFile}.new-${process.pid}`;
        try {
          await writeFile(tmp, renderUnit(template, { node, checkout: repo, state: stateDir, searchPath: env.PATH }));
          await rename(tmp, unitFile);
        } catch (err) {
          await rm(tmp, { force: true });
          throw err;
        }
      }],
      ["enable the service and (re)start it", async () => {
        for (const args of [["daemon-reload"], ["enable", UNIT_NAME], ["restart", UNIT_NAME]]) {
          const out = await systemctl(args);
          if (!out.ok) throw new DenServiceError(`systemctl --user ${args.join(" ")} failed: ${out.err}`);
        }
      }],
      ["check that the den answers", check4317("starting")],
    ]);
    say("The den runs as a user service. After a reboot or a WSL restart it comes back when your user manager starts.");
  }

  /** A release of the current main, the links, a restart. */
  async function update(target) {
    if (target !== undefined && target !== "--main" && !TAG.test(target)) throw new DenServiceError(`${JSON.stringify(target)} is not a release tag (v1.2.3) or --main`);
    await check();
    if (!(await stat(unitFile).catch(() => null))) throw new DenServiceError(`${unitFile} does not exist; run npm run den:install first`);
    const state = {};
    await steps([
      ...prepare(state, target),
      [LINKS, async () => {
        const before = await currentRelease(stateDir, "bridge");
        state.same = before?.sha === state.sha && (await currentRelease(stateDir, "ui"))?.sha === state.sha;
        await rel().switchUi(state.sha);
        await rel().switchBridge(state.sha);
        return state.same ? `already at ${state.sha.slice(0, 12)}` : `ui and bridge at ${state.sha.slice(0, 12)}`;
      }],
      ["restart the service (running agents are stopped and need Resume)", async () => {
        if (state.same) return "skipped, nothing changed";
        const out = await systemctl(["restart", UNIT_NAME]);
        if (!out.ok) throw new DenServiceError(`systemctl --user restart ${UNIT_NAME} failed: ${out.err}`);
      }],
      ["check that the den answers", check4317("the restart")],
    ]);
  }

  return { check, install, update, unitFile, stateDir };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  if (command !== "install" && command !== "update") {
    console.error("usage: node apps/bridge/service/den-service.mjs install | update [--main | vX.Y.Z]");
    process.exit(2);
  }
  try {
    await createDen()[command](...(command === "update" ? process.argv.slice(3, 4) : []));
  } catch (err) {
    console.error(err instanceof DenServiceError ? `den:${command} stopped: ${err.message}` : err);
    process.exit(1);
  }
}
