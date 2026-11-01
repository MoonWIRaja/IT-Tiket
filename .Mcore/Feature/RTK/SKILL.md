---
name: rtk
description: Use compact shell output for supported commands when the RTK CLI is installed and full output remains recoverable.
---

# Compact terminal output

Setup provisions the [RTK](https://github.com/rtk-ai/rtk) executable automatically. The launcher adds its directory to the child process PATH; Login/briefing exposes tool paths. If the host PATH differs, call the absolute path returned by `.Mcore/tools/Setup-Tools.ps1 -CheckOnly`.

For each task, determine whether a shell read would benefit from compact output. Use supported commands such as `rtk git status`, `rtk git diff`, `rtk read <file>` or `rtk grep <pattern> <path>` after inspecting `rtk --help` for the installed version. Preserve exit status and rerun the raw command if truncation hides evidence. Avoid wrapping a command already compressed by another tool.

For research or writing without shell output, use Ponytail and Caveman's economy rules; RTK cannot intercept a host's native web or file tools. The measured quantity is shell output reduction, not total model cost. Do not install host-specific hooks or project provider folders.
