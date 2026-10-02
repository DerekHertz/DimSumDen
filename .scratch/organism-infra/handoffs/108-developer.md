# 108 apply-gated-script: developer handoff

```json
{
  "ticket": "organism-infra/108-apply-gated-script",
  "cell": "developer",
  "current_step": "scripts/apply-gated.mjs implemented on feat/108-apply-gated (bb59eb6, on qa's 8382de2); qa's 18 tests pass untouched; full npm test 1830/1830. Ready for qa light verify.",
  "artifacts": [
    "branch feat/108-apply-gated @ bb59eb6",
    "scripts/apply-gated.mjs",
    "scripts/apply-gated.extra.test.mjs",
    "docs/agents/gated-patches.md",
    "package.json (apply-gated script)",
    "/tmp/108-gated-patch-wording.patch (gated .claude edits; orchestrator places it in .scratch/_handoffs/gated/108-gated-patch-wording.patch)"
  ],
  "decisions": [
    "Check order per patch: git apply --check first, then stat and diff, then the dirty-path guard, then the prompt. A failing patch never consumes a stdin answer.",
    "Exit code is 1 when any patch failed its check, was refused, or failed to commit; 0 for applied or skipped only; 2 for a usage or root error.",
    "Commit message comes from git mailinfo (strips [PATCH], unfolds long subjects, cuts at ---). A plain diff gets 'Apply gated patch <stem>'.",
    "Commit uses git add -A -- <paths> then git commit -m <msg> -- <paths>; paths come from git apply --numstat -z plus 'rename from' header lines so renames commit both paths. --literal-pathspecs on every git call.",
    "Beyond the spec: a patch whose target paths already have uncommitted changes is refused (left in place), because the path-limited commit would sweep those edits in. On commit failure the apply is reversed (git apply -R) and the patch stays.",
    "Beyond the spec: patch text and names are printed with control characters replaced, so a patch cannot inject terminal escapes.",
    "A name collision in applied/ gets a timestamp suffix rather than overwriting.",
    "qa's scripts/apply-gated.test.mjs is untouched; added cases live in scripts/apply-gated.extra.test.mjs (dirty target refused, rename commits both paths).",
    "Gated .claude edits were not made: they are in /tmp/108-gated-patch-wording.patch (developer.md step 4 bullet, organism-protocol gates paragraph); it passes git apply --check on this branch."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Light verify: diff scripts/apply-gated.test.mjs against 8382de2 (must be empty), rerun both apply-gated test files, npm run risk-check",
      "owner": "qa"
    },
    {
      "item": "Place the wording patch at .scratch/_handoffs/gated/108-gated-patch-wording.patch; the user runs !npm run apply-gated after merge to land the .claude edits",
      "owner": "orchestrator"
    }
  ]
}
```

## Notes
- Unspecified-by-qa choices: a failed patch exits 1 at the end; it does not stop later patches.
- Self-review only (no code-review subagent run); the diff is one script plus tests and a doc.
