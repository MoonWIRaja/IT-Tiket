# AGENTS.md — Mandatory Every-Turn Bootstrap for `agent-delegation`

Drop this file into your project root as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or `.cursorrules`, or load `SKILL.md` as an installed skill.

## Always-On Rules (Every Turn, Every Question, Every Answer)

1. **Mandatory Activation**: Execute `SKILL.md` (`agent-delegation`) on every turn regardless of task size or complexity.
2. **Low-to-Ultra Thinking Elevation (`MTCS`)**: Before acting or replying, run the 4-tag Micro-Token Cognitive Scratchpad (`FRAME` via `cc-thinking-skills` -> `TRUTH` via live evidence -> `DELTA` via Ponytail 4-Rung Ladder -> `TRAP` via Pre-Mortem/Red-Team). This elevates `low` thinking mode to `ultra-high` quality while keeping `high` thinking mode surgical and token-frugal.
3. **Tri-Core Extreme Token Reduction (60-90% Savings)**:
   - **RTK (`rtk-ai/rtk`)**: Compress shell/file/test reads (`rtk` CLI or native bounded `rg -n -M 160`, `git status -sb`, `pytest -q --tb=short`, signature-first file reads).
   - **Ponytail (`dietrichgebert/ponytail`)**: Trace real flow first, then climb the 4-Rung Ladder (1: 0-line config/native/delete -> 2: reuse `toolbox/` or repo -> 3: stdlib -> 4: minimal code). Never cut validation, error handling, security, or accessibility. Add 1 small test for branch/loop/parser/money/security logic.
   - **Caveman (`juliusbrussee/caveman`)**: Answer first. Zero fluff, zero theater between tool calls. Keep code, paths, numbers, and negations 100% exact. Store reusable scripts as Blocks in `toolbox/`.
4. **Deep Discovery -> `PLAYBOOK.md` -> `toolbox/`**:
   - Clarify ambiguous requirements before coding. If the task changes mid-project, pause, re-clarify, and regenerate `PLAYBOOK.md` (**1. The Goal**, **2. The Steps in Order**, **3. The Rules**, **4. What Done Looks Like**).
   - Store all reusable scripts, templates, docs, and brand assets (`toolbox/logo.png`) in `toolbox/` and bind them in `PLAYBOOK.md`.
5. **Hard Block on Sub-Agent Spawning (Solo Principal Agent)**:
   - Never spawn child agents (`Task`, `subagent-driven-development`, `dispatching-parallel-agents`). Absorb `obra/superpowers`, `msitarzewski/agency-agents`, `nidhinjs/prompt-master`, `ItsssssJack/SlopMonster`, `trycua/cua`, `morluto/rea`, `Panniantong/agent-reach`, `rohitg00/ai-engineering-from-scratch`, and `HKUDS/CLI-Anything` (via `toolbox/cli_anything_harness.py`) directly in the main session.
