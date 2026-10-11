# Demo mode fixture

`demo-fixture.mjs` is the event stream that Demo mode (`?demo=den`, or the "Watch the demo" button) replays into the den. It is plain data: a list of events, each with `at` (milliseconds from the start of one pass), and a `loopMs` after which the replay starts over.

The replay driver (`demo-replay.mjs`) turns the events into the snapshot and transcript buffers the den already reads. `demo-mode.mjs` owns entering and leaving, and `demo-card.mjs` greys the card actions. None of them make a request or read a token.

## What is recorded and what is staged

The scout's storyline (`demo-scout`, ticket `den/04-scout`) is a live run recorded on 2026-10-11: a task started from the den on Claude Haiku, with its tool calls in order, its seven permission requests, its reply and the cost the CLI reported. Times are the run's, halved. The checkout path is written `/repo`, long results are cut, two requests that were pending together are shown one after the other, and the ticket is held by the scout from the start (the live agent ran for 31 seconds before it claimed).

The developer and qa agents (`demo-dev-1`, `demo-qa`, `demo-dev-2`) are staged by hand, so the demo also shows a split-off panda, a message and its acknowledgement. No recorded run has those yet.

## How to re-record it

1. Watch a real run: the bridge's `/events` stream carries `agent`, `ticket` and `transcript` frames, and `GET /state` shows the tickets and approvals at that moment. Note, in time order, when each agent started, which tools it called, when it asked the user, when the user answered, and when a message was acknowledged.
2. Rewrite the `events` list in `demo-fixture.mjs` in that order, using the event shapes described at the top of that file. `at` counts from the first event. Keep agent ids stable and give each agent a ticket of the same ref and role (the pandas bind to the ticket).
3. Leave some agents without a `tool` input/result or a `say` line if you want the card's R to show greyed ("Demo mode: no transcript recorded") for them.
4. Set `loopMs` to the last event plus at least 8 seconds, so the last tool bubble fades before the loop restarts.
5. Run `npm test`. The tests in this folder read the fixture through the replay driver and fail if it loses a role, the split-off panda, a tool call, the pending approval or the message acknowledgement.

There is no recorder tool in the repo yet: the scout's events were written from a capture of the bridge's `/events` stream during the run, and the rest by hand.
