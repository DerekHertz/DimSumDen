# Process hygiene: servers, test runners, and stale locks

Cells start processes: dev servers, `node --test` runs, headless browsers. If a cell ends without stopping them, they keep ports open and use memory, and a stuck test runner can hang `npm test` for the next cell. On 2026-09-27, one ticket left 14 orphaned processes behind.

## Rules for cells

1. **Spawn so you can kill the whole tree.**
   - On Windows, `child.kill()` on a process started through `npm run` or with `shell: true` kills only the outer `cmd.exe`, and the real `node` process keeps running.
   - In code and tests, start servers in-process (import the server and call `close()`), or spawn `node <script>` directly without `shell: true`.
   - If you must go through npm, kill the whole process tree: `taskkill /pid <pid> /t /f` on win32 and a process-group kill elsewhere.
2. **Track what you start.** Note the PID and port of every long-running process you start.
3. **Stop it before you end.** Stop every process you started before your handoff. Check with:
   ```powershell
   Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match '<your script or port>' } | Select-Object ProcessId,CommandLine
   ```
4. **Kill by PID, one at a time, and only your own.** Never bulk-kill by name: other sessions, and the user, run `node` too. If a kill is denied, list the PIDs under `Environment issues` in your report and stop. Don't retry another way.
5. **Tests must exit.** A test that spawns a server must also prove the server is gone afterward. `npm test` hanging after its tests report `ok` counts as a failing test.
6. **Release your lock last, even when blocked.** If you end without releasing it, the orchestrator asks the user before deleting it. Never delete another cell's lock.

## For the orchestrator

When a cell returns, check for leftover processes from its worktree or ticket (the query in rule 3) and for its `.lock`. Show the user what you found, with PIDs, command lines and the lock owner. Kill or release only with their yes, and only the items you listed.
