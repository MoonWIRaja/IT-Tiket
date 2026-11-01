---
name: skill-recommender
description: Help a user discover, compare, and add AI skills from any provider. Use when the user explicitly wants a skill or asks which skills would help their work. In MemoryCore, choose team or personal scope and inspect candidates with SkillSpector before installation.
---

# Skill Recommender

Adapted from the user's `Downloads/SKILL.md`. Its two modes, plain-language questions, broad domain search, and quality checks are retained here for this project. The original file remains at its user-provided location; this project version adds team scope and NVIDIA SkillSpector.

## Role of each part

**Skill Recommender** works out what the user needs, finds plausible skills, compares their usefulness and maintenance, and asks where an addition should live. **NVIDIA SkillSpector** examines the exact candidate's files for security findings before installation. The integrated `Invoke-SkillFlow.ps1` runs the scanner and guards the reviewed copy. SkillSpector is a separate local CLI dependency; its source code is not copied into this feature.

## Choose a mode

- **Direct lookup:** If the user names a task or skill, restate the need briefly and search for relevant candidates. Do not run an onboarding interview.
- **Guided setup:** If the user asks which skills they need, ask a short, adaptive sequence about their work, repeated tasks, tools, and goals. Use what they already told you. Stop when you have enough to make useful recommendations.

Search beyond coding when relevant, including writing, research, administration, design, and personal workflows. First check whether `.Mcore/Feature/` already covers the need. For external candidates, prefer original publishers or maintained repositories. Check author, release history, license, maintenance, dependencies, and exact contents. Popularity alone is not evidence of safety. Show a short comparison and recommend the best match before adding it.

## Add a skill to MemoryCore

1. Ask: **For everyone on this project, or only for you?** Ask for each newly added skill. If the user already specified the scope, use it. `Team` installs under `.Mcore/Feature/`; `Personal` installs under the logged-in user's ignored `.Mcore/users/<user-id>/skills/`.
2. Obtain the exact candidate as a local `SKILL.md` or a directory containing one. Do not execute its scripts or installation instructions. Review the source and pin a release or commit where possible. Before installation, adapt provider-specific frontmatter, tool names, host configuration, and setup assumptions into provider-neutral instructions. Keep a vendor integration only as an optional, verified adapter; provide a portable fallback and never claim that an unavailable host tool exists.
3. Run `Invoke-SkillFlow.ps1 -Action Review -CandidatePath <local path> -Name <skill-name> -Scope Team` (or `Personal`). It calls SkillSpector with `--no-llm --format json`, saves the full report in ignored `.Mcore/.runtime/skill-reviews/`, and returns a `review_id`, verdict, score, and finding count.
4. Read the **full** report and candidate files. Check scripts, network actions, requested credentials, dependencies, and findings. Exit code 0 is not automatic approval: `SAFE` and `CAUTION` can both return 0, and a static scan can miss harm. If the result blocks installation or contains high findings, choose another candidate or revise and rescan it.
5. After manual review, run `Invoke-SkillFlow.ps1 -Action Install -ReviewId <id> -ManualReviewComplete`. Installation fails if the scanned files changed, the report blocks them, or a skill already exists at the destination. The script copies through an ignored staging area and verifies the copy before placing it in `.Mcore`.
6. Explain the source, chosen scope, scan result, and limitations. In a configured MemoryCore instance, call `RecordTurn` for this user instruction. Read the installed `SKILL.md` on demand; provider-native skill menus do not automatically discover this universal folder.

If the user explicitly requested a named skill to be added, that request authorizes the addition. Ask only for missing scope or essential details. If SkillSpector is unavailable, the integrated flow stops before installation. Scan each update again; an earlier report does not cover changed bytes.

The project guide at `.Mcore/skills-and-mcp.md` contains the shared and personal paths. Credentials and MCP server login remain per member even when a skill is shared.
