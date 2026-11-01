# Agent Delegation: Playbook, Toolbox, Solo-Agent Absorption, and Master Adapters

This reference defines the operational mechanics for **Agent Delegation** inside the unified Agent Core workflow. It applies across all providers and coding hosts (Claude Code, OpenAI Codex, Cursor, Antigravity, Gemini CLI, Pi, Windsurf, OpenCode, and custom MCP hosts).

---

## 1. Deep Discovery, Brainstorming, and Dynamic Re-Clarification Loop

Before executing substantive tasks or generating a Playbook, run this discovery loop (fusing **Agent Delegation Discovery**, **Superpowers `brainstorming`**, **Prompt-Master 9-Dimension Extraction**, and **`thinking-socratic`**):

1. **Audit the 9 Dimensions of Intent**:
   - Silently check: *Task*, *Target environment/stack*, *Output format*, *Constraints*, *Inputs/Assets*, *Project Context*, *Audience/User*, *Success Criteria*, and *Edge Cases*.
2. **Ask Surgical Clarifying Questions**:
   - For direct questions or tiny obvious edits, answer or act immediately using the Tri-Core Engine ([tri-core-token-thinking.md](tri-core-token-thinking.md)).
   - For new builds, features, or ambiguous instructions, **do not jump into writing code**. Ask concise, high-leverage questions in the user's language until the objective and constraints are 100% clear. Present design chunks concisely so the user can digest and sign off.
3. **Handle Mid-Project Changes & Pivots Immediately**:
   - Whenever the user changes the task, modifies requirements, or pivots the project direction, **halt current implementation immediately**.
   - Ask clarifying questions about the new direction to confirm what changed, what from the old task is superseded, and which `toolbox/` assets remain valid.
   - Rewrite `PLAYBOOK.md` to replace the old task definition (recording historical context via MemoryCore `SaveTopic` / `RecordTurn` when applicable).

---

## 2. Project Playbook Specification (`PLAYBOOK.md`)

Once discovery is signed off, compile everything into `{{project_root}}/docs/PLAYBOOK.md` (or `{{project_root}}/docs/playbook/<task-slug>.md` for multi-track projects). Following **Superpowers `writing-plans`**, break implementation into bite-sized, verifiable tasks (2-5 minutes each) with exact file paths and commands:

```markdown
# Project Playbook: <Task or Project Name>

- **Status**: Draft | Active | Superseded | Completed
- **Last Updated**: YYYY-MM-DD
- **Owner / Solo Principal Agent**: {{agent_name}} for {{user_name}}
- **Active Specialist Lenses**: <e.g., Backend Architect + Frontend Developer + Security Reviewer>
- **Mental Models Applied**: <e.g., First-Principles, Via-Negativa, Pre-Mortem>

## 1. The Goal
<Clear, unambiguous statement of the desired end state, target user outcome, and strict YAGNI scope boundaries.>

## 2. The Steps in Order
1. [ ] **Step 1 (Setup / Baseline)**: <Exact file paths + command to verify clean baseline>
2. [ ] **Step 2 (TDD Red -> Green -> Refactor)**: <Write failing test -> minimal Ponytail code -> pass test>
3. [ ] **Step 3 (Integration & Polish)**: <Connect components + run `toolbox/` checks + SlopMonster check>

## 3. The Rules (Bound to `toolbox/` & Tri-Core Engine)
- **Tri-Core Token & Code Rules**: Enforce RTK bounded reads, Ponytail 4-Rung minimalism, and Caveman high-density output.
- **Solo-Agent Rule**: Sub-agent spawning is strictly blocked. The main agent absorbs all specialist skills inline.
- **Toolbox Asset Rules**:
  - Brand/Media: Use `toolbox/logo.png` (or specified asset) for all header and brand placements.
  - Scripts & Blocks: Run `toolbox/<script-name>` (e.g., `toolbox/verify.py`, `toolbox/deslop.py`) for repeatable verification; never duplicate scripts outside `toolbox/`.
  - Templates & Schemas: Follow `toolbox/<template-or-doc>` as the single source of truth.

## 4. What Done Looks Like
- [ ] All ordered steps completed and checked off.
- [ ] RED-GREEN-REFACTOR tests and `toolbox/` verification scripts pass with concrete terminal output.
- [ ] `/ponytail-review` diff check passes (zero bugs, security holes, or unnecessary bloat).
- [ ] Public-facing English copy passes SlopMonster (`5/5`, exit status `0`) plus manual factual review.
- [ ] Reusable scripts, templates, or docs signed off and stored in `toolbox/`.
```

---

## 3. The `toolbox/` Registry & Caveman Blocks Protocol

The `toolbox/` directory (`{{project_root}}/toolbox/`) is the single source of truth for reusable project artifacts and **Caveman Blocks**:

- **What belongs in `toolbox/`**:
  - Brand and static assets (e.g., `toolbox/logo.png`, icons, fonts, design tokens).
  - Signed-off scripts, test harnesses, and linters (e.g., `toolbox/verify.py`, `toolbox/deslop.py`, `toolbox/build.sh`, `toolbox/migrate.ps1`).
  - Approved templates and boilerplates (e.g., `toolbox/component.tpl`, `toolbox/api-route.tpl`).
  - Reference documentation, API schemas, and reverse-engineering evidence snapshots (e.g., `toolbox/openapi.json`, `toolbox/rea-findings.md`).
- **Mandatory Rule Binding**:
  - Every file placed in `toolbox/` must be explicitly referenced under **3. The Rules** in `PLAYBOOK.md`.
  - **Ponytail Rung 2 + Caveman Blocks**: Before writing a new script, component, or long shell pipeline, check `toolbox/` first. Reuse or invoke the existing `toolbox/` script directly (`397 -> 76 tokens`).

---

## 4. Sub-Agent Spawning Block & Solo-Agent Skill Absorption

This rule overrides sub-agent delegation in `engineering.md`, `obra/superpowers`, and `msitarzewski/agency-agents`:

- **Hard Block on Spawning**:
  - **NEVER** invoke sub-agent spawning tools (such as Claude Code `Task`, Codex sub-agent workers, `subagent-driven-development`, `dispatching-parallel-agents`, or multi-agent swarm runners).
  - **Why**: Spawned sub-agents lose conversational memory, drift from `PLAYBOOK.md` rules, duplicate token overhead by re-reading the repo, and fragment architectural ownership.
- **How Solo-Agent Skill Absorption Works**:
  - Whenever a task requires multiple specialties (e.g., `agent-reach` research -> `agency-agents` Software Architect -> `superpowers` TDD Backend -> `design-media.md` UI/UX -> `rea` binary analysis -> `cua` desktop verification -> `slopmonster` copy polish):
    1. Load/read the relevant skill instructions directly into the Main Agent's context.
    2. Record the active specialist lenses in `PLAYBOOK.md`.
    3. Execute every phase sequentially in the **same main session** (`Superpowers executing-plans` inline mode), preserving 100% of the context, decisions, and learned codebase invariants.

---

## 5. Master Skill & Repository Adapters

### A. Superpowers (`obra/superpowers`) — Solo Inline SDLC Methodology
- **Repository**: `https://github.com/obra/superpowers`
- **Absorbed Skills & Rules**:
  - **`brainstorming` & `writing-plans`**: Integrated directly into Deep Discovery and `PLAYBOOK.md`. Never write implementation code before design and `PLAYBOOK.md` steps are clear.
  - **`using-git-worktrees`**: When authorized and beneficial for feature isolation, create an isolated git worktree/branch and verify a clean test baseline before making changes.
  - **`executing-plans` (Forced Inline Mode)**: Always use `executing-plans` (single-session inline execution) instead of `subagent-driven-development` or `dispatching-parallel-agents`.
  - **`test-driven-development` (Strict RED-GREEN-REFACTOR)**:
    1. **RED**: Write a small, focused test that reproduces the bug or defines the next step. Run it and watch it fail for the expected reason.
    2. **GREEN**: Write the minimal Ponytail code required to pass the test.
    3. **REFACTOR**: Clean up duplication while keeping tests green.
  - **`systematic-debugging`**: Follow the 4-phase root-cause process (reproduce consistently -> trace inputs/state backward -> isolate with `thinking-kepner-tregoe` -> fix root cause, never mask symptoms). Use condition-based waiting instead of arbitrary `sleep` calls.
  - **`verification-before-completion`, `requesting-code-review`, `finishing-a-development-branch`**: Never claim a task is fixed or complete without running the verification command and inspecting fresh output. Perform a self-adversarial code review (`/ponytail-review` + spec check) before presenting merge/PR/branch options.

### B. The Agency (`msitarzewski/agency-agents`) — Solo Specialist Persona Absorption
- **Repository**: `https://github.com/msitarzewski/agency-agents`
- **How to Use Without Spawning**:
  - Instead of spawning separate agent processes, the Main Solo Agent adopts the exact **specialist deliverables, checklists, and quality gates** from the relevant Agency division(s) for each step in `PLAYBOOK.md`:
    - **Engineering Division**: *Software Architect* (DDD, trade-offs, system boundaries), *Backend Architect* (API contracts, idempotency, scalability), *Frontend Developer* (Core Web Vitals, pixel-perfect responsive UI, accessibility), *Database Optimizer* (indexing, query plans, zero-downtime migrations), *SRE / DevOps Automator* (SLOs, CI/CD, rollback safety), *Minimal Change Engineer* (paired with Ponytail), *Code Reviewer*, *Codebase Onboarding Engineer* (factual code-path tracing).
    - **Security Division**: *Security Engineer / Red Teamer* (OWASP, auth boundaries, secret hygiene, threat modeling).
    - **Design & Product Divisions**: *UI/UX Designer*, *Design System Architect*, *Product Strategist* (JTBD, scope discipline).
    - **Testing & Quality Division**: *Reality Checker* (adversarial verification of claims vs. actual working state), *QA Automation Engineer*.
    - **Research, Strategy, Marketing & Specialized**: *Technical Writer*, *Prompt Engineer* (paired with Prompt-Master), *Autonomous Optimization Architect* (token/cost guardrails).

### C. Prompt-Master (`nidhinjs/prompt-master`) — Zero-Waste Prompt Engineering
- **Repository**: `https://github.com/nidhinjs/prompt-master`
- **Triggers**: Activates whenever the user asks to write, fix, optimize, or adapt a prompt for any AI tool (Claude Code, Codex, Cursor, Antigravity, ChatGPT/GPT, Gemini, Grok, o3/o4-mini, Midjourney, Stable Diffusion, ComfyUI, Sora, Runway, v0, Bolt, Lovable, etc.).
- **Operating Pipeline**:
  1. **Confirm Target Tool**: Identify the exact destination AI tool and surface (chat, API, or agentic IDE).
  2. **Extract 9 Dimensions**: Task, Target tool, Output format, Constraints, Input, Context, Audience, Success criteria, Examples. Ask at most **3 clarifying questions** if critical info is missing.
  3. **Model Recency Gate**: Verify exact model names/controls against official docs when "latest" is requested; never invent model slugs or API flags.
  4. **Apply Safe, Load-Bearing Techniques**:
     - Use clear role assignment, XML tags (`<context>`, `<task>`, `<constraints>`, `<output_format>`) for mixed content, concrete hex/pixel/timing specs for UI prompts, and binary "Done When" checks for coding agents.
     - For internal reasoning models (o3/o4-mini, DeepSeek-R1, Claude 5 / GPT-6 reasoning modes), keep instructions short and outcome-focused—**never** add "think step by step" or request hidden Chain-of-Thought.
     - Avoid single-prompt fabrication traps (do not simulate Mixture-of-Experts, Tree-of-Thought, or Graph-of-Thought inside one prompt unless explicitly requested).
  5. **Token Efficiency Audit & Delivery**: Strip every word that does not change the output. Deliver **one clean copyable prompt block** followed by a 1-line strategy note: `🎯 Target: [tool] · ⚡ Framework: [type] · 💰 Tokens: [estimate] · 💡 Strategy: [1 sentence]`.

### D. SlopMonster (`ItsssssJack/SlopMonster`) — Human-Grade Copy Linter & Editor
- **Repository**: `https://github.com/ItsssssJack/SlopMonster`
- **Triggers**: `/slopmonster`, "humanize this", "de-slop this", "does this sound like AI", "fix this copy", or whenever shipping user-facing English prose (READMEs, landing pages, emails, scripts).
- **The 4-Step De-Slop Workflow**:
  1. **Step 1 — Context & Checker (`tools/deslop.py`)**: Identify reader and format needs. Run `python3 tools/deslop.py <file>` (or `toolbox/deslop.py`). It scores 5 categories out of 5 (*vocabulary*, *sentence patterns*, *punctuation*, *three-item lists*, *possible unsupported proof*); exits `0` at `5/5` and `1` below `5/5`.
  2. **Step 2 — 3-Pass Rewrite**:
     - *Purpose & Structure*: Answer the reader's first question early; cut duplicate hooks and curiosity gaps.
     - *Meaning & Evidence*: Preserve facts, caveats, and commands. **Never invent evidence** (customer counts, ratings, testimonials); use `[needs number]` if data is missing.
     - *Wording & Rhythm*: Consult `references/signs-of-ai-writing.md`; replace AI buzzwords and repetitive sentence shapes with direct language. Do not fake personality with forced typos or fragments, and never hide prose in code blocks to game the score.
  3. **Step 3 — Cross-Model CLI Cleanse (`tools/cleanse.sh`)**: When a rival CLI is installed and authenticated (`DESLOP_WRITER=claude|gpt tools/cleanse.sh draft.md > cleansed.md 2> notes.txt`), invoke it strictly as a bounded text tool (check exit codes `124` timeout / `127` missing CLI). If unavailable, report that the external pass was skipped and complete a strict self-adversarial pass.
  4. **Step 4 — Compare & Rescore**: Diff against source to ensure zero lost facts/links/commands, re-run `deslop.py` to confirm `5/5`, and provide up to 5 short change notes without claiming the score proves human authorship.

### E. AI Engineering from Scratch (`rohitg00/ai-engineering-from-scratch`)
- **Repository**: `https://github.com/rohitg00/ai-engineering-from-scratch`
- **Capabilities**: First-principles LLM apps, structured outputs, RAG pipelines, stateless/stateful MCP servers and clients, portable `SKILL.md` packaging, agent harness engineering, and interactive `start-learning` (`LEARNING.md`) progression with `verify.py` artifacts stored in `toolbox/`.

### F. Cua - Computer-Use Agents (`trycua/cua`)
- **Repository**: `https://github.com/trycua/cua`
- **Capabilities**: Drive native desktop apps in the background without stealing cursor focus via `cua-driver` (CLI/MCP/SDK), spin up cross-OS sandboxes (`cua sb create/exec/screenshot`) or Apple Silicon VMs (`lume`), and benchmark via `cua-bench`. Always control Cua directly from the Main Solo Agent and clean up ephemeral sandboxes (`cua sb rm`).

### G. REA - Reverse Engineer Anything (`morluto/rea`)
- **Repository**: `https://github.com/morluto/rea`
- **Capabilities**: Connect via `rea-agents` CLI/MCP (`rea doctor --client <provider>`) to inspect web/Electron apps (Chrome remote debugging), JS/.NET bundles, and native binaries (Ghidra, Hopper, IDA, `objdump`, Rizin). Separate observed binary/runtime evidence from inference, store verified specs in `toolbox/`, and only analyze authorized targets.

### H. Agent Reach (`Panniantong/agent-reach`)
- **Repository**: `https://github.com/Panniantong/agent-reach`
- **Capabilities**: Diagnose and route upstream web/platform reading channels (`agent-reach doctor --json`) directly from the Main Solo Agent (see [resources.md](resources.md)). Never invent `agent-reach search`; use active verified backend tools directly and save reusable findings in `toolbox/`.

### I. CLI-Anything Engine (`HKUDS/CLI-Anything`) — Agent-Native Software Control
- **Repository**: `https://github.com/HKUDS/CLI-Anything` & CLI-Hub (`https://clianything.cc/`)
- **Capabilities**:
  - Bridges complex desktop suites (Blender, LibreOffice, Inkscape, GIMP, FreeCAD, Audacity, QGIS, Godot, Kdenlive, Obsidian) into deterministic, agent-native CLI commands and headless scripts.
  - Replaces fragile GUI computer-vision clicks with structured execution, zero-token UI bloat, and JSON output contracts.
- **Operating Rules**:
  - Run binary checks via `python3 toolbox/cli_anything_harness.py check <target>` before execution.
  - Save all custom software control scripts into `toolbox/` (e.g., `toolbox/render.py`) and bind them in `PLAYBOOK.md`.
  - Prefer headless CLI harnesses over GUI automation; use `cua-driver` only when no CLI or scripting interface exists.
