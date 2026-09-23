---
name: review
description: Use before merging a change. Runs the read-only code-reviewer subagent, then checks each finding against the code before reporting it.
---

# Review

1. Run the `code-reviewer` subagent on the diff. Ask it for correctness, security, tests and accessibility findings, each with a file and line.
2. For every finding, open the file at that line and confirm the problem is real. Drop it if the code does not show it.
3. Report only confirmed findings, most severe first. For each, say what breaks and for which input.
4. Say how many findings were dropped in step 2. A reviewer that is often wrong is a signal, not noise.
