#!/usr/bin/env python3
"""
CLI-Anything Agent Harness (toolbox/cli_anything_harness.py)
Bridges AI agents to external software (Blender, LibreOffice, GIMP, Inkscape,
FreeCAD, Obsidian, QGIS, Godot, etc.) via deterministic CLI execution and
structured JSON output, eliminating brittle GUI mouse clicks.
"""
import sys
import os
import json
import subprocess
import shutil
import shlex

KNOWN_HARNESSES = {
    "libreoffice": {
        "binary": "soffice" if os.name == "nt" else "libreoffice",
        "convert": "{binary} --headless --convert-to {out_fmt} {in_file} --outdir {out_dir}"
    },
    "inkscape": {
        "binary": "inkscape",
        "export": "{binary} {in_file} --export-filename={out_file} --export-type={out_fmt}"
    },
    "blender": {
        "binary": "blender",
        "script": "{binary} --background --python {script_file}"
    },
    "pandoc": {
        "binary": "pandoc",
        "convert": "{binary} {in_file} -o {out_file}"
    }
}

def detect_binary(name):
    cfg = KNOWN_HARNESSES.get(name)
    if cfg:
        target = cfg["binary"]
        return shutil.which(target) is not None
    return shutil.which(name) is not None

def run_harness(command_str):
    try:
        args = shlex.split(command_str)
        res = subprocess.run(args, shell=False, capture_output=True, text=True)
        return {
            "exit_code": res.returncode,
            "stdout": res.stdout.strip(),
            "stderr": res.stderr.strip(),
            "success": res.returncode == 0
        }
    except Exception as e:
        return {
            "exit_code": 1,
            "stdout": "",
            "stderr": str(e),
            "success": False
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python3 cli_anything_harness.py <check|run> [target/command]",
            "supported_harnesses": list(KNOWN_HARNESSES.keys())
        }, indent=2))
        sys.exit(1)

    action = sys.argv[1].lower()

    if action == "check":
        target = sys.argv[2] if len(sys.argv) > 2 else "libreoffice"
        available = detect_binary(target)
        print(json.dumps({
            "target": target,
            "installed": available,
            "harness_ready": available
        }, indent=2))
        sys.exit(0 if available else 1)

    elif action == "run":
        cmd = " ".join(sys.argv[2:])
        result = run_harness(cmd)
        print(json.dumps(result, indent=2))
        sys.exit(result["exit_code"])

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
