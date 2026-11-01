# Prompt Master Engineering & Model Recency Engine

This reference module is an active operational engine of `agent-delegation`. Based on `nidhinjs/prompt-master`, it enables the Solo Agent to design, refine, and optimize production-grade prompts for 30+ AI systems with zero wasted tokens, while protecting against fabrication traps.

---

## 1. The Prompt Master Execution Pipeline

When the user asks to write, fix, optimize, or adapt a prompt for any AI tool:

1. **Target Tool & Surface Identification**: Determine the exact AI model and surface (e.g., Claude Code CLI, Cursor IDE, ChatGPT web, OpenAI API, Midjourney, v0, ComfyUI).
2. **9-Dimension Extraction**: Silently audit Task, Tool, Format, Constraints, Input, Context, Audience, Success Criteria, Examples.
3. **Clarification Cap**: If critical parameters are ambiguous, ask at most **3 concise questions**.
4. **Anti-Fabrication & Technique Selection**:
   - Apply safe, high-leverage techniques: explicit role assignment, XML tagging (`<context>`, `<task>`, `<constraints>`, `<output_format>`), concrete boundary constraints, few-shot examples, and binary verification criteria.
   - **BANNED TECHNIQUES in Single-Prompt Contexts**:
     - *Simulated Mixture of Experts (MoE)*: Multi-persona roleplay in a single forward pass increases hallucination.
     - *Simulated Tree/Graph of Thought*: Claiming to branch without real parallel evaluation degrades reasoning.
     - *Requesting Hidden Chain-of-Thought*: Never ask frontier reasoning models (o3, o4-mini, DeepSeek-R1, Claude 5 reasoning) for internal reasoning traces. Ask for assumptions, evidence, concise rationale, and verification output.
5. **Token Efficiency Audit**: Delete all filler, redundant pleasantries, and non-load-bearing adjectives.
6. **Delivery Contract**: Deliver one clean copyable prompt block followed by a 1-line strategy signature:
   `🎯 Target: [tool] · ⚡ Framework: [type] · 💰 Tokens: [count] · 💡 Strategy: [1 sentence]`

---

## 2. Model Recency & Surface Routing Profiles

### A. Claude Models (Claude Code, Claude 5.x / Opus / Sonnet / Haiku)
- Direct, positive instructions. Wrap mixed context in descriptive XML tags.
- For UI tasks: provide exact hex codes, pixel dimensions, and CSS transition timings.
- For Claude Code: define file scope, "do-not-touch" boundaries, and explicit stop conditions.

### B. OpenAI GPT Models & Reasoning Models (o3, o4-mini, GPT-6 / GPT-5.6)
- **Reasoning Models (o3, o4-mini, DeepSeek-R1)**: Provide ultra-clean, short instructions with explicit constraints and acceptance criteria. **NEVER add "think step by step"**—reasoning models already reason natively across thousands of tokens, and adding prompting scaffolding degrades their internal search trees.
- **Codex / API**: Specify exact file paths, function signatures, and return formats.

### C. Full-Stack & UI Generators (v0, Bolt, Lovable, Stitch)
- Define the exact technology stack, target breakpoint responsiveness (375px mobile, 1440px desktop), component hierarchy, and explicit "what NOT to scaffold" rules.

### D. Image & Media AI (Midjourney, Stable Diffusion, ComfyUI, Sora)
- Comma-separated visual descriptors over narrative prose.
- Explicit lighting, camera lens, aspect ratio (`--ar 16:9`), stylize/engine versions, and mandatory negative prompt parameters (`negative: blurry, cartoon, extra limbs`).
