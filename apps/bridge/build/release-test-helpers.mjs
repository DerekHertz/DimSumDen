// Test-only: release folders made by hand in a state folder, with no repository and no build box. Each has a build.json
// and a one-file UI build that names its commit. Production never imports this file.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createReleases } from "./releases.mjs";

export const SHA_A = "a1".repeat(20);
export const SHA_B = "b2".repeat(20);
export const SHA_C = "c3".repeat(20);

/** One complete release of `sha` under `stateDir`. `index: false` leaves its index.html out (a build that does not load). */
export async function putRelease(stateDir, sha, { index = true } = {}) {
  const dir = path.join(stateDir, "releases", sha.slice(0, 12));
  await mkdir(path.join(dir, "apps/ui/dist/assets"), { recursive: true });
  if (index) await writeFile(path.join(dir, "apps/ui/dist/index.html"), `<!doctype html><title>den ${sha.slice(0, 12)}</title>`);
  await writeFile(path.join(dir, "apps/ui/dist/assets", `app-${sha.slice(0, 8)}.js`), `export const build = "${sha}";`);
  await writeFile(path.join(dir, "build.json"), `${JSON.stringify({ sha, builtAt: "2026-10-13T08:00:00.000Z", lock: "0".repeat(64) })}\n`);
  return dir;
}

/** Releases of each sha, switched to in order: the last is ui/current and the one before it ui/previous. -> the releases object */
export async function liveReleases(stateDir, shas, options) {
  const releases = createReleases({ stateDir });
  for (const sha of shas) {
    await putRelease(stateDir, sha, options?.[sha]);
    await releases.switchUi(sha);
  }
  return releases;
}
