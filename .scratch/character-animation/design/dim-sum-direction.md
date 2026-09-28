# Direction: Bao's dim sum house in the bamboo grove

Ticket: `character-animation/12`. This is direction only: no assets, no code, and the rename is not applied.

## 1. Setting

Bao stays the giant plush panda sitting in the grove, and the existing perch regions (crown, shoulder, knee, grass) stay. Only the dressing changes: Bao *is* the restaurant. A small teahouse is built on and around the sitting panda, so each perch becomes a station and no anchor from ticket 05 moves.

| Organ | Place | Perch region | Dressing |
|---|---|---|---|
| Brain (orchestrator, product, architect) | The pass, the head chef's counter where orders are called | Crown | Low lacquered pass rail across Bao's head, with a ticket rail of hanging order slips |
| Muscles (developer, scout, debugger) | Steamers and prep | Shoulders and arms | Bamboo steamer stacks cradled in Bao's arms. The scout's lantern is the pantry run |
| Immune (qa, security) | Tea master (qa tastes) and door warden (security checks the pantry seal) | Knees and lap | Tea tray on Bao's lap, and a small pantry door by the knee for security |
| Skin (designer) | Front of house: plating and garnish | Grass in front | Serving cart and a menu stand |

Boards:
- **Issues** are order slips clipped on the pass rail. Their colour is the existing status token, with no new colours.
- **PRs** are plated dishes waiting on the pass for the head chef to call "service".
- **Queue** is the steamer stack itself. Each ready ticket is a basket, and the top basket is next.
- **Approval Inbox** is the service bell on the pass. Bao's glance (ticket 09) goes to the bell.
- The **handoff qi bead** (ticket 06) becomes a single dumpling passed along the pathway on a small bamboo tray. The pathway rule and timing stay.

Palette: keep the existing plush tokens and add only the warm accents already present (lantern and steam whites). No ink outlines, and no materials beyond baked-fuzz fabric and matte bamboo (ticket 10).

## 2. Tool-call animations

Each one is a clip on the shared rig with a prop swap, and each has a held pose for reduced motion. Props are small single-mesh socket props that follow ticket 07's contract.

| Event | Reference (AgentSystemLabs) | Bao version | Reduced-motion hold |
|---|---|---|---|
| Read | Flips papers | Flips through order slips on a clip | Holds one slip, eyes down |
| Edit | Hunched typing | Pleats a dumpling with quick paw pinches | Paws together over a half-pleated dumpling |
| Test or build | Leans back, hands behind head | Leans back while a steamer rattles, with a wisp of steam | Leaning back, steamer lid shut |
| Web search | Spinning globe | Peers into the pantry with the lantern (reuses the scout's lantern) | Lantern raised |
| Failed twice | Head in hands | Lifts the lid on a sad, flat dumpling, paws on cheeks | Paws on cheeks, lid tilted |
| Waiting on user | Jump, arms crossed, foot tap | Small hop, taps the service bell once, then waits with a foot tap | Paw resting on the bell |
| Done | Spin and confetti | Steamer lid lifts with one puff of steam and a happy squish | Lid open, "happy" face frame |
| Merge celebration | Gong | Bao rings the pass bell and nearby cells bow once | Bell still, cells in the bow pose |

Budget: steam is one shared pool of billboard sprites (at most 4 active), with no per-cell particles. Each event gets one puff at `dur-base`. This stays inside ticket 10's 30-cell budget. The bell sound is optional and off by default.

## 3. Name shortlist

The clash checks are **unverified**: this run had no web lookup. A scout should search each name before anything goes public.

| Name | Rationale | Clash check |
|---|---|---|
| **Bao House** | Names the mascot and the restaurant at once | Likely shared with many restaurants; fine for a local tool, weak for search |
| **Dim Sum Den** | Cozy and alliterative, and it reads as a place | Unverified |
| **Steamer Stack** | Named after the queue metaphor; very on-theme | Unverified |
| **Yum Cha** | "Drink tea": the ritual of many small dishes, like many small tickets | Common phrase; restaurants likely use it |
| **The Pass** | Kitchen term for where orders are called and checked | Generic word, hard to search |
| **Bamboo Steamer** | The grove and the kitchen in one object | Unverified |
| **Har Gow** | One well-made dumpling stands for one well-made ticket | Unverified |

Recommendation: **Bao House** for the product, with "the pass", "steamers" and "order slips" as UI vocabulary. "Agent Office" overlaps directly with AgentSystemLabs/agent-office (MIT, same concept), so rename before any public release. Applying the rename touches `CONTEXT.md`, `CLAUDE.md` and the repo name, which is a brain gate for the user.

## 4. Impact on tickets 04-11

| Ticket | Change |
|---|---|
| 04 One cell shows its state | Add tool-call sub-states (read, edit, test, search) under `working`, and give failed, waiting and done the clips above. The director mapping grows; the state set does not |
| 05 Travel between perches | Paths don't change. Perch regions are renamed as stations, in copy only |
| 06 Handoff choreography | The qi bead is dressed as a dumpling on a tray; timing is unchanged |
| 07 Props and Brain habits | Brain props gain the order-slip clip and the pass bell. The fan, scroll and blueprint either stay or become a ladle and menu (open question 3) |
| 08 Muscle and Immune habits | Developer: pleating. Scout: keeps the lantern. qa: keeps the tea sip. Security: stares at the pantry door |
| 09 Bao's ambient life | The glance target becomes the service bell; yawn and doze are unchanged |
| 10 Plush look at 30 cells | Add the steam sprite pool to the perf budget |
| 11 Prop polish | New props (steamer, slip clip, bell, dumpling) follow the same socket rules |

## Open questions

1. Adopt Bao as the restaurant (perches kept), or build a separate restaurant set with Bao as host (which breaks ticket 05's perches)?
2. Which name, and when should the rename be applied?
3. Keep the Brain props (fan, scroll, blueprint), or swap to kitchen props?
4. Should the bell make a sound?
5. Do the tool-call sub-states under `working` get a new ticket, or fold into 04?
