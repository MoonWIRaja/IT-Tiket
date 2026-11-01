# Connection and task recovery

Use this guide only after observing an REA connection, command, approval, or capability blocker. Keep the user's target and question in view, explain the blocker, use any supported evidence that still answers part of the question, and resume the original task if the blocker is resolved.

## Diagnose from the active host

Inspect the tools actually exposed in the current session and their advertised input and output schemas. The installed skill does not by itself install REA, register an MCP server, or grant tool access. Do not assume that an upstream repository's latest tool catalog matches the installed server.

Classify the observed failure:

- No REA tools are available: check whether REA is configured for this host. Do not change host configuration as routine troubleshooting.
- A tool reports `provider_unavailable`: use that operation's returned availability reason and remediation. This describes an analysis backend, not the AI host.
- The host rejects a call or asks for approval: do not repeat the same rejected call, disable a sandbox, or broaden permissions. Follow the host's documented approval flow when authorized; otherwise continue with supported evidence and report the limit.
- A shell cannot find `rea` or a compatible runtime: inspect the current shell's PATH and installed versions. Do not install or globally change tools merely to make one workflow run.

## Repair only when requested and authorized

If the user asks to install or repair REA, identify the active host and consult REA's official installation guidance for that host and release. Prepare a read-only plan that shows the exact configuration files, backups, additions, and changes to existing skills. Apply only the authorized scope, preserve existing entries and access controls, then verify that the expected tools are actually exposed. Do not create provider-specific folders in the project.

## Continue with supported evidence

Static JavaScript inspection, ordinary archive inventory, and offline capture review may answer part of a question without native analysis engines or a live browser. Use only available, supported methods. Label ordinary shell or source inspection as such; only actual REA results supply REA Evidence. Never substitute another target, imply static analysis observed execution, or claim coverage that the result does not show.

When a blocker leaves a specific evidence gap, state that gap and continue the rest of the request. Do not loop through setup or repeat an identical failed call without new information.