# Deep Discovery & Living Playbook Engine

This reference module is an active operational engine of `agent-delegation`. It governs how the agent conducts Socratic requirement interviews, extracts intent across 9 structured dimensions, manages project pivots, compiles `PLAYBOOK.md`, and enforces contractual bindings to `toolbox/`.

---

## 1. The Deep Discovery Socratic Interview Engine

Before writing a single line of production code or creating files, the agent runs the **Deep Discovery Gate**. This fuses **Socratic questioning (`thinking-socratic`)**, **Superpowers `brainstorming`**, and **Prompt-Master 9-Dimension Extraction**.

### A. The 9 Dimensions of Intent Extraction
Silently evaluate these 9 dimensions on every user build or task request:
1. **Task**: Exact core action and mechanics. Convert vague verbs ("make a bot", "improve auth") into specific technical operations.
2. **Target Environment & Stack**: Language, framework version, OS, browser constraints, and active AI host (Claude Code, Cursor, Codex, Gemini, Antigravity, etc.).
3. **Output Format & Artifacts**: Code files, CLI scripts, schemas, UI components, or configuration files.
4. **Constraints & Invariants**: What MUST NOT change, banned packages, security limits, offline execution requirements, backward compatibility.
5. **Inputs & Existing Assets**: Existing code, database schemas, API specs, and assets in `toolbox/` (e.g., `toolbox/logo.png`).
6. **Project Context & State**: Current commit, existing tests, architectural patterns, team conventions.
7. **Audience & User Level**: Developer, end-user, internal ops, or enterprise administrator.
8. **Success Criteria**: Binary, testable proof of completion ("passes unit test X", "renders cleanly at 375px without scrollbar").
9. **Edge Cases & Failure Modes**: Network drop, empty inputs, null pointers, auth token expiry, race conditions.

### B. The Questioning Rules
- **Rule of 3**: Ask at most 3 focused, high-leverage questions at a time. Never overwhelm the user with a 15-question questionnaire.
- **Concrete over Abstract**: Present concrete options: *"Do you want Session-based auth via cookies or stateless JWT in the Authorization header?"* rather than *"What security model do you want?"*
- **Sign-off before Implementation**: Show proposed architecture and step breakdown in bite-sized chunks. Proceed to writing code only after the user confirms.

---

## 2. Dynamic Scope-Change & Mid-Project Pivot Protocol

In real software development, requirements change mid-flight. When the user modifies requirements, shifts stack, or alters the goal:

1. **Immediate Execution Freeze**: Halt active implementation steps immediately. Do NOT finish writing obsolete code.
2. **Delta Interview**: Ask 1-2 surgical questions:
   - What is the new primary goal?
   - Which previously implemented components and `toolbox/` assets remain valid vs. deprecated?
3. **Playbook Mutation**:
   - Update `PLAYBOOK.md` immediately: mark superseded tasks as `[Superseded]`, insert new sequential steps, and update rules.
   - Record the architectural pivot via MemoryCore `SaveTopic` / `RecordTurn`.
4. **Clean Slate Resumption**: Resume execution from Step 1 of the new plan using the Tri-Core Token Engine.

---

## 3. The `PLAYBOOK.md` Specification

`PLAYBOOK.md` lives at `{{project_root}}/docs/PLAYBOOK.md` (or `docs/playbook/<task-slug>.md`). It is the definitive single source of truth for both the user and the agent.

```markdown
# Project Playbook: <Task Name>

- **Status**: Active | Completed | Superseded
- **Last Updated**: YYYY-MM-DD
- **Owner / Solo Principal Engineer**: {{agent_name}} for {{user_name}}
- **Active Specialist Lenses**: <e.g., Software Architect + Frontend Developer + Red Team>
- **Active Mental Models**: <e.g., First-Principles, Kepner-Tregoe, Pre-Mortem>

## 1. The Goal
<Unambiguous outcome statement. Explicitly list what is IN SCOPE and what is strictly OUT OF SCOPE (YAGNI).>

## 2. The Steps in Order
1. [ ] **Step 1 (Baseline & Discovery)**: <Inspect existing code, verify test baseline, bind toolbox/ assets>
2. [ ] **Step 2 (RED - Failing Test)**: <Write focused unit/integration test reproducing bug or asserting feature>
3. [ ] **Step 3 (GREEN - Minimal Ponytail Implementation)**: <Write minimal working code adhering to 4-Rung Ladder>
4. [ ] **Step 4 (REFACTOR & Review)**: <Run /ponytail-review, check security & performance, optimize>
5. [ ] **Step 5 (Sign-off & Cleanse)**: <Run toolbox/deslop.py for public docs, verify all acceptance criteria>

## 3. The Rules (Bound to `toolbox/`)
- **Tri-Core Rules**: Native RTK filtering on all tool reads; Ponytail 4-Rung Ladder; Caveman zero-fluff answers.
- **Solo-Agent Rule**: No sub-agent spawning. Main agent absorbs all specialist skills inline.
- **Toolbox Enforcements**:
  - `toolbox/logo.png`: Mandatory brand asset for all visual deliverables.
  - `toolbox/verify_harness.py`: Canonical test runner; ad-hoc shell test loops are prohibited.
  - `toolbox/deslop.py`: Mandatory gate for READMEs, emails, and documentation.

## 4. What Done Looks Like
- [ ] Automated tests pass via `python3 toolbox/verify_harness.py "<test-command>"`.
- [ ] Zero unhandled errors, security regressions, or dead code flagged by `/ponytail-review`.
- [ ] English user-facing copy scores `5/5` on `toolbox/deslop.py`.
- [ ] Reusable scripts, templates, and docs signed off and preserved in `toolbox/`.
```

---

## 4. The `toolbox/` Registry Protocol

`toolbox/` is not a dump folder—it is an enforceable code and asset contract:
1. **Asset Immutability & Reuse**: Assets placed in `toolbox/` (e.g., `toolbox/logo.png`, `toolbox/schema.sql`) are signed off. The agent must use them directly and never fabricate duplicates or variations elsewhere in the workspace.
2. **Caveman Blocks Integration**: Scripts in `toolbox/` (`toolbox/build.sh`, `toolbox/verify.py`) serve as **Caveman Blocks**. Instead of generating multi-line bash commands in chat that burn hundreds of context tokens, the agent calls the single script file directly (`397 -> 76 tokens`).
3. **Continuous Asset Enrichment**: When the agent builds a high-leverage utility, helper, or clean template that has project-wide value, it packages it into `toolbox/` and links it in `PLAYBOOK.md`.
