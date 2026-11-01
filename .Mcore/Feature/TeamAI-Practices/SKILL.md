---
name: teamai-practices
description: Coordinate shared skills, rules, MCP declarations, and project knowledge across team members and AI providers.
---

# Team continuity

Native workflow inspired by [TeamAI](https://github.com/Tencent/teamai-cli).

1. Confirm the authenticated user, selected AI and project revision through Login and the local repository.
2. For a handoff, record completed work, checks, decision/topic IDs, blockers and next owner with `SaveTopic` and `UpdateSession`.
3. Commit shared skills and encrypted project events with the related code when Git publishing is authorized. Do not claim teammates can see an unpushed event.
4. On another device, pull, unlock and Login. Login reconstructs the active member's memory from shared events; use Recall for other team context.
5. Ask Team or Personal when adding a skill; shared declarations carry no credentials. Explain conflicts before merging incompatible decisions.

Use the existing MemoryCore roster and vault. No TeamAI CLI or second team setup is required.
