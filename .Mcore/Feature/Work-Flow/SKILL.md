---
name: memorycore-workflow
description: Guide direct changes, software builds, epics, and multi-epic projects from intent through discovery, requirements, design, delivery, review, course correction, and closure. Use when planning or resuming substantive work.
---

# MemoryCore project workflow

This is MemoryCore's provider-neutral, evidence-led delivery process, inspired by BMad Method. It preserves useful planning and delivery stages while using MemoryCore identity, skills, memory, and tools available in the active host. It is not a BMad installer, agent runtime, or complete port of its modules.

## Choose the smallest complete path

| Path | Use it when | Minimum result |
| --- | --- | --- |
| **Direct** | Clear, low-risk, one-step request | Make the change and report evidence; no planning artifact required |
| **Build** | One bounded outcome, normally one work session | Inspect, settle intent, make a brief plan, implement, check and review |
| **Epic** | One outcome needs several stories or sessions | Discovery as needed, one source spec, ordered tracked stories, per-story build/review, integration check and retrospective |
| **Project** | Several epics must share product, UX, architecture, coordination, or approval decisions | Initiative, owned requirements source, shared design decisions, linked epic specs, ticket tree, gates, integration and per-epic closure |

Use [the full lifecycle](references/lifecycle.md) for Epic/Project work. Skip stages whose purpose is already satisfied by reliable evidence. Do not create a PRD, UX, architecture, approval gate, or extra file just to imitate a ceremony. For vague intent, use discovery; for a small known fix, start at Build. In an existing codebase, inspect its current source and conventions before relying on old planning documents.

## Execute each build as a bounded unit

For each Build or story: establish the baseline; connect the request to acceptance checks; inspect relevant code and project evidence; identify material unknowns and risk; write/update the [build plan](templates/build-plan.md) when it helps; implement; run relevant authorized checks; review against intent and baseline; fix in-scope findings; record unrelated work as deferred. Keep status honest: **planned → ready → in progress → built → accepted/done**, with **blocked**, **deferred**, and **dropped** available. A built result is not accepted merely because the coding session ended.

## Keep sources of truth and memory distinct

Project requirements, design, architecture, stories, build plans and retrospective artifacts stay with the project in its existing documentation convention. MemoryCore stores compact cross-session decisions and handoff notes: use `SaveTopic` for reusable decisions, `UpdateSession` for the next step/blocker, `Recall` for older relevant history, and `RecordTurn` after each instruction when an authenticated identity exists. Do not copy whole planning documents into diary memory. Current code and measured results outrank stale notes.

## Roles, gates, and provider limits

Use product, research, design, architecture, implementation, testing and review perspectives only where they add expertise. A single AI may apply several perspectives, but must not call its own review independent. Use real parallel agents only when the active host exposes them and the task authorizes them. Put human decisions where requirements, irreversible choices, external effects, ownership, or acceptance actually depend on them; do not interrupt execution for choices that evidence can settle.

Use relevant templates in `templates/`; they are source material, not files to copy automatically. Keep workflow instructions portable and provider-neutral. Never claim a host feature, test, delegation, approval, commit, publication, or rendered result that was not actually performed.
