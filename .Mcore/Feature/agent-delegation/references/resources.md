# Required resource selection

This module belongs to Agent Core / Agent Delegation and is shared across its authenticated users. Every turn checks whether it applies. For a task requiring a new external API, data source, utility, hosting choice, self-hosted application, scraper, browser workflow, token-compression tool, thinking framework, or specialist workflow, consult the matching sources below and in [delegation-and-adapters.md](delegation-and-adapters.md) and [tri-core-token-thinking.md](tri-core-token-thinking.md) before recommending or integrating a new external option. Use already verified suitable project tools and `toolbox/` scripts first. A greeting, explanation from known local facts or small local edit does not require an external network lookup.

## The eleven discovery sources

| Repository | Required use when relevant |
|---|---|
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | Broad API discovery; inspect category, authentication, HTTPS and CORS information where provided. Verify the chosen provider's own docs. |
| [Panniantong/agent-reach](https://github.com/Panniantong/agent-reach) | Assess web/platform reading and search through its upstream-tool routing and diagnostics. Use the adapter below; enabled channels depend on actual installation and access. |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | Assess browser interaction when structured APIs or existing host browser tools do not meet the task. Choose the actual local/hosted mode deliberately. |
| [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) | Discover software for user-controlled hosting; compare deployment, license, updates, backup and operating requirements. |
| [alexandresanlim/public-apis-no-auth-only](https://github.com/alexandresanlim/public-apis-no-auth-only) | Start here when an API must avoid keys/accounts; confirm that the endpoint still works without authentication. |
| [CoffeePrism/awesome-free-tools](https://github.com/CoffeePrism/awesome-free-tools) | Discover browser-based utilities and tools for writing, developer work, marketing or product research; verify account requirements and data handling at the selected site. |
| [abdessamadbettal/awesome-free-tools](https://github.com/abdessamadbettal/awesome-free-tools) | Cross-check developer/design utilities and workflow alternatives; confirm actual free functionality and whether computation stays local. |
| [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev) | Discover hosted developer infrastructure and free service tiers; check quotas, duration, billing, region and production suitability. |
| [BuiltByEcho/public-api-finder](https://github.com/BuiltByEcho/public-api-finder) | Structured API discovery with auth/HTTPS/CORS/OpenAPI filters when its reviewed CLI is available. Otherwise use the catalogs directly. |
| [spinov001-art/awesome-free-developer-tools-2026](https://github.com/spinov001-art/awesome-free-developer-tools-2026) | Supplement hosting, CI/CD, database, API, AI, monitoring and development-tool comparisons. The year in its name does not establish freshness. |
| [spinov001-art/awesome-web-scraping-2026](https://github.com/spinov001-art/awesome-web-scraping-2026) | Compare extraction libraries, browser frameworks and service alternatives when data collection is required. Prefer a suitable documented API when available. |

## The ten integrated engineering, thinking, and token-efficiency frameworks

| Repository | Integrated role inside `agent-delegation` |
|---|---|
| [rtk-ai/rtk](https://github.com/rtk-ai/rtk) | CLI proxy & command-output filtering reducing bash/file/test input tokens by 60-90%. |
| [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) | 4-Rung Senior Dev minimalism (-53% code, -45% tokens), mandatory micro-tests, `/ponytail-review`, and `/ponytail-audit`. |
| [juliusbrussee/caveman](https://github.com/juliusbrussee/caveman) | Six Rocks output & session token reducer (-65% output tokens, Read Less, Auto, reusable `toolbox/` Blocks, Cache Warmth, Browse compression). |
| [tjboudreaux/cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills) | 28 eval-informed mental models & `thinking-model-router` powering the Micro-Token Cognitive Scratchpad (MTCS) for Ultra-Thinking at Low token cost. |
| [obra/superpowers](https://github.com/obra/superpowers) | End-to-end SDLC skills (`brainstorming`, `writing-plans`, inline `executing-plans`, strict RED-GREEN-REFACTOR `test-driven-development`, `systematic-debugging`, `verification-before-completion`). |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | Multi-division specialist roles absorbed inline by the Main Solo Agent without spawning child processes. |
| [nidhinjs/prompt-master](https://github.com/nidhinjs/prompt-master) | 9-dimension intent extraction, Model Recency Gate, 30+ AI tool routing profiles, and load-bearing token audit. |
| [ItsssssJack/SlopMonster](https://github.com/ItsssssJack/SlopMonster) | 5-category English AI-slop linter (`tools/deslop.py`), 3-pass human-grade copy editor, and cross-model CLI cleanse (`tools/cleanse.sh`). |
| [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) | First-principles AI, RAG, MCP, Agent Skills, and verification harness engineering. |
| [trycua/cua](https://github.com/trycua/cua) & [morluto/rea](https://github.com/morluto/rea) | Background desktop automation/sandboxes (`cua-driver`, `lume`, `cua-bench`) and reverse engineering (`rea-agents` CLI/MCP). |
| [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) | Agent-Native Software Engine: Making all GUI/complex software (Blender, LibreOffice, GIMP, Inkscape, FreeCAD, QGIS, Obsidian) controllable via deterministic CLI harnesses and headless scripts. |

## Selection workflow

1. Identify the real need and constraints: data/domain, API versus UI, no-auth/no-card requirements, budget, privacy, deployment environment and expected volume.
2. Select the matching source family. For APIs use the broad list, the no-auth list when required and API Finder when available. For utilities consult both free-tool collections; for infrastructure consult free-for-dev and the developer-tools list, or awesome-selfhosted when user-controlled hosting is relevant. For extraction assess Agent Reach and the scraping catalog; for browser interaction assess Browser Use; for desktop interaction assess Cua; for reverse engineering assess REA. Avoid fetching unrelated catalogs.
3. Read relevant sections using RTK/Caveman bounded reads, not entire huge lists. Deduplicate the same product across catalogs; two copied entries are not two independent confirmations. A current verified project choice in `toolbox/` can satisfy the check without a new comparison.
4. Validate finalists through their official documentation: usable endpoint/interface, current authentication, HTTPS, CORS if called by a browser, rate limits, terms, license and maintenance. Distinguish free software, free service tier, limited trial and paid service. Do not infer unlimited use, no card, no account or local-only processing from a list title.
5. Where useful and authorized, make one bounded read-only request with synthetic/public input or inspect the actual browser result. Check status, response shape and relevant fields. A documentation URL returning HTTP 200 does not prove its API endpoint works. Never use a mutating endpoint as a connectivity test.
6. Choose the smallest adequate option (Ponytail Rung Check). When a decision needs comparison, report the selected option, official link, reason, relevant limits and verification date. State any required account/runtime setup plainly. Do not create accounts, enable billing, deploy applications or synchronize sessions merely to complete discovery.
7. Record the source and factual result through the authenticated RecordTurn/SaveTopic workflow when reusable; keep private credentials and raw personal data out of shared notes. An inaccessible catalog is a reported gap, not a reason to fabricate results or abandon unrelated work.

## API Finder, Agent Reach, and Browser Use adapters

- **API Finder**: Use `public-api-finder "<query>" --no-auth --https --limit 5 --json` when installed; treat query text as an argument, never shell code.
- **Agent Reach**: Inspect installed channels via `agent-reach doctor --json`; never invent `agent-reach search`.
- **Browser Use**: Prefer existing host browser tools or documented APIs first; verify local vs. cloud mode explicitly.
