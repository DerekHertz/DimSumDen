```json
{"ticket": "agent-os/02-grants", "cell": "designer", "mode": "spec", "current_step": "UI spec for grants at Start and wall notices signed off by the user 2026-10-10; ready for qa specify",
 "artifacts": ["https://claude.ai/artifact/Tk1KDW39ETgrbU8hrLG4NY", "https://claude.ai/artifact/7YgT5ZiBLoDKssdDD42KBg"],
 "decisions": ["Start box shows a two-sided wall table: Runs without asking / Asks you first (user, 2026-10-10)", "The panda's card folds to its name while the Start box is open (user)", "Refusals 1 and 2 show in ink with a brick mark; lantern only at the pause (user)", "Three of the same kind counts by kind: hosts together, writes together (user)", "Keep refused resumes the agent and restarts that kind's count (user)", "Open/Closed sign: a plaque in the top bar beside the logo (user); spec waits for step 7"],
 "failures": [],
 "pending": [
  {"item": "Copy the UI spec below into the ticket and dispatch qa specify", "owner": "orchestrator"},
  {"item": "The bridge sends each role's table lines; the UI holds no ceiling of its own", "owner": "developer"},
  {"item": "Role ceilings for designer, architect, product and herald", "owner": "product"},
  {"item": "Specs for the Open/Closed sign, Bao's states and card, station poses and walk speed, when their steps are ticketed", "owner": "designer"}]}
```

# Designer spec: agent-os/02, grants at Start and wall notices

**State:** done. Signed off by the user 2026-10-10 (question tool: "Signed off"). Written by a plain session acting as designer.

Mockup: https://claude.ai/artifact/Tk1KDW39ETgrbU8hrLG4NY (sections 1 and 2).

## A. Grants at Start

### Layout
In the Start box (`MessageComposer`, start use only), a wall table sits between the textarea and the key hints. It never shows in the message use.
- Table: two equal columns, 1px `line` border, `radius-m`, 12px/16px text, 8px padding per column. Left column on the box's own ground; right column on `surface-300`, divided from the left by a 2px `line-strong` rule (the wall).
- Left heading `Runs without asking`, right heading `Asks you first`, both weight 800. Under each, a plain list.
- A granted line is on the left, after the role's lines: `+ {value}` in `qi`, weight 600, with a remove button (`×`, `ink-muted`, 24px hit area) at the line's right edge.
- `Add a grant` is a text button in `qi`, underlined, at the foot of the right column. Absent for a role that takes no grants.
- Add row, under the table: kind select (`Host`, `Path`), value input in `font-mono`, `Add` button; all 32px high, `radius-m`, 1px `line-strong`, `surface-200` fill. Under it a hint line: `Enter add` · `Esc close this row`. One row at a time.
- While the Start box is open, the panda's card above it folds to station line plus name (padding 10px 20px, name 17px/22px). State, ticket, result and the four action buttons are hidden. It unfolds when the box closes. No animation.

### Lines per role
The UI renders the lines the bridge sends and holds no ceiling of its own.

| Role | Runs without asking | Asks you first | Add a grant |
| --- | --- | --- | --- |
| developer, qa | `Write in its worktree`, `Read the project`, then one line per project host | `Any other host`, `Any path outside` | yes |
| security | `Read the project`, `Write its report in its worktree` | `Any host`, `Any other write` | yes |
| scout | `Read the project`, `Read the web` | `Nothing. It cannot write, push or merge.` | no |

- With no project hosts (true until a project has a host list), the host lines are absent and the right side reads `Any host`.
- Once a host is granted the right side reads `Any other host`; once a path is granted, `Any other path outside`.

### Interaction
- Enter in the textarea starts the task, as today, with the grants listed. No grants is the default and costs no extra key.
- Tab order: textarea, each grant's remove button, `Add a grant`, Cancel, Start.
- `Add a grant` opens the row and focuses the kind select. Enter in the row adds the grant, clears the value and keeps the row open. Esc in the row closes the row and returns focus to `Add a grant`; a second Esc closes the box.
- The box checks an entry before adding it. Host: a lower-case DNS name with at least one dot; no scheme, port or path; no IP address; not `localhost` or `localhost.*`. Path: absolute or starting `~/`, with no `..` segment. A duplicate is refused.
- At most 6 grants (the designer's number, to keep the box inside an 800px window). At 6, `Add a grant` is disabled with the reason `Six grants at most`.
- A refused entry keeps the row open, turns the input border `alarm`, and shows the reason under it in `alarm`, 12px weight 600.
- A draft keeps its grants with its text (same draft key).
- The grants go to the bridge as data in the fixed shape `{ kind: "host" | "path", value }`. The UI never builds a flag or prompt text from them.

### States
| State | What shows |
| --- | --- |
| Opens | Table for the role, no granted lines, row closed |
| Adding | Row open with hint line; `Add a grant` hidden |
| Entry refused | Row open, `alarm` border and reason |
| Grants added | `+` lines with remove buttons; right side wording updated |
| Starting | Table and row read-only, remove buttons disabled, existing spinner |
| Bridge refused the Start (400) | Existing `message-banner`, naming the grant; text and grants kept |
| Scout | Table only, no `Add a grant` |
| Demo mode | Box does not open (existing rule) |
| Reduced motion | Nothing new moves |
| Light and dark | Tokens only; text 4.5:1, rules and glyphs 3:1 |
| Phone | Same 330px dock; Cancel and Start buttons show as today |

### Copy
`Runs without asking` / `Asks you first` / `Add a grant` / `Host` / `Path` / `Add` / `Use a host name. IP addresses and localhost can't be granted.` / `Use a full path, or one starting with ~/.` / `Already granted.` / `Six grants at most` / `Not started. The bridge refused the grant "{value}": {reason} Remove it, then press Enter to try again.`

Announcements (polite): `Grant added: {value}.` / `Grant removed: {value}.`

### Accessibility
WCAG 2.1 AA. The table is a `group` labelled `What this agent may do`, holding two headed lists (not a `table`). A granted line reads `Granted, {kind} {value}`; its button is `Remove {value}`. The row's inputs are labelled `Kind` and `Value`. The error is tied to the input with `aria-describedby` and `aria-invalid`. Focus ring as elsewhere: 2px `focus-ring`, 2px offset.

## B. Wall notices

Counts are per agent and per kind: refused hosts together, refused writes together. The pause comes at the third of one kind. A file-tool request outside the worktree stays an ordinary permission request and gets no wall mark.

### Wall glyph
A 16×12 brick mark (outlined rounded rectangle, one course line, three joints), 1.4px stroke in `currentColor`. `ink-muted` before the pause, `lantern` at the pause.

### On the card
`ProximityCard`, between the ticket line and the actions. One line per kind that has a count, hosts first.
- Host: glyph, `Wall refused a host · {n} of 3`, and under it the latest host in 12px `ink-muted`.
- Write: glyph, `Looks like a refused write · {n} of 3`, and under it the path if one can be read from the command, else nothing.
- Text 13px/18px `ink`. No `lantern`, no `alarm`.
- Paused: state reads `Needs your answer`; the existing lantern line reads `Paused at the wall · waiting on you`; the paused kind's line turns `lantern` and reads `3 refused hosts` or `3 refused writes`. Q becomes `Keep refused`, E becomes `Grant`, both with the reason `Opens the wall request`.
- The lines go when the agent ends or when their count restarts.

### In the transcript
A notice row directly after the tool row it belongs to: glyph plus text, 13px/18px, 8px 12px padding, 1px dashed `line-strong`, `radius-m`.
- Host: `The wall refused {host}. {n} of 3` / small `Not on this task's hosts. The agent carries on.` The tool row's status word is `refused`.
- Write: `Looks like the wall refused a write outside the worktree. {n} of 3` / small `Matched on "Read-only file system". Open the command to check.` The tool row's status word stays `failed`.
- Pause row: solid 1px `lantern` border on `surface-100`; `Paused after 3 refused hosts.` (or `writes`) `Waiting on you.`; the targets; and the existing Deny/Allow button pair relabelled `Keep refused` / `Grant for this task`. Both open the wall request.
- Once answered, the row reads `Granted {value} for this task` or `Kept refused` in the answered style.

### The wall request
Reuses `ApprovalPanel`: same place, size, keys (Q, E, Esc), note field and footer.
- Overline `Wall request`; heading `{name} is paused at the wall`; meta `3 refused hosts · {ticket ref}`; the lantern line `Waiting on you`. No expiry label.
- Label `What was refused`; the well lists the three commands, one per line, each with its time.
- Hosts: under the well, one checkbox per distinct host: `Grant host {host} for this task`, caption `Ends when this agent ends. The project's host list is not changed.` One host: checked. Several: none checked, and E is disabled with the reason `Choose what to grant` until one is.
- Writes: one text input labelled `Path to grant for this task`, filled with the path read from the command or empty, checked by the Start box's rule, with the caption `Matched by text. Check the commands above.`
- Footer: `Keep refused` `Q` and `Grant for this task` `E`.
- Keep refused: the agent resumes with the note, that kind's count restarts at 0, its card line goes.
- Grant: the agent resumes with the grant, and the count restarts.
- Announcement (polite) at the pause only: `{name} is paused at the wall. 3 refused hosts.` Single refusals are not announced.
- Demo mode: Q and E are off with `Demo mode: actions are off`.

## Tokens used (all exist)
surface-100, surface-200, surface-300, surface-glass, line, line-strong, ink, ink-muted, qi, qi-fill, on-qi, lantern, alarm, focus-ring, radius-s, radius-m, radius-l, space-1..4, shadow-panel, font-mono.

## For qa specify (criteria mapping)
1. Start box, start use: the table renders the lines the bridge sends for developer, security and scout; scout has no `Add a grant`; the message use has no table.
2. Add, refuse (IP, `localhost`, scheme, relative path, duplicate, seventh), remove. Enter in the row adds and does not start. Esc closes the row only.
3. `startTask` receives the grants in the fixed shape. A 400 shows the banner and keeps text and grants.
4. The card folds while the Start box is open and unfolds after.
5. Card and transcript notices from stub events for a refused host and a refused write, with counts per kind. The third of a kind shows the paused state and the relabelled Q and E.
6. Wall request: one host, several hosts, the write path input, the Keep refused and Grant calls, counts restart.

No browser-measurement tests: layout comes from the mockup.

## Left open
- What the bridge does with a pause while the user is away is step 7 (presence), not this ticket.

## Directions for later steps (user, 2026-10-10; not part of agent-os/02)

These are directions the user picked from first sketches. Each needs its own spec before a build.

- **Open/Closed sign (step 7).** A plaque button in the top bar beside the logo pill, at every zoom level and on a phone. Three states by word and mark shape: `Open` (filled dot), `Closed` (ring, with `· {n} kept`), `Away` (half dot, with `· idle {m} min`). Its popover holds the idle limit (`Away after {10} min without input`). On return, one line: `Welcome back. {n} requests were kept. {m} pandas handed off and stopped.` Mockup section 3 of the grants artifact. A sign hung in the den and a switch on the Needs you header were shown and not chosen.
- **Bao (step 6).** Mockup: https://claude.ai/artifact/7YgT5ZiBLoDKssdDD42KBg. Bao stays the giant seated panda at the centre and never leaves his seat. He is asleep between events and wakes when poked or when an event arrives (the user's words).
  - Five states by pose and mark: Asleep (eyes closed, head tipped, slow breath, a "z"), Waking (ear flick, eyes half open, a spark, under a second), Awake (eyes open, an order slip in his paw), Asks you (his lantern lights), Trouble (alarm mark, stays awake until looked at). Reduced motion keeps the poses and stops the movement.
  - Card: the rail plus two wakes. State line (`Asleep · last woke 14:20 for 38 s`), the lantern line for what he asks, `On the rail` (each ticket or PR with who has it), then `Last wakes` with the two newest, each a time, why he woke and what he did. Q and E open his request, R opens the last wake's transcript, T is `Poke` (`Wakes Bao with a message`).
- **Pandas at stations (den art).** A resident with no agent rests beside its desk, dimmed. Only a panda with a running agent works at the desk. Waiting on you: work stops, the panda looks up, the station lantern lights. Paused at the wall: as waiting, with the brick mark over the desk. Nobody roams. The mockup's section 3 table gives each role's desk, working motion and idle motion.
- **Walk speed.** Default 3.0 units/s walking and 5.0 sprinting (today 2.1 and 3.5), with a slider in the panda settings.
