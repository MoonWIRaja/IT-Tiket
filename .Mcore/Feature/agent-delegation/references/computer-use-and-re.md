# Computer-Use & Reverse Engineering Engine

This reference module is an active operational engine of `agent-delegation`. It integrates background desktop control, cross-OS sandboxes (`trycua/cua`), and reverse-engineering inspection (`morluto/rea`) directly into the Solo Agent workflow without spawning sub-agents.

---

## 1. Cua Computer-Use 2.0 Engine (`trycua/cua`)

### A. Core Architecture
- **`cua-driver`**: Cross-platform background automation daemon for Windows, macOS, and Linux. Enables the Main Agent to click, type, scroll, take screenshots, and inspect accessibility trees in native GUI applications **in the background without hijacking the user's mouse cursor or window focus**.
- **Cross-OS Sandboxes (`cua` CLI/SDK)**: Provision and control isolated ephemeral Linux, Windows, macOS, or Android sandbox environments (`cua sb create`, `cua sb exec`, `cua sb screenshot`).
- **`lume`**: Native lightweight macOS and Linux virtual machine management optimized for Apple Silicon and host hardware.
- **`cua-bench`**: Benchmark and evaluate computer-use agents with deterministic reward validation.

### B. Solo-Agent Operational Rules
- Connect to `cua-driver` or Cua sandbox via MCP server or CLI directly from the main session.
- **Never spawn an uncoordinated child agent inside the VM/sandbox**. The Main Agent executes the commands and reads the output directly.
- **Ephemeral Sandbox Lifecycle**: Always clean up sandboxes (`cua sb rm <id>`) after verification tests are complete to prevent resource leaks.
- **Security Barrier**: Respect keyvault boundaries. Never transfer authenticated production sessions or private keys into unverified sandboxes.

---

## 2. REA - Reverse Engineer Anything Engine (`morluto/rea`)

### A. Core Architecture
- Connects the agent via CLI (`rea-agents`) or MCP server to reverse-engineering providers:
  - **Web & Electron Applications**: Connects via Chrome Remote Debugging (`--remote-debugging-port=9222`) using an isolated `--user-data-dir`. Traces DOM mutations, network websockets, and Electron IPC channels.
  - **Bundled Code**: Decompiles and unpacks Webpack/Vite minified JavaScript, source maps, and .NET IL assemblies.
  - **Native Binaries**: Drives headless disassembly and decompilation providers (Ghidra, Hopper, IDA Pro, GNU `objdump`, Rizin).

### B. Solo-Agent Reverse-Engineering Protocol
1. **Scope & Authorization**: Reverse-engineer only user-authorized binaries, applications, and network protocols.
2. **Evidence Separation**: Strictly separate observed facts (e.g., literal decompiled opcode, API endpoint string, IPC event name) from speculative hypotheses.
3. **Capture Snapshot in `toolbox/`**:
   - Save recovered API schemas, protocol definitions, or disassembly traces into `toolbox/` (e.g., `toolbox/recovered_api.json`, `toolbox/rea_evidence.md`).
   - Bind these findings under **Section 3 (The Rules)** in `PLAYBOOK.md` before writing replacement or client code.
