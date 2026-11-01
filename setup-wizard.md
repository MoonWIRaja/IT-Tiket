# Mandatory MemoryCore setup wizard

At the start of a MemoryCore session, the AI runs `.\.Mcore\tools\Setup-MemoryCore.ps1 -Action Status`.

## If the state is `needs_setup`

1. Ask whether this is a **Solo** or **Team** instance.
2. Ask for the first user's display name and stable ID, plus their primary AI agent's name and stable ID.
3. For **Team**, require a GitHub account. Have the user run `gh auth login` in their terminal and confirm the active account. Do not request or display a token.
4. For **Solo**, use the current OS account; GitHub is optional.
5. Run the appropriate `Setup` command from [setup-guide.md](setup-guide.md). It provisions missing RTK and SkillSpector tools before creating the account; the first installation requires internet access. Ponytail, Caveman and the other native workflows are already bundled. No separate Strix key or installation is needed.
6. For **Team**, the owner runs `UnlockVault` in their own terminal and chooses a long project passphrase. Share that passphrase with members through a secure channel outside Git and AI chat. Register each person's GitHub login, user ID, and primary agent with `AddUser`. Commit `.Mcore/team.json` and `.Mcore/project-vault.json` to the repository.
7. Each member clones or pulls, authenticates `gh`, runs `UnlockVault` locally, then `Login`. The helper creates only that member's local cache and returns shared project events with their authors.
8. Run `Login`, then `Validate`. Confirm the returned user and agent before saving memory. Use `.Mcore/tools/Start-MemoryCore.ps1` when changing AI provider so the next session receives the same agent name and recent history. The launcher also provisions missing tools on a new device. Call `Route` for each request and read the relevant skills.

If setup cannot finish, leave MemoryCore unconfigured and explain the blocking step. Reading the wizard does not activate memory.

## If the state is `ready`

Run `UnlockVault` before `Login` in team mode. Team mode maps the active GitHub account ID to a registered user and decrypts project events using the locally entered passphrase. Solo mode checks the configured OS account. If login fails, stop memory access; never guess from a display name, Git commit identity, or chat text. After each instruction, use `RecordTurn` for both memory and diary.
