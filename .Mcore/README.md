# MemoryCore

The root setup wizard, setup guide and AGENTS.md are the entry points. This folder contains the universal rules, bundled skills and helper scripts. The template has no accounts, memories, keys or runtime reports.

## Operation

Run Status, then setup or authenticated Login. Login supplies the registered user, AI identity, shared project context and current skill catalog. Route ranks keyword suggestions while the AI may select additional skills by meaning. RecordTurn saves a concise outcome to both memory and diary. Start-MemoryCore prepares the same identity and context for supported launchers or a manual host briefing.

For software and product delivery, [Work-Flow](Feature/Work-Flow/SKILL.md) covers the full scale-adaptive lifecycle: optional discovery, requirements, conditional UX/architecture, traceable work breakdown, bounded builds, review, change control, integration, retrospective and handoff. It is inspired by BMad Method, uses the active host's actual capabilities, and keeps project artifacts separate from MemoryCore memory.

Team users authenticate through GitHub CLI and locally unlock the project vault. The owner registers members; GitHub repository access is managed separately. All members holding the shared passphrase can read shared project events. Author labels are helper-generated provenance, not digital signatures or protection against a key holder rewriting history.

## Data after setup

| Path | Purpose | Git |
| --- | --- | --- |
| team.json | Team roster and primary AI names | Shared |
| project-vault.json | Encryption parameters and verifier | Shared |
| project-events/*.json | Encrypted append-only project history | Shared |
| state.json | Solo account metadata | Ignored |
| users/ | Local per-user cache and personal skills | Ignored |
| .login.json / .vault-key.dpapi | Device login receipt / Windows-protected key cache | Ignored |
| .runtime/ | Temporary briefings and review reports | Ignored |
| Feature/ | Bundled and shared skills | Shared |

Team Login rebuilds the active member's profile, memory, diary, topics and session from the shared log, including on a second device. Pull before Login to receive other-device events. Solo mode is tied to the configured local OS account. Active turn memory is bounded at 100 entries; Compact keeps 20 recent turns and one prior memory snapshot. Diary history remains searchable. Recall ranks lexical matches by query phrase and term coverage, returns at most 20, and reports when results are truncated; it does not provide semantic search.

Persisted notes and turns have stable record IDs. Recall displays them, and save actions print them. `Forget -TargetEventId <id>` removes the matching note from active Solo cache files and the current snapshot. In Team mode it records an encrypted tombstone and rebuilds the local cache; after syncing the event log, MemoryCore filters that record from Recall and briefings. The encrypted source event and copies in Git history remain available to vault key holders because the team log is append-only. This is not secure erasure.

The key cache uses Windows DPAPI, so team key caching currently requires Windows. The vault reads its declared PBKDF2-HMAC-SHA256 algorithm and iteration count from the manifest and rejects unsupported ranges; this preserves the current vault format. Solo JSON files are not encrypted by MemoryCore. Cross-provider instructions do not imply support for every operating system or AI host. Keys are not AI-only. Revoking a former member's access to old copies requires key rotation outside this helper.

## Tools and checks

Setup-Tools automatically provisions missing RTK and SkillSpector on Windows x64. Ponytail and Caveman behavior is bundled as native skills; security review uses the active AI. External binaries live in the device cache, outside the project.

Direct Codex/Claude/Qwen launches remove their temporary briefing when the CLI exits. `Antigravity` and `ContextOnly` return a path for manual loading; that file contains memory and remains until the user removes it after handoff. Manual briefing does not create `.agents/` or other provider-specific project folders.

See [Feature catalog](Feature/README.md), [skills/MCP operations](skills-and-mcp.md) and [provider adapters](adapters/README.md). Run `tools/Test-Template.ps1` for static template checks and `tests/Test-MemoryCore.ps1` for isolated behavior tests. These do not prove every provider will obey instructions; test the actual host before claiming compatibility.
