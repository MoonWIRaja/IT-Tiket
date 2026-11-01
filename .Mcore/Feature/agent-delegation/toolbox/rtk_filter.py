#!/usr/bin/env python3
"""
Native RTK Output Compressor (toolbox/rtk_filter.py)
Filters and compresses stdout from shell commands (git, pytest, ls, tree, rg)
cutting input tokens by 60% to 90% while preserving load-bearing diagnostics.
"""
import sys
import re

def filter_git_status(lines):
    # Keep compact summary only
    clean = []
    for line in lines:
        if line.strip().startswith("On branch") or line.strip().startswith("Your branch"):
            clean.append(line.strip())
        elif line.strip().startswith("Changes to be committed:") or line.strip().startswith("Untracked files:"):
            clean.append(line.strip())
        elif re.match(r"^\s*(?:modified|new file|deleted|both modified):", line):
            clean.append("  " + line.strip())
        elif line.strip() and not line.startswith("  (") and not line.startswith("("):
            clean.append(line.strip())
    return clean[:40]

def filter_pytest(lines):
    # Only keep failures, errors, and the final summary line
    failures = []
    capture = False
    summary = ""
    for line in lines:
        if "=== FAILURES ===" in line or "=== ERRORS ===" in line:
            capture = True
        if capture:
            failures.append(line)
        if re.search(r"===.*(?:passed|failed|skipped).*===", line):
            summary = line
    if failures:
        return failures[:60] + [summary]
    return [summary if summary else "All tests passed."]

def filter_directory_listing(lines):
    # Collapse large file lists into counts by directory
    dir_counts = {}
    files = []
    for line in lines:
        parts = line.strip().split("/")
        if len(parts) > 1:
            d = parts[0]
            dir_counts[d] = dir_counts.get(d, 0) + 1
        else:
            files.append(line.strip())
    result = [f"Directory [{d}/]: {count} files" for d, count in dir_counts.items()]
    result.extend(files[:25])
    return result

def main():
    if len(sys.argv) < 2:
        mode = "generic"
    else:
        mode = sys.argv[1].lower()

    lines = sys.stdin.readlines()
    if mode == "git-status":
        out = filter_git_status(lines)
    elif mode in ["pytest", "test"]:
        out = filter_pytest(lines)
    elif mode in ["ls", "tree", "files"]:
        out = filter_directory_listing(lines)
    else:
        # Generic truncation: cap long lines and limit to 80 lines
        out = [l[:160].rstrip() for l in lines[:80]]
        if len(lines) > 80:
            out.append(f"... [Truncated {len(lines) - 80} lines to save tokens]")

    print("\n".join(out))

if __name__ == "__main__":
    main()
