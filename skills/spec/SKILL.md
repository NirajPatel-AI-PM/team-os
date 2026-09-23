---
name: spec
description: Use before building anything that takes more than an hour. Writes a one-page spec that names the outcome, the user, the smallest version that proves it, and how you will know it worked.
---

# Spec

Write `specs/YYYY-MM-DD-<topic>.md` with these sections, in this order. One page.

1. **Outcome.** The change in user behavior or a metric, in one sentence. Not a feature.
2. **Who.** The user and the job they are doing when they need this.
3. **Evidence.** What makes us think the problem is real. Quote users or cite a number. If there is none, say so, and make the first milestone finding some.
4. **Smallest version.** The least we can ship that tests the outcome. List what is out.
5. **Measure.** The metric, where it comes from, its value today, and the value that counts as success. Decide this before building.
6. **Risks.** Safety, privacy, data handling and security. Name who has to approve.
7. **Decisions.** Each open question, the options, and who decides by when.

Stop and ask the user when section 1 or section 5 is empty. A spec without an outcome or a measure is a task list.
