# Provider adapters

This directory contains only configuration files that a provider needs in addition to the shared MemoryCore launcher and rules. It does not populate itself when a new provider is used.

| Host | Current integration | Notes |
| --- | --- | --- |
| Codex | `tools/Start-MemoryCore.ps1` launches Codex with the project briefing; root `AGENTS.md` points to MemoryCore. | Direct CLI launch |
| Claude Code | The launcher passes the briefing as a system prompt file and disables separate auto memory for that process. | Direct CLI launch |
| Qwen Code | The launcher passes the briefing and points Qwen to `qwen-settings.json` to disable separate auto memory and automatic skill generation for that process. | Direct CLI launch |
| Antigravity | Load the generated briefing in the host. Project `AGENTS.md` remains the shared entry point; skills are read from `.Mcore/Feature/` when Route selects them. | Manual briefing; no `.agents/` project folder or host configuration is created |
| Other provider | Use `-Provider ContextOnly` to create a briefing, then load it in that host. | Manual briefing |

The canonical rules, skill files and memory remain in `.Mcore/`; provider adapters describe how to load them and must not create provider-specific project folders. Direct launch support is separate from portable instruction support. A host is verified only after its own instructions, skills, tools and memory handoff are exercised in that host. Provider-owned files outside this project are outside MemoryCore's control.

## Host conformance gate

Before calling a host compatible, exercise the same fixture on it and at least one other host:

1. Confirm the project rules load and the authenticated user/agent identity is unchanged.
2. Use an English and a Malay request that each require a known skill; check the ranked route and the skill the AI actually reads.
3. Record a non-sensitive fact or decision, start a fresh session on the second host, and check that Recall returns the right source and content.
4. Give a task that needs a missing tool and confirm the AI reports the capability gap instead of claiming it ran.
5. Check the manual briefing lifecycle and remove it after loading when the host does not launch directly.

Track skill-selection precision, relevant-memory retrieval, successful identity handoff, unsupported-tool claims, and leaked or over-retained data. This checklist is a future verification gate; listing a host above does not mean it has passed.
