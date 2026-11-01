---
name: memory-compaction
description: Summarize active agent memory while retaining one previous snapshot.
---

# Compact memory

1. Run `Login` and review the returned active memory.
2. Summarize confirmed facts, preferences, decisions, and open questions, marking uncertainty.
3. Run `Compact -Summary "<summary>"` for the same agent.
4. Run `Login` again to verify the summary. The prior active memory is in that agent's `compaction.json`.

Repeated compaction replaces the one retained local snapshot. Diary and topic records remain unchanged. In team mode, the encrypted project event history remains available after compaction.
