# Full project lifecycle

This reference describes the full MemoryCore path for software and product work. Select only the stages needed for the current intent. The goal is one trustworthy chain from user outcome to observed result, without making every task a project ceremony.

## Phase map

| Phase | Work | Exit condition |
| --- | --- | --- |
| **0. Entry and context** | Authenticate, route skills, inspect current project evidence and owners | Correct identity/context; no guessed state |
| **1. Analysis (optional)** | Explore options, research a decision, brief or PRFAQ | A concise, sourced intent and a decision whether to proceed |
| **2. Planning** | Build contract, PRD when shared alignment is needed, stable requirement IDs | Outcome, constraints, non-goals, success conditions and owner are clear |
| **3. Solutioning (conditional)** | UX, architecture decisions, epics/stories, dependency and coverage checks | Shared decisions and bounded, ordered work are ready |
| **4. Implementation** | One build/story per unit; plan, implement, verify, review and update status | Each unit has evidence and an honest built/blocked/deferred result |
| **5. Integration and close** | Whole-epic/project acceptance, retrospective, follow-up ownership and handoff | Explicit acceptance verdict, retained history and next step/closure |

An existing-codebase orientation is evidence gathering, not an obligatory documentation phase. A clear low-risk change may go straight to Implementation; an unclear concept may spend more time in Analysis. Use the stage exit conditions, not a fixed number of documents, to decide when to move on.

## 0. Establish context and ownership

1. Follow `.Mcore/rules.md`: confirm Status, authenticate with Login, then call Route for the instruction. Do not invent an identity if the template is unconfigured.
2. Load relevant skills only. Recall older decisions when needed; diary entries are historical evidence, not current instructions.
3. Inspect repository state, instructions, code, checks, constraints, and planning artifacts that can change the decision. In an established codebase, current source and behavior are primary evidence. Do not generate a codebase encyclopedia for an ordinary change.
4. Identify who owns the requirement, design/architecture decisions, implementation, acceptance, and external actions. One person can hold several roles. Do not imply a committee or independent reviewer exists when it does not.
5. Use the matching [specialist perspectives](../../Agency-Roles/SKILL.md) only where expertise changes the outcome; carry requirement IDs, decisions and evidence into the next stage.

## 1. Classify intent and size the work

Ask: what observable outcome should be true; what must remain true; what is out of scope; and how many independently verifiable work sessions or shared decisions are likely?

- **Direct** when it is obvious, small and low risk.
- **Build** when one coherent outcome can be investigated, implemented and reviewed as one bounded unit.
- **Epic** when one outcome needs several bounded stories/sessions.
- **Project** when several epics need shared product, UX, architecture, coordination or approval decisions.

These are scale choices, not mandatory phase gates. If size is uncertain, inspect first and choose the smallest path that remains safe. A Project may use the full lifecycle; a one-session change does not need it.

## 2. Discover and validate when intent is not ready

Use only the discovery method that closes the actual gap:

- Use brainstorming/options when the user is still choosing what to build.
- Use current, appropriate sources when a decision depends on facts not established in the repository.
- Use a product brief when the value, users, problem, or product boundary needs a durable short statement.
- Use a PRFAQ-style exercise when a concept needs a customer-first pressure test before investment.
- Use a research decision record when options need evidence, trade-offs, and a recommendation.

Discovery produces concise, sourced intent, not a pile of raw notes. Mark facts, assumptions, unresolved questions, rejected options, and confidence separately. Do not run ideation or research when the intent is already complete and evidence supports it.

## 3. Write the requirements source at the right level

For a **Build**, record the outcome, constraints, non-goals, and observable acceptance checks in the working plan or existing issue. For an **Epic**, create one epic spec. For a **Project**, create one requirements source (brief or PRD) only when several epics, stakeholders, approvals, or product decisions must stay aligned.

Every requirement/capability that must be traced gets a stable ID, plain-language intent, and success condition. Include relevant functional behavior, quality attributes, data/privacy, compatibility, rollout and failure behavior. Distinguish confirmed decisions from assumptions. Do not fill a gap with an invented fact; ask only when repository evidence cannot settle a consequential choice.

For organizational projects, name the document owner and keep changes in the canonical source. Downstream artifacts derive from it. A reviewer may comment anywhere, but an approved change is applied to the artifact that owns that decision.

## 4. Design UX and architecture only when needed

- Prepare UX artifacts when work changes user journeys, screens, accessibility, interaction states, or shared design patterns.
- Prepare an architecture decision/spine when multiple epics or components must agree on interfaces, data ownership, state changes, security boundaries, migrations, or operational behavior.
- For an existing system, record what current code and design already do before proposing a change. A deliberate departure states why and what replaces the old convention.
- Compare meaningful alternatives and consequences. Record the decision, scope, constraints and unresolved risks; avoid architecture paperwork for an isolated low-impact change.

The PRD/requirements source owns product intent; architecture owns cross-epic technical rules; UX owns shared experience rules; an epic spec owns only the epic-specific contract. If a downstream spec exposes a gap in its parent, update the parent first and revise affected children.

## 5. Slice and track work

1. Break Epic/Project work into ordered epics and stories using the ticket-tree template or the project's existing tracker.
2. Each story has a stable ID, owner, parent, requirement IDs it covers, dependencies, observable acceptance checks, relevant verification, and status.
3. Keep each story small enough to plan, implement, and review as one bounded build. Split stories that contain unrelated outcomes or exceed one workable session.
4. Check requirement coverage, dependency order, shared-file/interface collisions, data migrations and integration seams before accepting the breakdown.
5. Preserve completed history. Do not delete a completed plan to make the current plan look tidy. The external tracker and local build status may differ; state which is authoritative for which purpose.

For parallel work, make boundaries, owners and shared contracts explicit first. Parallel execution is optional and only exists when the host actually supports it.

## 6. Build one entry at a time

For each build/story:

1. Read the story, parent requirements/spec, dependencies, relevant decisions, and current code. Do not load unrelated project history.
2. Record the baseline (such as current revision or file state), desired result, scope, acceptance checks, risk, affected areas, verification plan, and remaining assumptions. Prepare a reviewable plan when risk, ambiguity, or scope warrants it.
3. Resolve intent from evidence first. If a consequential user choice remains—especially one affecting product behavior, irreversible actions, security/privacy, cost, or external publication—ask that concise question before crossing the gate. Otherwise continue under existing authorization.
4. Implement using project conventions. Keep the change within the story; if evidence changes scope, revise the plan/source rather than hiding a new requirement in implementation.
5. Run relevant checks that are authorized and available. Distinguish tests, static checks, manual execution, independent review, and unverified claims.
6. Review against parent intent and baseline. Fix findings that belong to this story; put unrelated findings in deferred work with enough evidence to resume later.
7. Update the plan/status to **built** with changed files and evidence. An authorized owner or user accepts it as **done** after checks and acceptance criteria are satisfied.

## 7. Review and verify at the right levels

- **Story:** check acceptance criteria, relevant failure paths, unintended changes, and available checks for changed behavior.
- **Code review:** compare the change to its stated intent and baseline; triage actionable findings instead of dumping speculative notes. A separate reviewer counts as independent only when actually used.
- **Epic integration:** inspect seams across stories, shared data/interfaces, whole-epic behavior, requirements coverage, regressions, and deferred items. Isolated story checks cannot prove the integrated epic works.
- **Project/release:** verify product outcomes, rollout/rollback, security/privacy and operational readiness when these apply. Do not infer release readiness from passing unit tests.

If a required check was not run, mark the result blocked, incomplete, or unverified instead of claiming acceptance.

## 8. Correct course when evidence changes

When intent, requirements, architecture, dependencies, risk or implementation evidence changes materially:

1. Describe the change signal and cite its source.
2. Identify affected requirements, decisions, epics, stories, interfaces, checks and owners.
3. Compare options and state the recommended change with consequences.
4. Route the approved change to its canonical owner: product requirements → shared UX/architecture decisions → affected epic specs → remaining ticket breakdowns → active build plans.
5. Keep stable IDs where meaning remains the same. Mark replaced decisions as superseded, retain completed work/history, and re-plan only affected unfinished work.
6. Re-check coverage and dependencies before implementation resumes.

Use the change-impact template for material scope changes. A small clarification that does not change acceptance or downstream work can be updated directly in the owned artifact.

## 9. Close an Epic or Project with evidence

When an Epic's entries are built, review the entire Epic against its acceptance checks and parent requirement IDs. Use code, diffs, test results and issue history as evidence, not recollection. Record aggregate findings across story boundaries, behaviors not exercised, incomplete tickets, and action items with owners. Write a retrospective with an explicit verdict: **met**, **partly met**, **not met**, or **unverified**. A retrospective file alone does not mark work done.

For a Project, repeat integration and retrospective at each Epic boundary. At project close, check the product outcome, accepted and deferred scope, rollout needs, and follow-up owners. Keep artifacts that carry decisions or evidence; archive/remove only through the project's normal retention rules.

## 10. Handoff and persist only useful memory

Leave the project artifact/tracker with accurate status, next ready entry, blockers, decisions needed, and checks outstanding. End each workflow with a brief status and one recommended next action (continue build, run a check/review, wait for a named decision, accept, or close); never imply a stage auto-ran. Use `UpdateSession` for the next step and blocker; use `SaveTopic` for a reusable decision; call `RecordTurn` for the current user instruction after execution. MemoryCore memory is a compact cross-session index, not another copy of the PRD, ticket tree, or code. On resume, inspect the active artifact and current source before acting on remembered status.

## Human decision checkpoints

Use a checkpoint when a decision cannot be inferred safely or belongs to a human owner. For organizational work, these commonly align to:

| Checkpoint | Reviewable result | What it may block |
| --- | --- | --- |
| Concept/resource decision | Brief or PRFAQ verdict, evidence and recommendation | Committing substantial time or budget |
| Product contract | Approved requirements source and explicit success conditions | UX, architecture and multi-epic breakdown |
| Shared design/architecture | Accepted interface, data ownership, UX or technical decision | Epics that depend on the decision |
| Work breakdown | Requirement coverage, ordered entries, dependencies and owners | Starting coordinated or parallel implementation |
| Epic/project acceptance | Whole-scope evidence, verdict, known risks and follow-up owners | Closing the epic or starting dependent work |

Add checkpoints for security/privacy trade-offs, destructive or externally visible actions, or other decisions owned by a human. Name the decision, evidence, options, and work it blocks. These gates are optional for a solo low-risk task; do not pause for a decision already answered by the user or authoritative evidence.
