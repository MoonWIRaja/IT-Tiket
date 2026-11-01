---
name: save-diary
description: Save a factual session record for the logged-in user's selected AI agent.
---

# Save diary

1. Run `Login` and confirm the selected user and agent.
2. Summarize actual events, confirmed decisions, and next steps. Exclude other users' private information.
3. Run `SaveDiary -Text "<note>"`, using the same `-AgentId` if a non-primary agent is active.
4. Claim success only after the helper confirms the write.

The helper writes the authenticated agent's local `diary.json`; in team mode it also writes an encrypted project event shared with the team after Git push and pull. Use `RecordTurn` after every user instruction even when no additional diary note is needed.
