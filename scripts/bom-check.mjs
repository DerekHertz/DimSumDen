#!/usr/bin/env node
// organism-infra/25: a pre-commit/CI check that rejects a UTF-8 BOM in .md
// and .json files. PowerShell 5.1's `Set-Content -Encoding utf8` writes a
// BOM, which then trips markdown/JSON parsers downstream (the incident this
// ticket comes from). Given a list of file paths, the script exits 0 when
// none of the .md/.json files among them start with a UTF-8 BOM
// (EF BB BF), and non-zero when at least one does, printing the offending
// path(s) so the failure is actionable in a hook or CI log.
//
// Usage: node scripts/bom-check.mjs [file ...]
//   With no arguments, it scans git-tracked *.md and *.json files (the CI /
//   pre-commit default). With explicit arguments, it checks exactly those
//   paths, ignoring any that aren't .md or .json.
//
// See .scratch/organism-infra/issues/25-shell-and-git-guidance.md.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const CHECKED_EXT_RE = /\.(md|json)$/i;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function gitTrackedTargets() {
  return git(["ls-files", "*.md", "*.json"]).split("\n").filter(Boolean);
}

function hasBom(filePath) {
  const contents = readFileSync(filePath);
  return (
    contents.length >= 3 &&
    contents[0] === UTF8_BOM[0] &&
    contents[1] === UTF8_BOM[1] &&
    contents[2] === UTF8_BOM[2]
  );
}

function main() {
  const args = process.argv.slice(2);
  const targets = (args.length > 0 ? args : gitTrackedTargets()).filter((p) => CHECKED_EXT_RE.test(p));

  const offenders = targets.filter((p) => hasBom(p));

  if (offenders.length === 0) {
    console.log(`bom-check: clean (${targets.length} file(s) checked)`);
    return 0;
  }

  console.log(`bom-check: ${offenders.length} file(s) start with a UTF-8 BOM`);
  for (const file of offenders) {
    console.log(file);
  }
  return 1;
}

process.exit(main());
