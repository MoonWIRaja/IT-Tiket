# MemoryCore & Agent-Delegation Integrated AGENTS.md Guide

This guide explains how `agent-delegation` seamlessly coexists with and enhances an existing MemoryCore (`.Mcore`) installation without overwriting or conflicting with the project root's `AGENTS.md`.

---

## Why a Conflict Occurs If Copied Blindly

MemoryCore relies on its own root-level bootstrap (`.Mcore/rules.md` and project root `AGENTS.md`) to establish the authenticated session identity (`Login`), call routing (`Route -Instruction`), and durable logging (`RecordTurn`).

If a skill contains a separate root-level `AGENTS.md` with standalone "Mandatory Every-Turn" instructions, coding assistants (Claude Code, Cursor, Codex) rightfully warn that copying it will overwrite the MemoryCore bootstrap.

---

## The Clean Non-Destructive Solution

### Option A: Pure Skill Invocation (Zero Root Changes - Recommended)
You do **NOT** need to copy anything to your project root. `agent-delegation` lives inside your skills directory (for MemoryCore: `.Mcore/Feature/agent-delegation`).
- The active AI host reads `SKILL.md` automatically.
- `SKILL.md` already binds `{{agent_name}}`, `{{user_name}}`, and calls MemoryCore's `Route -Instruction` and `RecordTurn` natively.
- Your existing root `AGENTS.md` remains 100% untouched.

---

### Option B: The Unified "Merged" AGENTS.md Block (If you want root-level enforcement)
If you want your root `AGENTS.md` to explicitly enforce Tri-Core token reduction, the anti-spawn block, and `PLAYBOOK.md` without breaking MemoryCore, **append this lightweight block** to the bottom of your existing project root `AGENTS.md`:

```markdown
---
## Integrated Agent-Delegation & Tri-Core Engine (Fused with MemoryCore)

1. **MemoryCore Baseline**: Maintain authenticated Login and `.Mcore/rules.md` procedures on session start and turn completion (`RecordTurn`).
2. **Tri-Core Token Killer (RTK + Ponytail + Caveman)**:
   - Filter and compress tool reads using RTK rules or `toolbox/rtk_filter.py` (-60% to -90% input tokens).
   - Apply Ponytail's 4-Rung Ladder before writing code (1: config/delete -> 2: reuse toolbox/ -> 3: stdlib -> 4: minimal code). Add 1 small test for branch/loop/parser/security logic.
   - Deliver high-density Caveman replies: lead with results, eliminate conversational fluff, keep code/paths exact.
3. **Cognitive Elevation (MTCS)**: Before substantive decisions, execute the 4-tag Micro-Token Cognitive Scratchpad (`FRAME -> TRUTH -> DELTA -> TRAP`) via `cc-thinking-skills` to elevate Low thinking mode to Ultra-High intelligence.
4. **Deep Discovery -> PLAYBOOK.md -> toolbox/**: Clarify ambiguous requirements first. Compile and maintain `PLAYBOOK.md` bound to signed-off assets in `toolbox/` (e.g., `toolbox/logo.png`).
5. **Solo Principal Engineer (Anti-Spawn Rule)**: Strictly block child agent spawning (`Task`, sub-agents, swarms). Absorb all specialist roles (Superpowers TDD, Agency roles, SlopMonster copy checks, CLI-Anything harnesses) inline in the primary session context.
```
