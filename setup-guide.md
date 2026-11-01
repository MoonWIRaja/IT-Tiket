# MemoryCore setup guide

All system files and all live memories are inside the root [`.Mcore`](.Mcore/) folder. The setup helper requires PowerShell 5.1 or later. Run these commands from the project root.

## Check setup state

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Status
```

If status says `needs_setup`, follow [setup-wizard.md](setup-wizard.md). Solo setup creates ignored `state.json`; team setup creates shared `team.json`. Do not replace existing user data with blank files.

## Solo mode

GitHub is optional. The current operating-system account becomes the solo login identity:

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Setup -Mode Solo -UserId me -UserName "My Name" -AgentId main -AgentName "My AI"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Login
```

Setup automatically provisions missing RTK and SkillSpector on Windows x64 before creating an account. First installation needs internet access; later sessions reuse installed tools. Run `.Mcore/tools/Setup-Tools.ps1 -CheckOnly` for a read-only dependency check. Other bundled workflows, including Ponytail, Caveman and Strix-Security, run as instructions for the active AI. Strix-Security needs no separate API key or model server.

Solo login checks the same local OS account each time. It does not distinguish two people sharing one OS account.

## Team mode

Every team member must have a GitHub account and GitHub CLI (`gh`). The owner first runs `gh auth login` in their own terminal and confirms the active account with `gh auth status --active --hostname github.com`. Never paste a GitHub token into chat or MemoryCore.

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Setup -Mode Team -TeamName "Studio" -UserId owner -UserName "Owner" -AgentId nova -AgentName "Nova"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action UnlockVault
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action AddUser -UserId member -UserName "Member" -AgentId atlas -AgentName "Atlas" -GitHubLogin member-github-login
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Validate
```

Only the authenticated GitHub account that created the team can add users. The helper stores each member's GitHub numeric account ID in `.Mcore/team.json`. The owner must commit and push that file plus `.Mcore/project-vault.json` after setup, and push roster changes after each `AddUser`/`AddAgent`. The new member needs GitHub repository access and the project passphrase through a secure channel outside Git and AI chat. They clone or pull, authenticate `gh` on their own computer, and run:

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action UnlockVault
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Login
```

`Login` creates that member's local cache and loads recent **shared project** memory and diary events. Memory actions require the matching local login receipt, which expires after 12 hours; start each AI session with `Login` even if a receipt still exists. Every team memory/diary write creates a new encrypted file in `.Mcore/project-events/`, labelled inside with the authenticated author and agent. Commit and push those encrypted files with the code; other members pull and then `Login` or `Recall` to read them. Separate files reduce Git merge conflicts. Git does not transfer `.Mcore/users/`, `state.json`, `.login.json`, `.vault-key.dpapi`, credentials, or personal skills. The team owner can register an account but cannot grant repository access with this helper. GitHub repository permissions must be managed separately.

From a Git repository, the owner can publish setup metadata with `git add .Mcore/team.json .Mcore/project-vault.json`, then `git commit -m "Set up MemoryCore team"` and `git push`. After recording work, stage the new encrypted files with `git add .Mcore/project-events`, commit them with the project changes, and push. Members run `git pull` before `Login` to get recent events. This download is currently a ZIP folder without a `.git` directory, so it must first be connected to a Git repository before these commands can publish anything.

For the same user on a second computer, authenticate the same `gh` account, clone or pull, and run `UnlockVault` with the same project passphrase. `Login` returns the shared history; `Recall` searches the full encrypted history. Local `.Mcore/users/` files are caches and are not synchronized. The project event log is the shared record. After each instruction, commit and push the newly created encrypted event files if teammates need that update on GitHub. Git cannot transmit an uncommitted local entry.

The passphrase unlocks the encrypted content; `gh` identifies the member for routing and author labels when the helper is used. It is **not** an encryption key held secretly by AI. Anyone with the passphrase and vault files can decrypt them outside the helper; someone with the shared key can also forge an author label by bypassing the helper. The labels are provenance hints, not digital signatures. A removed teammate who already knows the passphrase retains access to older copies. Revoking access requires a new key and re-encryption, which this template does not automate. The per-device key cache is protected with Windows DPAPI for that OS user, not with a separate AI-only password. Keep the repository private and back it up.

If several GitHub accounts are configured, select the correct one with `gh auth switch --hostname github.com --user <login>`. Each memory action verifies the active account again.

## Additional agent and memory actions

```powershell
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action AddAgent -AgentId research -AgentName "Sage"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Login -AgentId research
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action SaveMemory -Target User -Category Preferences -Text "Prefers concise answers"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action SaveDiary -Text "Reviewed the project plan"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action RecordTurn -Instruction "Review plan" -Outcome "Reviewed plan and identified next step" -TurnStatus Completed
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action SaveTopic -TopicId project-plan -Text "Decision: start with the memory schema"
.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Recall -Query "project plan"
```

`AddAgent -Primary` changes the user's default AI agent. After `Login -AgentId`, subsequent memory actions use that selected agent. User, agent, and topic IDs use lowercase letters, digits, and internal hyphens.

Team Login rebuilds the selected agent's local memory, diary, topics and session, plus the user's profile, from encrypted project events. This restores the same context on another device after pulling and unlocking. Active turn memory retains the latest 100 entries; Compact keeps 20 plus your summary. Full diary history remains available through Recall. RecordTurn retries with the same EventId and content are idempotent; different content with that ID is rejected.

After Login, run `-Action Route -Instruction "current request"` to suggest relevant skills. The AI reads those instructions and can select additional skills from the catalog by meaning. `-Action Skills` refreshes that catalog after an installation. Routing suggests work; it does not execute every skill or override the host's capabilities.

Git `user.name` and `user.email` may suggest a display name during setup, but they do not authenticate a person. Team login requires `gh`; solo login uses the local OS account.

## Tukar AI provider sambil mengekalkan nama AI

Start the next AI from this project root with the MemoryCore launcher:

```powershell
.\.Mcore\tools\Start-MemoryCore.ps1 -Provider Codex
.\.Mcore\tools\Start-MemoryCore.ps1 -Provider Claude
.\.Mcore\tools\Start-MemoryCore.ps1 -Provider Qwen
```

The launcher verifies the registered user, selects their primary agent unless `-AgentId <id>` is supplied, and writes a temporary briefing only inside ignored `.Mcore/.runtime/`. It includes the AI name and recent history. Thus a user whose agent is **Kid** can switch from Codex to Claude and start the new session with **Kid** and the available prior actions. If the team event was created on another device, pull its Git commit first. `UpdateSession` can save a concise continuation summary into the encrypted project log; `Login` restores the latest such summary for that user and agent on another device.

For another provider, run `-Provider ContextOnly` and give the resulting briefing file to an AI with access to this project. A browser chat without filesystem access cannot open `.Mcore` by itself. The supported CLI applications must be installed separately; only Codex was available on this development machine, so the Claude and Qwen launch commands still need a real-host check. See [provider and skill details](.Mcore/skills-and-mcp.md).

MemoryCore does not create provider folders in the project. Avoid provider `/init` commands or project-scoped settings that create `.claude/`, `.codex/`, `.agents/`, or `.qwen/`. The `.gitignore` excludes such folders if a host creates one anyway; it cannot stop that host from writing files. AI vendors may also maintain sessions and settings outside this project.

## Skills and MCP scope

When a member asks to add a skill, the AI asks: **for everyone or only for you?** Shared skills go inside `.Mcore/Feature/<name>/`; personal skills go inside the ignored `.Mcore/users/<user-id>/skills/<name>/`. The supplied skill recommender is now in `.Mcore/Feature/Skill-Recommender/`. Scan proposed third-party skills with SkillSpector and inspect the report. A provider's native skill picker might not list skills stored in this universal folder; the AI reads the relevant `SKILL.md` through the MemoryCore briefing and rules.

MCP declarations belong to `.Mcore/mcp-servers.json` for everyone or the logged-in user's ignored `.Mcore/users/<user-id>/mcp-servers.json` for one person. The provider still needs its own connection step and local authentication. Never put API keys or tokens into Git. No MCP server is selected or installed by the blank template.
