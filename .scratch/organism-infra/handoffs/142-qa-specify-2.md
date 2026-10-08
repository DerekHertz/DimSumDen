# 142 qa specify (round 2): red run done, ready for the developer

```json
{
  "ticket": "organism-infra/142-steering-adapter-pure",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Red run done on tests/142-steering-adapter-pure @ 8756d90 (specify sha). 74 tests: 70 fail, 4 pass. Every failure is 'claude-adapter.mjs must export the function X' (or 'CLAUDE_MODELS must be an exported non-empty list'); no syntax or setup error. The 4 passes are the fixture-hygiene guards, passing by design. Ready for the developer.",
  "artifacts": [
    "apps/bridge/cells/claude-adapter.test.mjs (branch tests/142-steering-adapter-pure @ 8756d90)",
    "apps/bridge/cells/fixtures/s1.jsonl, s2.jsonl, s3-allow.jsonl, s3-deny.jsonl, s4b-eof.jsonl, s6b.jsonl, s8.jsonl"
  ],
  "decisions": [
    "Interface and criterion-to-test map are unchanged from 142-qa-specify.md; the developer implements only apps/bridge/cells/claude-adapter.mjs (policy.mjs already exports ROLES and UUID_RE for reuse).",
    "Fixed two vacuous tests found in the red run: the encodeControlResponse 'request id not a string of at most 128' and 'allow without a plain-object input is refused' tests resolved the function inside assert.throws, so the missing-export error satisfied them (one passed while red). They now resolve it first, so they can only pass on a real throw.",
    "The 'allow is the shape the CLI honoured' test now checks a trailing newline plus deepEqual of parsed JSON against controlResponseLine, not string equality (key-order proof).",
    "Hostile-shapes list now has { type: 'user', message: { content: 5 } } and a tool_result array with null and 3 entries, replacing the oddly written leftover.",
    "Open interpretation for the developer: a usage event must have output == usage.output_tokens and input >= input_tokens (integer). The ADR does not say whether cache tokens are included; either is accepted."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement apps/bridge/cells/claude-adapter.mjs to make all 74 tests pass; do not edit the test file or fixtures. Run npm test and npm run risk-check before release at in-review.",
      "owner": "developer"
    }
  ]
}
```

No criterion is human-verified. Run: `node --test apps/bridge/cells/claude-adapter.test.mjs`.
