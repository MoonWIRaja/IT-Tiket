# Save Diary System

The authenticated agent's dated session notes have a local cache in `.Mcore/users/<user-id>/agents/<agent-id>/diary.json`. In team mode, every saved note also becomes an encrypted shared project event labelled with its author.

After `Login`, run `SaveDiary -Text "<factual session note>"`. The helper timestamps and appends it without changing earlier entries. Use `-AgentId` for an additional agent owned by the same user. See [SKILL.md](SKILL.md) for the AI workflow.
