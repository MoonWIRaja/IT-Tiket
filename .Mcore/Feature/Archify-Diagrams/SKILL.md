---
name: archify-diagrams
description: Create or review a technical architecture, workflow, sequence, or data-flow diagram when a visual would clarify a system.
---

# Verifiable diagrams

Native workflow inspired by [Archify](https://github.com/tt-a1i/archify). The current AI authors the diagram using available text or rendering tools.

1. Identify audience, question and suitable diagram type: architecture, sequence, lifecycle, data flow or workflow.
2. Derive a small node/edge list from source evidence. Label assumptions; distinguish control flow from data flow.
3. Produce Mermaid for compact technical diagrams, or self-contained HTML/SVG when interaction or export matters. Keep editable source with the delivered file.
4. Validate every edge endpoint, branch label, direction, lifecycle state and source claim. For HTML, inspect rendering when the host has a browser; otherwise disclose the visual check is pending.
5. Report the output path and how to view/export it. Do not claim an interactive control works without implementing it.

No Archify binary is required. The upstream renderer and animation catalog are not reproduced by this workflow.
