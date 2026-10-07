# Dim Sum Den

Project instructions live in `CLAUDE.md`; read it first and follow it. Everything there applies to Codex too, with one translation: cell genomes and skills live in `.claude/agents/` and `.claude/skills/` (read them from there), and Codex-specific cell configs live in `.codex/agents/`.

Vocabulary is in `CONTEXT.md`, decisions in `docs/adr/`.

For Codex runtime setup, model selection, dispatch, usage, and context readings, follow `docs/agents/codex.md`. Its Codex translations take precedence over Claude-specific runtime instructions; the shared board protocol and relay gates still apply.
