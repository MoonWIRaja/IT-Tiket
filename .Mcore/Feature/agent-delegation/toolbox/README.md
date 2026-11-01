# Project `toolbox/` Registry (Caveman Blocks & Signed-Off Assets)

This folder (`{{project_root}}/toolbox/`) stores all reusable project assets, signed-off scripts, templates, linters, and reference documentation. Every item in `toolbox/` is bound to **Section 3 (The Rules)** of `PLAYBOOK.md`.

## What to Store Here
- **Brand & Static Assets**: e.g., `toolbox/logo.png`, icons, fonts, design tokens.
- **Signed-Off Scripts (Caveman Blocks)**: e.g., `toolbox/verify.py`, `toolbox/deslop.py`, `toolbox/deploy.sh`. Re-running a signed-off script from `toolbox/` cuts tool-loop tokens by ~80% compared to regenerating shell pipelines every turn.
- **Templates & Schemas**: e.g., `toolbox/PLAYBOOK.template.md`, `toolbox/openapi.json`, `toolbox/rea-findings.md`.
- **CLI-Anything Harnesses**: `toolbox/cli_anything_harness.py` for headless execution of software suites (Blender, LibreOffice, Inkscape, etc.) with structured JSON outputs.
