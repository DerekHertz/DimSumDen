// den-mvp/11 (ADR 0026 decision 7): the recovery page, read once from the bridge's own code. It is served at /recover
// with its one script at /recover/script, and it works when the UI build does not load.
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(`./recover/${name}`, import.meta.url));
export const RECOVER_HTML = read("page.html");
export const RECOVER_SCRIPT = read("page.js");
