---
name: autogpt-patterns
description: Plan a bounded recurring or multi-step automation when a user asks for an agent that runs toward an outcome, on a trigger, or on a schedule.
---

# Bounded automation

Native MemoryCore workflow inspired by [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT). The active AI executes the loop with its existing tools.

1. Turn the request into a concrete outcome, required inputs, completion check and allowed side effects.
2. Break the outcome into dependent steps. Execute the next ready step; inspect its result before starting a dependent step.
3. Keep the current checkpoint, output locations and remaining steps in a stable `SaveTopic` entry. Reuse completed work on resume.
4. Retry a failure only when new evidence supports a correction. After repeated identical failures, report the missing input or capability and record a blocked outcome.
5. Verify the combined outcome and record the result. Continue within the authorized task; do not invent an unattended schedule.

A recurring job requires the current host's real scheduler and a configured trigger. A written plan alone does not run in the background. No AutoGPT platform account is needed for the attended workflow.
