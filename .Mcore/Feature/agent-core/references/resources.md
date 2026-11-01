# Required resource selection

This module belongs to Agent Core and is shared across its authenticated users. Every turn checks whether it applies. For a task requiring a new external API, data source, utility, hosting choice, self-hosted application, scraper or browser workflow, consult the matching sources below and validate the selected option before recommending or integrating it. Use already verified suitable project tools first. A greeting, explanation from known local facts or small local edit does not require an external lookup.

## The eleven sources

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

These are discovery sources, not endorsements of every listed service. The entrypoint and this module are mandatory project guidance; individual packages run only for a relevant task with available tools and appropriate authorization. Do not invoke all eleven sources on every turn or represent a source link as an installed runtime.

## Selection workflow

1. Identify the real need and constraints: data/domain, API versus UI, no-auth/no-card requirements, budget, privacy, deployment environment and expected volume.
2. Select the matching source family. For APIs use the broad list, the no-auth list when required and API Finder when available. For utilities consult both free-tool collections; for infrastructure consult free-for-dev and the developer-tools list, or awesome-selfhosted when user-controlled hosting is relevant. For extraction assess Agent Reach and the scraping catalog; for browser interaction assess Browser Use. Avoid fetching unrelated catalogs.
3. Read relevant sections, not entire huge lists. Deduplicate the same product across catalogs; two copied entries are not two independent confirmations. A current verified project choice can satisfy the check without a new comparison.
4. Validate finalists through their official documentation: usable endpoint/interface, current authentication, HTTPS, CORS if called by a browser, rate limits, terms, license and maintenance. Distinguish free software, free service tier, limited trial and paid service. Do not infer unlimited use, no card, no account or local-only processing from a list title.
5. Where useful and authorized, make one bounded read-only request with synthetic/public input or inspect the actual browser result. Check status, response shape and relevant fields. A documentation URL returning HTTP 200 does not prove its API endpoint works. Never use a mutating endpoint as a connectivity test.
6. Choose the smallest adequate option. When a decision needs comparison, report the selected option, official link, reason, relevant limits and verification date. State any required account/runtime setup plainly. Do not create accounts, enable billing, deploy applications or synchronize sessions merely to complete discovery.
7. Record the source and factual result through the authenticated RecordTurn/SaveTopic workflow when reusable; keep private credentials and raw personal data out of shared notes. An inaccessible catalog is a reported gap, not a reason to fabricate results or abandon unrelated work.

## API Finder adapter

The inspected README describes a local CLI with `--no-auth`, `--https`, `--cors`, `--openapi`, `--category`, `--source`, `--limit`, `--json`, `--check` and `--refresh`. Read the installed version's help before relying on flags. If already installed and reviewed, a bounded discovery example is:

```text
public-api-finder "weather forecast" --no-auth --https --limit 5 --json
```

Treat query text as an argument, not shell code. Its reachability check concerns result URLs; separately verify the selected API's functional endpoint. The repository also documents hosted credit/payment paths. This integration uses catalog/local discovery by default; a paid endpoint is a separate service choice with explicit billing authorization. Do not execute an unpinned `npx --yes` command merely because a README contains it.

## Agent Reach adapter

The inspected project selects/configures upstream tools and diagnoses their channels; work is performed by those tools. Do not invent a universal `agent-reach search` command. Inspect the reviewed installed version and relevant channel documentation, then use diagnostics such as `agent-reach doctor --json` when needed. Follow its reported active backend and verify the actual requested operation; configuration present does not prove a live platform session works.

At the inspected revision, `agent-reach install --env=auto` is documented as check-only, with `--dry-run` for preview and `--system` for external/system changes. These commands presume the package already exists. Installation requires reviewing the exact package and upstream dependencies first, a suitable Python runtime, task-relevant channels and the authorized configuration scope. Do not activate every optional channel or daily monitoring by default.

Keep binaries/caches in appropriate device storage, shared integration guidance in `.Mcore`, and credentials local to the authenticated member. Provider-specific skill-folder suggestions in upstream installation docs do not replace this project's MemoryCore layout. Where upstream docs suggest pasting keys/cookies into chat, use a supported local secret-entry method instead. Read/search capability does not grant authority to post, send messages or access unrelated private accounts.

## Browser Use adapter

The inspected project distinguishes a local library/CLI from hosted browser and hosted-agent services. Check the currently chosen version's runtime, browser and model requirements; do not copy a README model ID or price as permanent configuration. Reuse suitable existing browser tools before adding another runtime. If a Browser Use implementation is selected, inspect its exact package and relevant docs, choose local versus cloud explicitly, and verify a bounded navigation/read task before relying on it.

An open-source library does not make model inference, hosted browsers or proxies free. Connecting an existing browser profile or syncing it to a service changes access/data exposure; use the user's applicable authorization and per-user isolation. Keep session material out of shared MemoryCore records. Scope navigation, uploads and mutations to the requested task, observe results, and end task-owned sessions cleanly. Never promise universal access or successful challenge handling from marketing claims.

## Extraction and self-hosting

For extraction prefer structured public APIs, feeds or a direct read when sufficient; use a browser when the task actually requires client-rendered content or interaction. Limit request volume, cache reusable public results, handle pagination and retries, and respect site access conditions. A catalog entry describing anti-detection or proxy features does not authorize circumventing access controls.

For self-hosted choices compare actual runtime/platform support, data persistence, update process, backups, exposed ports, authentication and resource cost. Free licensing does not mean free hosting or operations. Discovery does not start a deployment. Use official deployment docs for the selected version when deployment is requested.

## Provenance and maintenance

[resource-sources.json](resource-sources.json) records all eleven URLs, the inspected commit and README permalink, retrieval time, detected license metadata and review scope. A missing/NOASSERTION license field means metadata is inconclusive, not permission to copy an entire catalog or codebase. This module is original summarized guidance with source links; no upstream software or catalog payload is bundled as executable code.

This update installs the guidance inside Agent Core; it does not install the three runtimes, connect accounts or validate every listed API/service. Before installing or updating third-party executable code, inspect that exact version and dependencies, apply the project's review flow, and verify its operation. Refresh relevant live facts when using a source; never silently execute an auto-update.
