// Test-only: a probe build folder for the build box. Its Vite config is the "candidate code": it tries what the box
// must stop (reading the home directory, writing outside the folder, opening a connection), writes what happened to
// probe.json in the folder, and then lets a tiny real build run. Production never imports this file.
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROBE_CONFIG = `import fs from "node:fs";
import net from "node:net";
const input = JSON.parse(fs.readFileSync("/build/probe-input.json", "utf8"));
const attempt = (fn) => {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, code: err.code };
  }
};
const out = {
  reads: Object.fromEntries((input.reads ?? []).map((file) => [file, attempt(() => fs.readFileSync(file, "utf8"))])),
  lists: Object.fromEntries((input.lists ?? []).map((dir) => [dir, attempt(() => fs.readdirSync(dir))])),
  writes: Object.fromEntries((input.writes ?? []).map((file) => [file, attempt(() => fs.writeFileSync(file, "probe"))])),
  env: Object.keys(process.env).sort(),
  root: fs.readdirSync("/").sort(),
  pid: process.pid,
};
if (input.port) {
  out.net = await new Promise((resolve) => {
    const socket = net.connect(input.port, "127.0.0.1");
    socket.once("connect", () => (socket.destroy(), resolve({ ok: true })));
    socket.once("error", (err) => resolve({ ok: false, code: err.code }));
  });
}
fs.writeFileSync("/build/probe.json", JSON.stringify(out));
if (input.sleep) await new Promise(() => setInterval(() => {}, 1000));
const dist = "/build/apps/ui/dist";
const after = {
  name: "probe-after",
  closeBundle() {
    if (input.symlink) fs.symlinkSync("/build/probe-input.json", dist + "/link.json");
    if (input.hardlink) fs.linkSync(dist + "/index.html", dist + "/twin.html");
    for (let i = 0; i < (input.extraFiles ?? 0); i += 1) fs.writeFileSync(dist + "/extra-" + i + ".txt", "x");
    if (input.extraBytes) fs.writeFileSync(dist + "/big.bin", Buffer.alloc(input.extraBytes));
  },
};
export default { root: "/build/apps/ui", logLevel: "warn", build: { outDir: dist, emptyOutDir: true }, plugins: [after] };
`;

/** Makes a probe folder under the system temp directory. -> its path */
export async function makeProbeFolder(input = {}) {
  const folder = await mkdtemp(path.join(tmpdir(), "den-box-probe-"));
  await mkdir(path.join(folder, "apps/ui"), { recursive: true });
  await writeFile(path.join(folder, "apps/ui/vite.config.mjs"), PROBE_CONFIG);
  await writeFile(path.join(folder, "apps/ui/index.html"), "<!doctype html><title>probe</title><p>probe</p>\n");
  await writeFile(path.join(folder, "probe-input.json"), JSON.stringify(input));
  return folder;
}

/** The nearest node_modules above this file that holds Vite (the checkout's own, or the main checkout's from a worktree), or null. */
export function findPackages() {
  for (let dir = path.dirname(fileURLToPath(import.meta.url)); ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, "node_modules/vite/bin/vite.js"))) return path.join(dir, "node_modules");
    if (dir === path.dirname(dir)) return null;
  }
}
