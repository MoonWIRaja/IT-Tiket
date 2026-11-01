# MemoryCore operating protocol

## Required start sequence

1. Run `.Mcore/tools/Setup-MemoryCore.ps1 -Action Status`.
2. If not configured, follow the root `setup-wizard.md`. Do not claim to remember earlier sessions.
3. If ready in team mode, run `-Action UnlockVault` locally if this Windows account has not unlocked the project; then run `-Action Login`, optionally with `-AgentId <id>`. Team mode verifies the active `gh` account; solo mode checks the OS account.
4. Use the returned user profile, selected agent identity, memory, session summary, and shared project events. Do not open another user's local cache files.

The helper reads local `.Mcore/state.json` in solo mode or shared `.Mcore/team.json` in team mode. Team events are encrypted under `.Mcore/project-events/` and carry author metadata. An AI should use helper actions rather than reading or editing private JSON files directly.

## Save and recall

- `SaveMemory`: save confirmed facts. `-Target User` supports Facts, Preferences, Goals. `-Target Agent` supports Facts, Preferences, Decisions, Questions.
- `RecordTurn`: after every user instruction, append its outcome to both local memory and diary; team mode also writes an encrypted project event.
- `SaveDiary`: append a timestamped note to the selected agent's local `diary.json` and, in team mode, the encrypted project log.
- `SaveTopic`: append reusable knowledge to the selected agent's `topics.json`.
- `Recall`: search the logged-in user's local cache plus all shared project events in team mode. A keyword hit is a lead, not proof.
- `UpdateSession`: save a short continuation summary.
- `Compact`: supply a faithful summary; one previous active-memory snapshot remains in `compaction.json`.

Every write checks the current account again. Report a save only after the helper confirms success. In team mode, commit and push new encrypted project events so other devices receive them. If login or a write fails, stop and explain the error.

## Boundaries

Team login requires a registered GitHub numeric account ID and the project vault passphrase. Git commit configuration is never a login method. Display names can repeat; stable IDs label events. All members with the vault passphrase can read shared project events. Local files are caches, while the encrypted Git event log is the shared project record. Anyone with the passphrase and encrypted files can decrypt them outside the helper.
