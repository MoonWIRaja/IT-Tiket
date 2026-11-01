---
name: strix-security
description: Review application code, authentication, authorization, encryption, input handling, and dependency risks with the active AI. Use for security reviews or sensitive changes; no Strix account or model API is required.
---

# Native security review

The logged-in MemoryCore AI performs this workflow using its existing file, search, and test tools. Start directly on the current project; do not install Strix, request a model endpoint, or ask for an extra API key. The name credits [Strix](https://github.com/usestrix/strix) as inspiration; this is MemoryCore's own review procedure, not a run of the upstream autonomous pentest engine.

## Investigate

1. Establish the requested scope from the current task. A request to review this local project authorizes reading its code and running appropriate local tests. Live traffic or testing another target needs an authorized scope.
2. Identify entry points, data stores, user roles, secrets boundaries and sensitive operations. Trace attacker-controlled input through validation to its consumer. Read `review-checklist.md` for the relevant categories.
3. Inspect code around each suspected problem. Confirm whether authorization occurs server-side, whether a value can reach the suspected operation, and whether another layer already prevents the problem. Search locally before sending project content to an external service.
4. Reproduce a suspected defect with a minimal local test or demonstrate the reachable code path. Never use real credentials or destructive payloads merely to prove a point. Verify dependency versions and whether an affected path is used.
5. When a fix is requested, apply the smallest complete repair and run the regression that distinguishes old behavior from required behavior. Check adjacent entry points for the same defect.

## Deliver

For each verified finding report severity, affected file and line, preconditions, evidence, impact and fix. Label a hypothesis as unverified. Include what was tested and any untested surface that matters. A clean review means no findings within the inspected scope; it does not prove the application has no vulnerabilities.

Record the outcome through `RecordTurn`. Save reusable decisions with `SaveTopic` without credentials or exploit secrets. The current provider remains the same registered MemoryCore AI throughout.
