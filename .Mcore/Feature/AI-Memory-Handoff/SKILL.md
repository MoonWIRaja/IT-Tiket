---
name: ai-memory-handoff
description: Capture, consolidate, recall, and hand off project knowledge between sessions, devices, or AI providers.
---

# Cross-session memory

Native workflow informed by [ai-memory](https://github.com/akitaonrails/ai-memory).

1. Capture the instruction and verified outcome with RecordTurn. Separate confirmed facts from guesses and preserve authorship.
2. Put a reusable decision in SaveTopic with a stable ID and explain which earlier decision it supersedes.
3. Before switching provider or device, use UpdateSession for the last verified result, relevant files, unresolved questions and next step.
4. After Login, inspect the restored context and use Recall by topic ID or keywords. Verify stale claims against the current code.
5. Use Compact when active notes are too large, retaining uncertainty and decisions in the supplied summary. Full diary history remains searchable.

The existing MemoryCore helper performs storage and recovery. No separate binary, wiki or database is needed.
