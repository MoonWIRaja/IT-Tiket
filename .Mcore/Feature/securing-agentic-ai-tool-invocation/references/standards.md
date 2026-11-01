# Standards and References — Securing Agentic AI Tool Invocation

## MITRE ATLAS References

| Technique ID | Name | Tactic | Rationale |
|---|---|---|---|
| AML.T0053 | LLM Plugin Compromise | Execution | Agent tools are the asset these controls protect |
| AML.T0051 | LLM Prompt Injection | ML Attack Staging | Injection can drive unauthorized tool calls |
| AML.T0051.001 | LLM Prompt Injection: Indirect | Initial Access | Untrusted tool results can influence later calls |
| AML.T0057 | LLM Data Leakage | Exfiltration | Excessive tool agency can expose data |

## NIST AI RMF References

| ID | Name | Rationale |
|---|---|---|
| GOVERN-1.3 | Processes, procedures, and practices are in place to determine and manage AI risks and benefits | Governance of tool invocation, approvals, and audit |

## OWASP Agentic AI Top 10

| Class | Name | Rationale |
|---|---|---|
| Tool Misuse | Agent abuses available tools | Allowlist and argument validation reduce misuse |
| Excessive Agency | Agent acts beyond intended scope | Policy gate and human approval constrain action |
| Privilege Compromise | Agent uses overly broad credentials | Scoped identity binding limits access |

## Official resources

- OWASP Agentic AI threats and mitigations: https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- MITRE ATLAS: https://atlas.mitre.org/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework