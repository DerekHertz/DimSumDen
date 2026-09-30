#!/usr/bin/env node
// organism-infra/54: `node scripts/board.mjs <args>` is `npm run board -- <args>`.
// The board CLI reads process.argv and sets process.exitCode itself.
import "../apps/organism-infra/board.mjs";
