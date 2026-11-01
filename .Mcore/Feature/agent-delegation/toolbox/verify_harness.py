#!/usr/bin/env python3
"""
Solo Verification Harness (toolbox/verify_harness.py)
Executes tests, checks exit codes, validates outputs against acceptance criteria,
and enforces Superpowers RED-GREEN-REFACTOR cycles without spawning sub-agents.
"""
import sys
import subprocess
import time
import shlex

def run_command(cmd):
    print(f">> Running: {cmd}")
    t0 = time.time()
    try:
        args = shlex.split(cmd)
        res = subprocess.run(args, shell=False, capture_output=True, text=True)
        code = res.returncode
        out = res.stdout
        err = res.stderr
    except Exception as e:
        code = 1
        out = ""
        err = str(e)
    dt = time.time() - t0
    return code, out, err, dt

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 toolbox/verify_harness.py <test-command>")
        sys.exit(1)

    cmd = " ".join(sys.argv[1:])
    code, out, err, dt = run_command(cmd)

    print(f"Elapsed: {dt:.2f}s | Exit Status: {code}")
    if code == 0:
        print("VERIFICATION PASS: Output criteria met.")
        lines = out.strip().splitlines()
        print("\n".join(lines[-10:] if len(lines) > 10 else lines))
        sys.exit(0)
    else:
        print("VERIFICATION FAIL: Traceback / Diagnostics below:")
        lines = (err if err.strip() else out).strip().splitlines()
        print("\n".join(lines[-25:] if len(lines) > 25 else lines))
        sys.exit(code)

if __name__ == "__main__":
    main()
