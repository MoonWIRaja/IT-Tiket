# Source and adaptation

- Upstream: https://github.com/morluto/rea/tree/f254f5ac2b804b353a711264bb178f43fdf07867/.agents/skills/reverse-engineer-anything
- Source commit: `f254f5ac2b804b353a711264bb178f43fdf07867`
- License: MIT; see `LICENSE`.
- Adaptation: renamed the skill for MemoryCore routing, retained the upstream investigation workflow and supporting references, pinned upstream documentation links, and removed host-specific recovery steps, removed unpinned package commands, and added provider-neutral MemoryCore boundaries and an authorized-target limit. No REA MCP server, CLI, or native analysis engine is installed by this skill.