# Default to one active cell, with relay handoffs

On the Pro plan, the default endocrine limit is one active cell at a time (configurable), plus cheap `scout` subagents. Cells hand off through files on the board. This replaces the more obvious parallel swarm because every active cell re-sends its whole context each request, and agent teams cost about 7x the tokens. New spawns auto-pause at 90% of the usage window.
