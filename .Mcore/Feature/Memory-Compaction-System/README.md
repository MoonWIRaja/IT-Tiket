# Memory Compaction System

Compaction shortens the agent's local active `memory.json` and saves one prior snapshot in that agent's `compaction.json`. It does not change user profile, diary, topic records, or the encrypted shared project event history. See [SKILL.md](SKILL.md).

Prepare a faithful summary, then run `Compact -Summary "<summary>"`. Back up the agent's data before repeated compaction if older snapshots must remain recoverable.
