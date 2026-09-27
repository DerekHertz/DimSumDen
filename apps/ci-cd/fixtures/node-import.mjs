// QA fixture for ci-cd/02: a browser module importing a node: built-in.
// Browsers refuse to resolve "node:" specifiers, so this import must fail,
// and `npm run smoke` must report it as a failed module import.
import fs from "node:fs";

fs.readFileSync; // reference the import so bundlers/linters don't drop it
