# API Reference — Tool Invocation Controls

## JSON Schema

Use a validator supported by the active implementation to reject arguments that do not match the tool's explicit schema. Set additional properties to false unless the tool contract intentionally allows them. Validate types, lengths, formats, enumerated values, and resource scopes; do not treat a valid schema as proof that the caller is authorized.

## Provider-neutral policy decision contract

| Decision | Meaning | Action |
|---|---|---|
| `allow` | Tool and arguments are allowlisted; impact is low | Execute through the trusted tool server |
| `require_approval` | The action is high impact or irreversible | Pause until an authorized human approves the exact action |
| `deny` | Unknown tool, invalid arguments, or failed policy | Reject and record the reason |

Bind `actor` to an authenticated identity supplied by a trusted layer. Hash sensitive arguments for correlation instead of storing raw secrets. Keep logs access-controlled and apply retention rules. The policy layer must execute before the tool and fail closed when validation or approval is unavailable.

A host or framework may provide an adapter for dispatch hooks and approval UI. Use only its current documented contract and do not assume it enforces server-side policy unless verified.