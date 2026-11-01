# Engineering and delivery

## Scope and plan

Use the existing Work-Flow path and `PLAYBOOK.md`. Direct work needs a small check, not a speculative design document. Build work needs a clear result and relevant acceptance checks in `PLAYBOOK.md`. Epic/Project work needs stable stories, dependencies, ownership and handoff. Inspect existing code and conventions before selecting architecture, libraries or commands. Determine the stack from the actual project files.

Keep the user's original objective across clarifications and status questions. Resolve routine implementation decisions from evidence. When blocked on a dependency, continue independent useful work within scope. Do not replace requested execution with a proposal or stop because a partial result looks helpful.

## Implementation and debugging

- Locate code with RTK-bounded `rg`/`rg --files` where available; read bounded relevant context, preserving access to full files when needed.
- Match existing naming, formatting, interfaces and comment density. Apply Ponytail's 4-Rung Ladder: prefer the smallest sufficient change and keep unrelated user edits intact.
- Establish a reproducible failure or observable behavior before debugging (`Superpowers systematic-debugging` + `thinking-scientific-method`). Trace inputs, state, dependencies and error handling; fix the root cause rather than masking an error.
- Reuse components and utilities from `toolbox/` and the repository. Avoid speculative abstractions, gratuitous dependencies and unrelated refactors. Preserve accessibility, correctness and necessary failure handling.
- Keep account and secret handling scoped. Use Strix-Security / `thinking-red-team` for requested security work or genuinely sensitive changes, with concrete evidence. Security testing stays within authorized targets and the current host's safety rules.

## Validation

Run checks appropriate to the change and the project (`Superpowers test-driven-development` + `verification-before-completion`). A UI change may need a rendered inspection and interaction check; a logic fix needs a focused regression micro-test; documentation needs links, metadata, and SlopMonster (`deslop.py`) checks. Do not add tests that merely repeat implementation text. State when a dependency or environment prevents a check.

After relevant checks pass, broaden testing only when changes, failures or unresolved risks justify it. Review the resulting diff (`/ponytail-review`) for accidental additions and unsupported claims. Report actionable findings with file locations, trigger, impact and confidence.

## Git and external actions

Inspect actual repository state before working with branches or diffs. No repository means no claim about a clean tree or a commit. Avoid destructive reset/checkout and do not overwrite uncommitted work. Create an isolated worktree (`using-git-worktrees`) when useful and authorized.

Commit, push, merge, deploy, publish or message others only with applicable authorization. Preserve durable authorization from the session. Prepare the result before requesting any final approval that is actually required. Stage intended files explicitly. Use current project attribution rules rather than copied provider signatures or account names.

PR descriptions lead with the concrete problem and resulting behavior, then relevant validation. Explain a trigger and before/after example when helpful. Use the final scope, omit abandoned approaches, and write multiline descriptions through structured arguments or a file to preserve literal content.

## Solo-Agent Continuity (Supersedes Sub-Agent Spawning)

Sub-agent spawning is strictly blocked by `agent-delegation`. Instead of spawning child agents, the Main Solo Agent absorbs specialist roles (`agency-agents`, `superpowers`, `rea`, `cua`) inline in the main context so zero project memory or architectural context is lost.

Summaries preserve the requested outcome, `PLAYBOOK.md` state, accepted constraints, decisions, completed work, evidence, unresolved items and next steps. Compaction continues the same task. Save the result with RecordTurn and use UpdateSession before an actual handoff.
