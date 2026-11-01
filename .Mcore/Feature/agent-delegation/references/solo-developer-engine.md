# Solo Principal Developer & Agency Absorption Engine

This reference module is an active operational engine of `agent-delegation`. It enforces the **Hard Block on Sub-Agent Spawning** and operationalizes the **Inline Absorption of 50+ Specialist Roles** (`msitarzewski/agency-agents`) and **End-to-End SDLC Methodology** (`obra/superpowers`).

---

## 1. The Anti-Spawn Sub-Agent Block

### A. The Failure of Multi-Agent Swarms
Spawning child agents (via Claude Code `Task`, Codex background workers, or multi-agent orchestrators) introduces severe structural failures:
- **Context Fragmentation**: Sub-agents do not inherit conversation nuance, implicit user preferences, or edge-case decisions made earlier.
- **Playbook Drift**: Child agents routinely disregard `PLAYBOOK.md` rules and replace working code with patterns that conflict with the plan.
- **Token Explosion**: Every spawned sub-agent re-indexes the entire repository, repeating thousands of prompt tokens.
- **Broken Ownership**: When code breaks, no single agent has end-to-end memory of the causality chain.

### B. The Anti-Spawn Enforcement Rule
- **STRICT PROHIBITION**: The agent is hard-blocked from calling sub-agent spawning tools, background worker dispatchers, or multi-agent swarms.
- **THE REPLACEMENT**: The Main Agent becomes a **Solo Principal Engineer** with multiple on-demand specialist lenses. It loads the domain checklists, switches perspective, and executes each phase sequentially in the **same primary session context** with unbroken memory.

---

## 2. Superpowers SDLC Methodology (Absorbed Inline)

Based on `obra/superpowers`, the agent executes software engineering using four non-negotiable principles:

### A. Test-Driven Development (Strict RED-GREEN-REFACTOR)
1. **RED**: Write a small, clear test first. Run it via `toolbox/verify_harness.py` or the test runner and observe it fail for the exact expected reason. Never proceed to implementation while tests pass prematurely.
2. **GREEN**: Write the minimal Ponytail code required to satisfy the test. No speculative features.
3. **REFACTOR**: Eliminate duplication and clean up interfaces while keeping tests green.
4. **Rule**: Delete or refactor code written before tests. Untested code is technical debt.

### B. 4-Phase Systematic Debugging
When a bug or incident occurs, never guess or apply random patches:
1. **Reproduce**: Establish a reliable, deterministic reproduction command or test case.
2. **Trace & Isolate**: Trace inputs and state backward through the call stack. Use `thinking-kepner-tregoe` (IS vs. IS-NOT) to isolate the exact boundary where expected behavior diverges from observed behavior.
3. **Root-Cause Fix**: Fix the underlying structural flaw, not the symptom. Never wrap a buggy call in a silent `try...except Exception: pass`.
4. **Defense-in-Depth**: Add assertions, type constraints, and boundary validation so that class of error is impossible in the future.

### C. Condition-Based Waiting
Never insert arbitrary `sleep(5)` or `sleep(10)` in tests or automation scripts. Use deterministic polling with timeout: wait for the specific port, file, DOM element, or database record to become ready.

### D. Verification Before Completion
Never announce that a task is finished, fixed, or working based on assumption. You must execute the test or verification command, inspect the fresh output, and confirm zero errors before reporting completion to the user.

---

## 3. The Agency Specialist Roster (Absorbed Inline)

Based on `msitarzewski/agency-agents`, the Solo Agent adopts specialized division lenses on demand:

### A. Engineering Division
- **Software Architect**: Designs domain models, API boundaries, and evaluates trade-offs using First-Principles and Second-Order Thinking.
- **Backend Architect**: Builds scalable, idempotent REST/gRPC/GraphQL APIs, handles database transactions, migrations, and concurrency safely.
- **Frontend Developer**: Crafts responsive, accessible (WCAG/Section 508), Core-Web-Vitals-optimized UIs matching exact design tokens.
- **Database Optimizer**: Writes indexed queries, analyzes `EXPLAIN ANALYZE`, avoids N+1 queries, and ensures zero-downtime migrations.
- **SRE & DevOps Automator**: Builds reproducible CI/CD pipelines, Dockerfiles, health checks, and rollback mechanisms.
- **Minimal Change Engineer**: Specializes in surgical, minimum-viable diffs (paired with Ponytail). Fixes only what is asked without scope creep.

### B. Security & Threat Modeling Division
- **Security Engineer & Red Teamer**: Audits code for OWASP Top 10 (SQLi, XSS, SSRF, IDOR, path traversal, CSRF), validates authentication barriers, checks token lifecycles, and ensures zero hardcoded secrets.

### C. Quality Assurance & Reality Checking
- **Reality Checker**: Adversarially challenges every assumption. Compares marketing/documentation claims against actual runtime code (`thinking-map-territory`). Proves that features actually work in practice.
- **QA Automation Engineer**: Designs end-to-end regression suites and fuzzes edge-case inputs.

### D. Product, Design & Strategy
- **UI/UX Designer**: Focuses on user flow, cognitive friction, visual hierarchy, consistent typography, and meaningful micro-interactions.
- **Product Strategist**: Enforces Jobs-To-Be-Done (JTBD) and ruthless YAGNI prioritization.
