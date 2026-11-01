# AI Engineering from Scratch & Agent Reach Engine

This reference module is an active operational engine of `agent-delegation`. It integrates first-principles AI, RAG, MCP, and harness engineering (`rohitg00/ai-engineering-from-scratch`) with multi-channel web/platform search routing (`Panniantong/agent-reach`).

---

## 1. AI Engineering from Scratch (`rohitg00/ai-engineering-from-scratch`)

### A. First-Principles AI Architecture
Build AI systems from fundamental primitives rather than relying on brittle, high-abstraction wrapper libraries:
- **LLM Harness & Structured Output**: Build typed schema extractors, JSON-schema validators, and deterministic retry loops with clear fallback handling.
- **RAG from Scratch**: Implement embedding chunking strategies, vector similarity math (cosine similarity / dot product), metadata filtering, reciprocal rank fusion (RRF), and re-ranking without opaque frameworks.
- **Model Context Protocol (MCP)**: Build RFC-compliant stateless and stateful MCP servers and clients, exposing tools, resources, and prompt templates cleanly.
- **Agent Skills Packaging**: Structure portable `SKILL.md` bundles with YAML frontmatter, strict trigger descriptions, modular references, and executable `toolbox/` scripts.

### B. Interactive Learning Mode (`start-learning`)
When the user wants to learn AI engineering from first principles:
- Maintain progress tracking in `LEARNING.md`.
- Follow the rigorous lesson cycle:
  1. Present the fundamental mathematical or architectural problem.
  2. Guide the user through deriving the algorithm from scratch.
  3. Implement the clean Python/TypeScript code.
  4. Run automated test validation via `python3 verify.py`.
  5. Store the verified reference artifact into `toolbox/`.

---

## 2. Agent Reach Engine (`Panniantong/agent-reach`)

### A. Channel Routing & Diagnostics
- `agent-reach` configures, routes, and diagnoses upstream tools for searching and reading web platforms (Twitter/X, Reddit, GitHub, Bilibili, WeChat, general search).
- Run diagnostics via `agent-reach doctor --json` to inspect which platform channels and upstream CLI tools are active, authenticated, and healthy.

### B. Solo-Agent Web Reach Rules
- **Direct Upstream Invocation**: Do NOT invent a fictional `agent-reach search` command. Use the diagnostic-verified active upstream tool directly from the Main Agent.
- **No Sub-Agent Spawning**: Never spawn a child scraper agent. Execute the query directly in the main session, compress the retrieved text using **RTK** and **Caveman Browse** rules, and store durable intelligence in `toolbox/`.
- **Credentials & Privacy**: Keep API tokens and credentials in local environment configuration; never write authentication tokens into shared `PLAYBOOK.md` or git-tracked files.
