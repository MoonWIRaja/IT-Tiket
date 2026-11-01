# Skills and MCP operations

This is the operating guide, not a development plan. Keep it with the template.

## Automatic selection

After Login, the AI receives the current shared and personal skill catalog. For every new instruction call:

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Route -Instruction "Review the login code"
```

Route returns baseline skills, explicitly named skills, and a small ranked set of keyword suggestions using English/Malay terms. The AI chooses further skills by meaning from the catalog; keyword matching is assistance, not proof of relevance or an access gate. Read only the relevant `SKILL.md` and supporting references. Ponytail, Caveman and RTK remain baseline candidates; use their behavior only when applicable. A writing task does not need a fake terminal command merely to use RTK.

The catalog is rebuilt from files on Login and Skills/Route actions. New shared skills appear after pull; the active user's personal skills are included without opening another user's cache. No native provider menu is required. The AI may identify a missing capability and recommend a skill, but asks Team or Personal before adding one unless scope is already known. All bundled skills are shared.

## Setup and dependencies

Bundled `SKILL.md` files run as instructions in the active AI; the catalog is derived from the skill folders and does not require separate AI accounts. Strix-Security is an AI-performed local security review with a checklist and evidence requirements; no Strix engine, endpoint or key is used. Ponytail/Caveman are native behavior skills, not installed traffic proxies.

Setup and the launcher run `tools/Setup-Tools.ps1`. On Windows x64 it installs missing RTK from a pinned, SHA256-verified official archive and SkillSpector from a pinned source commit using uv/Python. It can bootstrap a pinned uv binary too. Existing executable tools are checked rather than silently replaced. Binaries and package caches live on the device outside this project; no binaries, accounts or test reports are shipped in the template. A missing network connection or blocked installation produces a real error and setup must be retried.

Use `Setup-Tools.ps1 -CheckOnly` for paths and availability without installation. The launcher supplies those paths to the provider process. `Read-Context.ps1` provides bounded text reads with line numbers and raw fallback for any task. RTK applies to supported shell commands; none of these tools can intercept every proprietary host tool.

## Adding a skill

1. Use the stated scope or ask Team versus Personal. Shared skills go in `.Mcore/Feature/<name>/`; personal skills in ignored `.Mcore/users/<user-id>/skills/<name>/`.
2. Obtain the exact local candidate without executing it. Run `Feature/Skill-Recommender/Invoke-SkillFlow.ps1 -Action Review -CandidatePath <path> -Name <name> -Scope Team` (or Personal).
3. Inspect the full SkillSpector report and candidate code, dependencies, network and credential use. Static analysis is not a guarantee. No skill contents are sent to an LLM with `--no-llm`; dependency metadata may be queried against OSV.
4. Run `-Action Install -ReviewId <id> -ManualReviewComplete` only after that inspection. Changed content, a blocking result or an existing target stops installation.
5. Call RecordTurn and publish shared changes only within the user's Git authorization.

### Provider-neutral skill content

Shared skills run as instructions through whichever AI can read the MemoryCore briefing. Write the core workflow without assuming a specific model, vendor, IDE, provider CLI, host configuration path, approval mode, or tool schema. Use the active session's actual tools and schemas. Keep provider-specific integration details only as optional adapters when they add value, label their requirements, and provide a provider-neutral fallback. Installing a skill does not install its software, connect its MCP server, or grant credentials.

Review reports belong to a configured instance's ignored runtime. Maintainer tests run on temporary copies outside the distributed template.

## MCP and provider switching

Shared MCP declarations live in `mcp-servers.json`; personal declarations stay in the active user's ignored folder. Credentials stay on the device. The blank template has no selected MCP servers and does not claim to configure arbitrary provider hosts. Consult `adapters/README.md` for supported launchers.

Use Start-MemoryCore with Codex, Claude, Qwen, Antigravity or ContextOnly. Codex, Claude and Qwen launch directly when their CLIs are available. Antigravity and ContextOnly produce a briefing for the user to load in the host; MemoryCore does not claim to launch Antigravity or install host configuration. The authenticated briefing contains the same user/AI identity, recent events and catalog; Team history arrives on another device after Git push/pull and vault unlock. A host needs access to the briefing/files and the tools needed by a task. A browser-only host needs the user to supply context. Video rendering needs actual media tools/assets; a scheduled job needs an actual scheduler. MemoryCore cannot manufacture capabilities the host does not provide.

## Recording

Call RecordTurn after every instruction. Reuse an EventId only to retry the exact same outcome; a changed outcome needs a new ID. The active agent chosen at Login is used by subsequent helper actions unless another AgentId is explicit. Team Login rebuilds that member's cache from encrypted events. Active turn memory is bounded while diary history remains searchable. Recall ranks lexical matches by term coverage and exact phrase; it is still a lexical search, not semantic retrieval. Recall includes `record_id` for persisted entries; SaveMemory, SaveDiary and SaveTopic also print the new ID. On the user's request, run `Forget -TargetEventId <record-id>`. Solo removes the matching active entries and any copy in the current compaction snapshot. Team writes an encrypted tombstone, rebuilds the local cache, and filters the record from Recall and briefing output once the relevant event log is present. The original encrypted event remains in append-only team logs and Git history, so this is suppression from MemoryCore's active views, not secure deletion. Do not save secrets or full private input by default. Skill choice and verification evidence should be included in the concise outcome when they matter.
