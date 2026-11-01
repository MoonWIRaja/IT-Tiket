# CLI-Anything Engine: Making ALL Software Agent-Native

This reference module is an active operational engine of `agent-delegation`. Based on **`HKUDS/CLI-Anything`** and **CLI-Hub** (`https://clianything.cc/`), it enables the Solo Principal Agent to interact with complex desktop and external software (Blender, LibreOffice, GIMP, Inkscape, FreeCAD, Audacity, QGIS, Godot, Kdenlive, Obsidian, Calibre, 3MF, etc.) via **deterministic CLI harnesses and headless scripting bridges** instead of fragile, slow, pixel-dependent GUI mouse clicks.

---

## 1. The Core Philosophy: "Tomorrow's Users Will Be Agents"

Traditional GUI software is built for human eyes and hands. When AI agents attempt to operate GUI applications through computer vision and mouse coordinates alone, they suffer from high latency, visual drift, resolution mismatches, and broken clicks.

**CLI-Anything** transforms any software into an **agent-native tool**:
1. **Deterministic Execution**: Every software action is expressed as a clear CLI command or script with typed parameters, execution flags, and reproducible output.
2. **Structured JSON Output**: Every action returns structured JSON output, status codes, and clear errors rather than requiring visual inspection of the screen.
3. **Low-Token Footprint (Fusing with RTK & Caveman)**: Running a 1-line CLI command or Python bridge script consumes ~30-80 tokens, compared to multi-modal screenshot loops that burn 2,000+ tokens per click.
4. **Toolbox Preservation (Caveman Blocks)**: The agent saves verified CLI harnesses and headless scripts directly into `toolbox/` (e.g., `toolbox/render_scene.py`, `toolbox/convert_docs.sh`) and links them under **Section 3 (The Rules)** in `PLAYBOOK.md`.

---

## 2. Supported Software Harness Architectural Patterns

When the user requests tasks involving creative, document, 3D, CAD, or multimedia software, the agent prioritizes headless CLI harness bridges:

### A. 3D & CAD (Blender, FreeCAD, 3MF)
- **Blender**: Execute headless Python scripts via `blender --background --python <script.py>`. Construct scenes, modify meshes, apply materials, and render frames directly into artifacts.
- **FreeCAD**: Run headless FreeCAD Python scripts (`freecadcmd` or Python API) to generate parametric solid models, export STEP/STL, and run boolean operations.
- **3MF**: Inspect mesh manifolds, resize holes, repair non-manifold triangles, and validate 3D print assets via `3mf` CLI.

### B. Document & Office Automation (LibreOffice, Calibre, Pandoc)
- **LibreOffice Headless**: Convert DOCX, PPTX, XLSX, ODT to PDF or clean HTML via `libreoffice --headless --convert-to pdf <input_file> --outdir <out_dir>`.
- **Calibre**: Search, extract metadata, convert e-books (EPUB, MOBI, PDF), and modify library schemas via `ebook-convert` and `calibre` CLI tools.
- **Pandoc**: Transform Markdown, LaTeX, and HTML with high-fidelity template binding.

### C. Graphics, Vector & Video (Inkscape, GIMP, ImageMagick, Kdenlive, Shotcut)
- **Inkscape**: Vector manipulation and rasterization using command-line verbs: `inkscape <input.svg> --export-filename=<output.png> --export-type=png`.
- **GIMP**: Batch image filters and processing via Script-Fu or headless Python-Fu.
- **ImageMagick**: High-speed batch cropping, color space conversion, resizing, and composition via `magick`.
- **Kdenlive / Shotcut / MLT**: Headless video timeline rendering and subtitle generation via MLT framework (`melt`) and FFmpeg pipelines.

### D. Knowledge Management & Notes (Obsidian, Joplin)
- **Obsidian Agent CLI**: Automate vault management, note creation, semantic backlinks, and persistent agent memory workflows via the Local REST API or native vault file structures.
- **Joplin**: Synchronize notebooks, search tags, encrypt/decrypt notes, and export markdown via Joplin CLI.

### E. GIS & Spatial Computing (QGIS)
- **QGIS / PyQGIS**: Automated map composition, geospatial layers, vector buffering, and raster geoprocessing via headless PyQGIS scripts.

---

## 3. The CLI-Anything Workflow for Solo Agents

1. **Check Local Binary Availability**:
   - Run `python3 toolbox/cli_anything_harness.py check <software-name>` to verify whether the required binary (e.g., `blender`, `libreoffice`, `inkscape`) is installed.
   - If missing, check if an existing CLI harness is available via CLI-Hub (`cli-hub install <name>`, only after the user approves that exact command and its source) or ask the user which standard package manager (`brew`, `apt`, `winget`) to use; never install silently.
2. **Climb the Ponytail Ladder (No Unnecessary GUI)**:
   - *Rung 1*: Check if the target software has a native headless CLI flag or standard library tool.
   - *Rung 2*: Check `toolbox/` for existing signed-off harness scripts.
   - *Rung 3*: Use `Cua` (`trycua/cua`) background desktop automation **only** if the software has zero CLI/scripting interfaces and strictly requires native OS window interaction.
3. **Execute Deterministically**:
   - Run the command via `python3 toolbox/cli_anything_harness.py run "<command>"`.
   - Inspect the structured JSON output (exit code, stdout, stderr).
4. **Store Reusable Automation in `toolbox/`**:
   - If the task required creating a new custom automation script (e.g., a complex Blender scene generator or Inkscape batch exporter), save the verified script into `toolbox/<task_name>.py` and bind it in `PLAYBOOK.md` as an authoritative project rule.
