# MemoryCore workflow

The [workflow skill](SKILL.md) and [full lifecycle reference](references/lifecycle.md) adapt useful BMad Method concepts to MemoryCore's provider-neutral skills and memory actions. The active AI carries out the work; MemoryCore does not install BMad or claim its command runner, agent teams, or every extension module.

The lifecycle draws on BMad's [planning paths](https://docs.bmad-method.org/plan/choose-a-planning-path/), [requirements and specs](https://docs.bmad-method.org/plan/define-requirements-and-a-specification/), [story tracking](https://docs.bmad-method.org/plan/break-work-into-stories-and-track-it/), [bounded build/review](https://docs.bmad-method.org/build/build-a-change/), [organizational source ownership and gates](https://docs.bmad-method.org/plan/plan-inside-an-organization/), [existing-codebase guidance](https://docs.bmad-method.org/existing-codebases/start-in-an-existing-codebase/), and [evidence-based epic closure](https://docs.bmad-method.org/build/finish-an-epic/). Our improvements are proportional planning, explicit source-of-truth/change propagation, provider neutrality, honest capability claims, and MemoryCore cross-provider handoff.

Reusable planning and delivery artifacts are in [templates](templates/). They are source templates; place generated project artifacts according to the project's existing documentation convention. See [operations](../../skills-and-mcp.md) for skill routing and host limits.

## Lifecycle coverage

| BMad-style stage | MemoryCore workflow path/artifact |
| --- | --- |
| Discover and pressure-test an idea | Optional discovery in `references/lifecycle.md`; `project-brief.md`, `prfaq.md`; use research/creative skills as needed |
| Agree on product intent and requirements | `prd.md` for shared product contracts; `spec.md` for an epic; stable capability IDs and success conditions |
| Design UX and architecture | Conditional `ux-design.md` and `architecture.md`; trace parent decisions instead of copying them into each story |
| Plan epics, stories and dependencies | `initiative.md`, `ticket-tree.md`, `story.md`; requirement coverage and stable IDs |
| Implement one bounded work item | `build-plan.md`; one story/build at a time; actual checks and review evidence |
| Review and test | `review-report.md`, `test-strategy.md`, active host tools and relevant Feature skills |
| Change direction safely | `change-impact.md`; update the owning source, then affected specs, breakdown and active plans |
| Integrate, accept and learn | Epic-level acceptance verdict, `retrospective.md`, `deferred-work.md`, next owner/action |
| Resume across sessions/providers | MemoryCore `Login`, `Recall`, `SaveTopic`, `UpdateSession`, and `RecordTurn`; project files remain the work source of truth |

This covers the portable software/product lifecycle. It does not reproduce BMad's named command runtime, installer, agent roster/menus, marketplace modules, automatic ticket integrations, or autonomous loop runner; those require separate host/tooling capabilities. Specialist roles are perspectives in the active AI unless the host actually supplies separate agents.
