// Test-only: a launcher with no resource group, for tests that drive the stub CLI on hosts with no user service manager
// (CI). Production never imports this file; createClaudeRuntime's default is the enforced launcher (resource-group.mjs).
import { spawn } from "node:child_process";

export function unconfinedLauncher() {
  return {
    enforced: false,
    preflight: async () => ({ ok: true }),
    async launch({ bin, args, cwd, env }) {
      const child = spawn(bin, args, { shell: false, detached: true, cwd, env, stdio: ["pipe", "pipe", "pipe"] });
      await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("spawn", resolve);
      });
      return { child, group: null };
    },
  };
}
