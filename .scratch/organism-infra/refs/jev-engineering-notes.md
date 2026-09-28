# Jev engineering notes (user-supplied article, 2026-09-28)

Secondary source (an article the user pasted). Its numbers are vendor or anecdotal claims; ticket 04 still needs our own measurements.

## Facts claimed
- Input: state (text/JSON) + typed questions. Output: Choice (≤255 options), Score (2–10 levels), Noul (P(yes)), each with the full distribution.
- 70–500 ms, most ~100 ms. $0.042/M input tokens, output free. ~64K tokens per call.
- Trained for calibration (RLCD): a 0.9 should be right ~9 in 10. Pin `jev-1.13.0`.
- SDK: Python `typesafe_sdk` (`TypeSafeClient(model=...).system_one(state=..., questions=...)`).

## Patterns relevant to the organism
1. **PreToolUse Bash gate:** hard-coded deny rules first, then Jev classifies read_only / local_edit / destructive / external / other. Auto-allow only read_only/local_edit at ≥0.9; external always asks; other never auto-approves. Could cut our permission and classifier friction (see `usage.jsonl` incidents).
2. **Stop hook "done?" check:** code runs the checks first (a failing test needs no model); Jev judges from the checks output whether the goal is met; turn cap in code; 0.5–0.9 means stop and flag for review. Fits qa verify and the relay's stop conditions.
3. **Trigger gate:** a cron job asks Jev whether anything needs Claude, so a Claude turn only starts when there is work. Fits the always-on "anything worth doing?" routine (product scope).
4. **Compaction:** Jev picks which tool calls in a session are still relevant (claimed 1M → 86K tokens).

## Rules
- Put the meaning in the instructions; the question ID is never sent.
- One judgment per question; combine answers in code.
- Criteria describe checkable situations, not moods.
- Every Choice gets an `other` exit.
- Ask all questions in one call so the state is sent once.
- Keep math, dates and hard rules in code.
- Shadow first: Jev labels while the old path decides, then enable the confidence bands that matched.
