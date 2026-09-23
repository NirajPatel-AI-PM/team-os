---
description: Rate the last answer, up or down. Feeds the Team OS satisfaction measure.
argument-hint: up | down
allowed-tools: Bash(node:*)
disable-model-invocation: true
---

Run this command and report its one line of output, with nothing else:

`node "${CLAUDE_PLUGIN_ROOT}/scripts/rate.ts" $ARGUMENTS`
