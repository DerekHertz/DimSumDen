// den-mvp/49: onboard, list and remove projects the den can run agents in (ADR 0021 Amendment 5).
//   npm run den:project -- add <slug> <path> [--board markdown|github-issues] [--repo owner/name]
//   npm run den:project -- list | remove <slug>
import { homedir } from "node:os";
import path from "node:path";
import { addProject, createProjects, removeProject } from "../apps/bridge/projects.mjs";

const stateHome = path.isAbsolute(process.env.XDG_STATE_HOME ?? "") ? process.env.XDG_STATE_HOME : path.join(homedir(), ".local", "state");
const denState = path.isAbsolute(process.env.DEN_STATE_DIR ?? "") ? process.env.DEN_STATE_DIR : path.join(stateHome, "den");
const [cmd, ...rest] = process.argv.slice(2);
const flag = (name) => (rest.includes(`--${name}`) ? rest[rest.indexOf(`--${name}`) + 1] : undefined);
let result;
if (cmd === "add") {
  const [slug, dir] = rest;
  result = await addProject(denState, { slug, path: dir === undefined ? undefined : path.resolve(dir), board: { kind: flag("board") ?? "markdown", repo: flag("repo") } });
} else if (cmd === "remove") {
  result = await removeProject(denState, rest[0]);
} else if (cmd === "list") {
  for (const p of await createProjects({ control: process.cwd(), denState }).list()) console.log(`${p.active ? "*" : " "} ${p.slug}\t${p.board.kind}\t${p.path}`);
  result = { ok: true };
} else {
  console.error("usage: den:project -- add <slug> <path> [--board kind] [--repo owner/name] | list | remove <slug>");
  process.exit(2);
}
if (!result.ok) {
  console.error(`den:project: ${result.reason}`);
  process.exit(1);
}
