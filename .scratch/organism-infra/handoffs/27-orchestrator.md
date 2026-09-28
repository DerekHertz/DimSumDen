```json
{"ticket": "organism-infra/27-wsl-trial", "current_step": "resolved: user chose GO, organism moves to WSL",
 "artifacts": [".scratch/organism-infra/issues/27-wsl-trial.md", ".scratch/organism-infra/issues/28-review-claims-keep-in-review.md", ".scratch/organism-infra/issues/29-organism-root-at-dispatch.md"],
 "decisions": ["move the organism to WSL", "Blender MCP uses the official Blender Lab bundle, never community uvx blender-mcp", ".wslconfig mirrored networking stays"],
 "failures": ["community blender-mcp server hung against the official add-on (different protocol)"],
 "pending": [{"item": "revise Windows-specific docs per checklist item 2", "owner": "orchestrator"}, {"item": "ticket for worktrees basing on the previous hop's commit", "owner": "orchestrator"}]}
```

# Handoff: organism-infra/27 (orchestrator)

Trial done; migration checklist is in the ticket's last comment. Ticket 24 ran the full relay in WSL with no Windows-class incidents.
