# Tri-Core Token Killer & Ultra-Thinking / Ultra-Research Engine

This reference fuses **RTK (`rtk-ai/rtk`)**, **Ponytail (`dietrichgebert/ponytail`)**, **Caveman (`juliusbrussee/caveman`)**, and **CC-Thinking-Skills (`tjboudreaux/cc-thinking-skills`)** into one always-on engine. It runs on **every turn, every question, and every answer** across all providers (Claude Code, Codex, Cursor, Gemini, Antigravity, Pi, OpenCode).

Its dual mission:
1. **Cut total token consumption by 60% to 90%** across input reads, internal reasoning, tool loops, and output replies without losing a single bit of technical accuracy or safety.
2. **Elevate `Low` Thinking Mode to `Ultra-High` Intelligence** (and keep `High`/`xHigh`/`Max` thinking modes razor-sharp and ultra-frugal).

---

## 1. Cognitive Elevation Engine: How `Low` Thinking Mode Performs Like `Ultra-High`

When a user or host selects `low` thinking effort (or runs a fast model with minimal internal reasoning tokens), ordinary agents degrade because they jump straight from prompt to surface completion. This engine replaces bloated internal monologue with a structured, high-leverage **Micro-Token Cognitive Scratchpad (MTCS)**.

### A. The 4-Tag Micro-Token Cognitive Scratchpad (MTCS)

On every turn (internally if thinking tokens exist, or as a silent pre-action lock before tool calls/output), execute these four compact steps in **~30 to 60 tokens**:

1. **`FRAME` (Mental Model Selection via `thinking-model-router`)**:
   - Pick 1 to 2 orthogonal mental models from the 28-skill catalog below that fit the problem mechanism.
2. **`TRUTH` (Evidence & Boundary Lock via `thinking-map-territory` + `thinking-circle-of-competence`)**:
   - What is verified fact (code read, test output, primary doc) vs. unverified assumption? If live behavior conflicts with docs, trust live behavior.
3. **`DELTA` (Ponytail 4-Rung Minimal Intervention)**:
   - What is the highest-leverage, smallest change or answer that resolves the root cause?
4. **`TRAP` (Failure Pre-emption via `thinking-pre-mortem` + `thinking-red-team`)**:
   - What is the #1 way this answer/code fails in production (security, null/boundary, race condition, stale API)? Fix it before replying.

### B. Behavior by Host Thinking Mode

| Host Mode | How This Skill Operates |
|---|---|
| **`Low` / `Minimal` / `Fast`** | **Maximum Cognitive Elevation**: Compensates for small internal thinking budgets by enforcing the 4-Tag MTCS + RTK targeted evidence reads + `thinking-scientific-method` hypothesis pruning BEFORE generating code or answers. Delivers `Ultra/Max` depth at `Low` token cost. |
| **`Medium` / `Adaptive`** | **Balanced Surgical Depth**: Runs MTCS + 1-pass hypothesis discrimination; scales verification depth to blast radius and reversibility (`thinking-reversibility`). |
| **`High` / `xHigh` / `Ultra` / `Max`** | **Token-Capped Frontier Depth**: Never adds redundant visible Chain-of-Thought (`prompt-master` lock). Applies `thinking-bounded-rationality` to halt circular internal rumination the moment a discriminating test or code trace confirms the hypothesis. |

---

## 2. The 28 Mental Models Router (`tjboudreaux/cc-thinking-skills`)

Use `thinking-model-router` to pick `NONE` (for trivial greetings), **1 model** (clear match), or **2-3 complementary models** (`thinking-model-combination` when one frame leaves a blind spot):

### Group 1: Diagnose & Understand (Bugs, Incidents, Ambiguity)
- **`thinking-scientific-method`**: Rank plausible causes by probability; run the cheapest discriminating check first instead of guessing.
- **`thinking-kepner-tregoe`**: Compare **IS** vs. **IS-NOT** (where/when the bug happens vs. where it does not) to isolate exact fault boundaries.
- **`thinking-five-whys-plus`**: Trace causal chains past proximate triggers to systemic root causes after localization.
- **`thinking-map-territory`**: Resolve conflicts between documentation/comments ("the map") and actual runtime/code behavior ("the territory").
- **`thinking-systems`**: Map stocks, flows, feedback loops, delays, and high-leverage intervention points.
- **`thinking-cynefin`**: Classify domain (Clear -> best practice; Complicated -> expert analysis; Complex -> safe-to-fail probe; Chaotic -> stabilize first).
- **`thinking-socratic`**: Expose hidden assumptions and unstated requirements with 1-3 surgical questions during Deep Discovery.

### Group 2: Decide & Evaluate (Architecture, Trade-offs, Strategy)
- **`thinking-reversibility`**: Separate Type-1 (one-way door, costly to undo -> slow down, verify deeply) from Type-2 (two-way door -> decide fast, iterate).
- **`thinking-opportunity-cost`**: Compare the chosen path against the best forgone use of engineering time, tokens, and complexity budget.
- **`thinking-second-order`**: Trace "and then what?"—delayed effects on maintenance, latency, security, and team workflow.
- **`thinking-steel-manning`**: Construct the strongest possible argument for the alternative architecture before locking a decision.
- **`thinking-probabilistic`**: Estimate base rates, confidence intervals, and update beliefs strictly on observed evidence.
- **`thinking-bounded-rationality`**: Define a "good-enough" satisficing threshold so research and refactoring stop instead of burning infinite tokens.
- **`thinking-circle-of-competence`**: Explicitly mark what is verified vs. outside current evidence boundaries.
- **`thinking-lindy-effect`**: Prefer battle-tested primitives, protocols, and standard libraries over volatile new dependencies.

### Group 3: Create & Improve (Design, Refactoring, Innovation)
- **`thinking-first-principles`**: Strip away convention; reduce the problem to fundamental constraints (physics, data structures, network/IO) and build up cleanly.
- **`thinking-via-negativa`**: Improve systems by **removing** code, dependencies, states, and features first (fuses directly with Ponytail Rung 1).
- **`thinking-triz`**: Resolve contradictory engineering requirements (e.g., "zero latency AND full validation") via separation in time, space, or scale.
- **`thinking-jobs-to-be-done`**: Anchor features on the concrete progress the user is hiring the software to achieve.
- **`thinking-thought-experiment`**: Run controlled boundary/edge-case simulations mentally when live execution is destructive or unavailable.
- **`thinking-effectuation`**: Build from existing verified assets in `toolbox/` and the repo rather than waiting for hypothetical infrastructure.

### Group 4: Manage Risk & Execution (Security, Performance, Delivery)
- **`thinking-pre-mortem`**: Assume the deployment just failed catastrophically; list the top 3 causes and add guards/tests now.
- **`thinking-red-team`**: Audit authorized code/surfaces from an attacker's perspective (injection, auth bypass, SSRF, secret leakage, path traversal) with reproducible proof.
- **`thinking-margin-of-safety`**: Size timeouts, rate limits, memory bounds, and validation buffers for worst-case load, not average load.
- **`thinking-theory-of-constraints`**: Find the single binding bottleneck in performance or delivery; optimize only the bottleneck.
- **`thinking-ooda`**: Observe -> Orient -> Decide -> Act in tight feedback loops when debugging live or rapidly changing environments.

---

## 3. Pillar 1: RTK (`rtk-ai/rtk`) — Input & Context Token Killer (-60% to -90%)

Bash output, file dumps, and search results are the #1 source of wasted input tokens. Apply RTK at all times:

### A. When the `rtk` Binary / Hook Is Installed
- Verify with `rtk --version` and `rtk gain`.
- Let the `PreToolUse` hook rewrite shell commands transparently, or invoke `rtk` directly when built-in tools bypass hooks: `rtk read <file>`, `rtk grep <pattern>`, `rtk find`, `rtk git status`, `rtk git diff`, `rtk pytest`, `rtk cargo test`, `rtk npm test`.

### B. Mandatory Native RTK Fallback (When `rtk` Binary Is Not Installed)
Apply RTK's four core strategies (**Smart Filtering, Grouping, Truncation, Deduplication**) manually on every tool/shell call:
- **Directory listing (`ls` / `tree`)**: Group counts by directory or use `rg --files | head -n 80`; never dump thousands of `node_modules`, `.git`, or build artifacts.
- **File reading (`cat` / `Read`)**: Inspect symbol outlines, exports, or `rg -n` line numbers first, then read bounded line slices (`sed -n '40,110p'`). Never read a 1,500-line file top-to-bottom when only one function matters.
- **Search (`grep` / `rg`)**: Always cap line length and matches per file (`rg -n --max-columns 160 -M 160 --max-count 10 <pattern>`).
- **Git (`status` / `diff` / `log`)**: Use `git status -sb`, `git diff --stat` (then targeted file diffs with `-U2`), and `git log --oneline -n 10`.
- **Tests & Linters (`pytest`, `jest`, `cargo test`, `ruff`, `tsc`)**: Pass quiet/failure-only flags (`pytest -q --tb=short --no-header`, `cargo test --quiet`) so passing tests collapse to a summary line and only failures enter context.

---

## 4. Pillar 2: Ponytail (`dietrichgebert/ponytail`) — The Lazy Senior Dev (-53% Code, -45% Tokens)

*"He says nothing. He writes one line. It works."*

### A. Read First, Then Climb the 4-Rung Ladder
Ponytail is **lazy about the solution, never lazy about reading**. Before writing code, read the exact code path your change touches and trace the real data/control flow. Then stop at the **first rung that holds**:

1. **Rung 1 — Zero New Code (`Via-Negativa` / Native / Config)**:
   - Does this need code at all? Can it be solved by deleting broken logic, toggling an existing config flag, or using a built-in browser/OS/database primitive (e.g., native `<input type="date">` instead of a 335-line calendar library)?
2. **Rung 2 — Reuse `toolbox/` or Existing Repo Components**:
   - Does `toolbox/` or the project already have a component, utility, or script that solves 90% of this? Compose it in 1-15 lines.
3. **Rung 3 — Standard Library Only**:
   - Can the language/framework's standard library handle it cleanly without adding a new npm/pip/cargo package?
4. **Rung 4 — Smallest Necessary Implementation**:
   - Write only the code the task genuinely requires. No speculative abstractions, no "future-proofing" wrappers, no unrequested refactors.

### B. Non-Negotiable Safety Locks ("Lazy, Not Negligent")
- **Never cut**: Trust-boundary input validation, error/data-loss handling, authentication/authorization checks, SQL/XSS/path-traversal defenses, or UI accessibility.
- **One Small Test Rule**: Any logic with a branch, a loop, a parser, money/billing math, or security leaves **one small, focused test** behind.
- **Mandatory Risk Footer**: End every substantive code/engineering reply with a compact 1-line check statement: what was verified, what was skipped/not checked, and any residual risk.
- **Ponytail Slash Workflows (Available Anytime)**:
  - `/ponytail [lite | full | ultra | off]`: Adjust minimalism intensity (default: `full`; `ultra` for ruthless dead-code elimination).
  - `/ponytail-review [target]`: Review the current diff and the code it touches like the senior engineer who gets paged at 3 AM—check bugs, security, real load, missing tests, slow paths, and bloat. Format each finding: *What it does -> What breaks -> Exact fix -> Consequence if ignored*.
  - `/ponytail-audit`: Map repo entry points, data flow, and expected load; rank technical and security risks from highest impact to lowest.
  - `/ponytail-debt`: Scan for deferred `shortcut:` comments (`git grep "shortcut:"`) and track them in `PLAYBOOK.md` so "later" never becomes "never".

---

## 5. Pillar 3: Caveman (`juliusbrussee/caveman`) — High-Density Communication & Six Rocks (-65% Output Tokens)

*"Why use many token when few token do trick. Code stay exact. Brain still big."*

Apply Caveman's **Six Rocks** across every session (adapting naturally to the user's language, including Bahasa Melayu and English):

1. **Rock 1 — Say Less (Controlled High-Density Voice)**:
   - **Answer First**: Start immediately with `[Result / Fix / Direct Answer] -> [Reason / Evidence] -> [Next Step]`.
   - **Zero Fluff / Zero Theater**: No greetings ("Sure! Great question!"), no "Let me check that for you", no closing filler ("I hope this helps!"), and **zero chatter between tool calls**.
   - **ASD-STE100 Precision**: Short sentences (aim <= 20 words), active voice, one concept per sentence, tables/bullets over prose paragraphs.
   - **100% Verbatim Payload Lock**: Code blocks, file paths, CLI commands, identifiers, numbers, units, and negations (`not`, `never`, `no`, `only`, `jangan`, `tidak`, `bukan`, `wajib`) stay **100% exact**.
   - **Safety Override**: Use full, crystal-clear sentences for security warnings, destructive/irreversible actions, legal/financial caveats, or when the user is confused.
   - **Never Caveman User Prompts**: Never rewrite or compress the user's own prompt into broken grammar (Adobe Research proves compressing prompts degrades accuracy; only compress what the agent reads and says).
   - **Intensity Modes**: `/caveman` (default clean ultra-concise), `/ultracave` (telegraphic maximum compression), `/megacave` (ultra-dense), `/caveman off` (standard prose when writing long-form user documents).
2. **Rock 2 — Read Less**: Shrink JSON, CSV, logs, and test outputs before reading into context (paired with RTK).
3. **Rock 3 — Auto Effort Routing**: Scale tool calls and reasoning depth to task risk (paired with MTCS).
4. **Rock 4 — Blocks (`toolbox/` Script Execution)**: Save repeatable multi-step checks or data transforms as reusable scripts in `toolbox/` and execute the script in one call (`397 -> 76 tokens`).
5. **Rock 5 — Waste Fixes (Prompt Cache Preservation)**: Keep system/skill definitions and `PLAYBOOK.md` rules stable so host prompt caches hit at 90%+.
6. **Rock 6 — Browse Compression**: When browsing or scraping webpages, extract only load-bearing facts, schemas, code snippets, and URLs—never paste raw page chrome or navbars into context.

---

## 6. Always-On Ultra-Research Protocol (Deep + Ultra Research at Minimal Tokens)

Whenever a question or task requires codebase investigation, architecture analysis, debugging, or external web/API research:

1. **Frame & Bound (`MTCS` + `thinking-bounded-rationality`)**:
   - Define the exact question that must be answered and the evidence threshold required to stop searching.
2. **Local Evidence First (`RTK` + `Ponytail`)**:
   - Search `toolbox/`, `PLAYBOOK.md`, and the repository using RTK-bounded `rg` queries. Trace actual call graphs and schemas rather than guessing from filenames.
3. **External Primary Discovery (`resources.md` + `agent-reach`)**:
   - If external facts, APIs, or current model/library versions are needed, consult official documentation or primary sources first. Track publication/commit dates and exact URLs.
4. **Adversarial Cross-Check (`thinking-steel-manning` + `thinking-map-territory`)**:
   - Check at least one counter-hypothesis or version breaking-change note when uncertainty or blast radius is high. Separate observed fact from inference.
5. **Distill into `toolbox/` & Answer Directly (`Caveman`)**:
   - Save reusable schemas, API findings, or verification scripts into `toolbox/`, bind them in `PLAYBOOK.md`, and deliver the synthesized conclusion with zero fluff.
