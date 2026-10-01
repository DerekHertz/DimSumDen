#!/usr/bin/env node
// Provider routing happens before either adapter reads credentials or starts I/O.
const args = process.argv.slice(2);
const provider = args.length === 0 ? "claude" : args.length === 2 && args[0] === "--provider" ? args[1] : null;
if (!["claude", "codex"].includes(provider)) {
  console.error("usage: expected --provider claude|codex");
  process.exit(1);
}
if (provider === "claude") await import("./usage-claude.mjs");
else {
  try {
    const { readCodexUsage } = await import("./usage-codex.mjs");
    console.log(JSON.stringify(await readCodexUsage()));
  } catch (error) {
    console.error(`usage: codex ${error.message}`);
    process.exitCode = 1;
  }
}
