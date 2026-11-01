---
name: context-mode
description: Reduce large tool outputs and recover relevant context when a task risks filling the AI context window.
---

# Bounded context

Native workflow inspired by [context-mode](https://github.com/mksglu/context-mode). Use the active host's search and command tools; MemoryCore stays the record of past decisions.

1. State the question the next read should answer. Search filenames or symbols first and read the relevant region.
2. For large text files or saved tool output use `.Mcore/tools/Read-Context.ps1 -Path <file> -Query <literal text>`. It returns line numbers, a size bound and a clipping flag without changing the source.
3. If the result is clipped or insufficient, narrow the query or use `-Raw`. Never infer that an omitted error or match does not exist.
4. For structured data, calculate counts and selections with code rather than loading every record into the model.
5. Save decisions through `SaveTopic`, and continuation through `UpdateSession`; use `Recall` for older evidence.

No external MCP server or duplicate memory database is required. Do not compress the same output twice.
