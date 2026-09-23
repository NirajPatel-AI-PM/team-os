---
name: release-gate
description: Use before a release. Checks that every change in it traces to a spec, passed review, and has its tests green, and lists what does not.
---

# Release gate

For each change since the last release tag:

1. Find its spec. Missing means the change needs one or leaves the release.
2. Find its review. Missing means run the `team-os:review` skill.
3. Run the test suite. Record the command and the result.
4. List any restricted data the change touches, and link its security review.

Output a table: change, spec, review, tests, security, verdict. The release goes out only when every verdict is "ready". Name any change that is not ready and why.
