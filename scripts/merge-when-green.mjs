#!/usr/bin/env node
// Merge a pull request only once its checks exist, have all finished, and every one passed (2026-10-16: #309 was merged
// on a red check, and an empty check list read as "all green"). Usage: node scripts/merge-when-green.mjs <pr> [--timeout-min N]
// Exit 0 merged; 1 a check failed or was cancelled (named); 2 bad arguments, or no verdict before the timeout.
import { execFileSync } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { pathToFileURL } from "node:url";

/** checks: [{ name, bucket }] from `gh pr checks --json name,bucket`. -> { state: "wait"|"pass"|"fail", failed: [name] } */
export function verdict(checks) {
  if (!Array.isArray(checks) || checks.length === 0) return { state: "wait", failed: [] };
  const failed = checks.filter((c) => c.bucket === "fail" || c.bucket === "cancel").map((c) => c.name);
  if (failed.length) return { state: "fail", failed };
  if (checks.some((c) => c.bucket !== "pass" && c.bucket !== "skipping")) return { state: "wait", failed: [] };
  if (!checks.some((c) => c.bucket === "pass")) return { state: "wait", failed: [] };
  return { state: "pass", failed: [] };
}

function readChecks(pr) {
  try {
    return JSON.parse(execFileSync("gh", ["pr", "checks", String(pr), "--json", "name,bucket"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  } catch (err) {
    // gh exits non-zero while checks fail or are pending; its stdout still holds the list.
    try { return JSON.parse(err.stdout || "[]"); } catch { return []; }
  }
}

async function main(argv) {
  const pr = Number(argv[0]);
  const t = argv.indexOf("--timeout-min");
  const minutes = t >= 0 ? Number(argv[t + 1]) : 20;
  if (!Number.isInteger(pr) || pr < 1 || !(minutes > 0)) {
    console.error("usage: node scripts/merge-when-green.mjs <pr> [--timeout-min N]");
    return 2;
  }
  const deadline = Date.now() + minutes * 60_000;
  for (;;) {
    const checks = readChecks(pr);
    const v = verdict(checks);
    if (v.state === "fail") {
      console.error(`#${pr} not merged: ${v.failed.join(", ")} failed`);
      return 1;
    }
    if (v.state === "pass") {
      execFileSync("gh", ["pr", "merge", String(pr), "--merge"], { stdio: "inherit" });
      console.log(`#${pr} merged: ${checks.map((c) => `${c.name} ${c.bucket}`).join(", ")}`);
      return 0;
    }
    if (Date.now() > deadline) {
      console.error(`#${pr} not merged: no verdict in ${minutes} min (${checks.map((c) => `${c.name} ${c.bucket}`).join(", ") || "no checks yet"})`);
      return 2;
    }
    await wait(20_000);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
