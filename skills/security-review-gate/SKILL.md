---
name: security-review-gate
description: Use before asking security to approve a new integration, MCP server or data flow. Produces the review artifact security reads before it signs off.
---

# Security review gate

Write `security/YYYY-MM-DD-<name>.md` with:

1. **Data.** Every field the integration reads or writes, with its classification: public, internal or restricted.
2. **Identity.** Which identity it runs as, and the permissions that identity holds. Justify each one. Remove any you cannot justify.
3. **Isolation.** Whose data it can reach. Show a test that proves it cannot reach anyone else's, run under the least-privileged identity. An elevated identity passes such a test for the wrong reason.
4. **Audit.** What it logs, where, and for how long. Logs hold no restricted data.
5. **Findings.** Run `/security-review` on the code and paste the result. Resolve or accept each finding, with a named owner.

Do not mark the gate passed. Security does that.
