# Team OS

A Claude Code plugin with the skills, subagents and hooks a product team uses to ship, and the records that show whether they use it.

## Why this exists

Team OS makes Claude Code a co-worker for product managers, designers and engineers. It writes the spec with the PM, the brief with the designer, and the review with the engineer, under the same gates.

I built a system like this at work, and more than 35 people across product, engineering, forward deployed engineering, documentation and support now run it. That system holds company-specific skills and process I cannot share. This repository shows the intent and the design with general skills, so I can share what I learned. It is not the production system.

## Install

Inside Claude Code:

```
/plugin marketplace add NirajPatel-AI-PM/team-os
/plugin install team-os@niraj-patel
```

From a local clone, pass the path to the clone in place of `NirajPatel-AI-PM/team-os`, for example `/plugin marketplace add /path/to/team-os`. Restart Claude Code after installing. The hooks run `node` on TypeScript files, so Node 24 must be on your `PATH`. Without it, both hooks fail: no usage record is written, and the classification gate allows every call.

## What is in it

| Name | Kind | What it does | The problem it answers |
|---|---|---|---|
| `spec` | skill | Writes a one-page spec: outcome, user, evidence, smallest version, measure, risks, decisions. Stops and asks when the outcome or the measure is empty. | Work starts before anyone has said what success looks like. |
| `design-brief` | skill | Turns a spec into a brief a designer can start from: the user, the outcome, design system constraints, every state, the real copy, open questions. | A designer receives a feature request with no outcome and no list of states. |
| `rice` | skill | Scores requests with RICE against the outcome the team owns, and writes the reasoning for each "not now". | A requester hears "no" with no reason they can check. |
| `outcome-roadmap` | skill | Groups features by the outcome they serve, gives each outcome a metric, a target and a date, and starts each monthly review with last month's results. | A roadmap review debates requests instead of results. |
| `review` | skill | Runs the `code-reviewer` subagent, opens the code at every finding, reports only the ones the code confirms, and says how many it dropped. | A wrong finding costs the engineer time to disprove. |
| `release-gate` | skill | For each change since the last release tag, checks for a spec, a review, green tests and a security review, and outputs a verdict table. | A change ships without a spec, a review or a test run. |
| `security-review-gate` | skill | Writes the document security reads before sign-off: data classification, identity and permissions, an isolation test, audit, findings. It never marks the gate passed. | Someone asks security to approve an integration and gives it nothing to read. |
| `architect` | subagent | Reads the code and writes a plan to `plans/`. | A change gets built before anyone decides its shape. |
| `code-reviewer` | subagent | Reports findings with a file, a line and the input that breaks it. Its only tools are Read, Grep and Glob. | A reviewer that can edit files can change the code it is judging. |
| `test-writer` | subagent | Writes and runs tests. When the code is wrong, it writes the failing test and reports it. | A test written to make new code pass can hide the bug it should catch. |
| `/team-os:rate` | command | Records a thumbs up or down: `/team-os:rate up` or `/team-os:rate down`. | The team needs a satisfaction measure that is not a survey. |

Two hooks run in the background. One writes the usage records described below. The other is the classification gate.

The `code-reviewer` subagent is read-only because of its tool list. The limits on `architect` and `test-writer` come from their prompts, not their tools. `architect` has the Write tool, and `test-writer` has Write, Edit and Bash; the prompt, not the tool list, limits test-writer to the test directory. Both rely on the model following those instructions.

## Measuring adoption

The recording hook appends one line to `~/.claude/team-os/records.jsonl` when a session starts or resumes, and when Claude uses one of this plugin's skills or subagents through its tools. `/team-os:rate` appends a rating line. Send it as its own message: inside a longer message, Claude reads it as text and cannot run it. Set `TEAM_OS_RECORDS` to write somewhere else.

A record holds the time, a pseudonymous user id, a pseudonymous session id, the event kind, the skill or subagent name, and the rating. This is the format, with placeholder values:

```
{"ts":"<ISO 8601 time>","user":"<12 hex chars>","session":"<12 hex chars>","event":"skill","name":"spec"}
```

A record never holds prompt text, file paths, tool arguments or output. Skills and subagents from other plugins produce no record. A skill invoked by typing its slash command, such as `/team-os:spec`, never calls the Skill tool, so it is not recorded either; only a skill or subagent Claude invokes through its tools is.

The user id is a random id, 12 hex characters created once per machine and stored in a `user-id` file next to the records file. It does not derive from your git email or OS user name, so one person running this on two machines counts as two users. The session id is a pseudonym: the first 12 hex characters of a SHA-256 hash of Claude Code's session id. A rating records up or down and the time. It does not record which answer it rates.

The plugin never sends records anywhere. Each person's file stays on their machine until they share it.

Three measures come from the records:

- Weekly active users: distinct users with at least one session in a week, with weeks starting Monday, UTC.
- Sessions per user: sessions that week divided by active users that week.
- Thumbs-up rate: up ratings divided by all ratings, always shown with n.

From the author's records, `examples/records.jsonl` [PENDING: needs Plan A Task 7]:

- Weekly active users: [PENDING: needs Plan A Task 7]
- Sessions per user: [PENDING: needs Plan A Task 7]
- Thumbs-up rate: [PENDING: needs Plan A Task 7], n = [PENDING: needs Plan A Task 7]

Screenshot `docs/dashboard.png`: [PENDING: needs Plan A Task 7]

*One user: the author, building this repository. It shows the pipeline, not adoption.*

To measure a team, collect each person's `records.jsonl`, join them into one file, and run both scripts on it from the repository root:

```bash
cat alice.jsonl bob.jsonl > pooled.jsonl
node scripts/adoption.ts pooled.jsonl
node scripts/dashboard.ts pooled.jsonl docs/dashboard.html "our team, October"
```

`adoption` prints users, the weekly table, the most used skills and subagents, and the thumbs-up rate. `dashboard` writes one self-contained HTML file with the same numbers and a chart of active users per week. The third argument is the source label the page shows.

## The classification gate

A `PreToolUse` hook runs before every Bash, WebFetch and WebSearch call and every MCP tool call. It decides whether the call sends data off the machine, classifies the call's arguments, and blocks the call when they hold restricted data. Claude sees a message naming what matched and can remove it or ask the data owner.

The gate treats these as restricted: a US social security number, a medical record number written after the letters MRN, a 13 to 16 digit number that looks like a payment card, and the labels `RESTRICTED` and `CONFIDENTIAL`. It allows internal data, such as an email address or the label `INTERNAL`, on every tool. It does not gate local tools such as Read, Write and Edit.

Its limits:

- Pattern matching misses things and flags things. A social security number without dashes passes. Any run of 13 to 16 digits blocks, because the gate does not run a checksum. A real deployment replaces `classify()` in `src/classify.ts` with a call to the organization's classifier.
- It reads only the text of the tool call. A command that sends a file by reference, such as `curl -d @notes.txt` or `scp`, passes, because the gate never opens the file.
- The Bash outbound check is a keyword list: `curl`, `wget`, `nc`, `scp`, `ssh`, `gh`, `git push`, or an `http://` or `https://` URL. A command that sends data another way, such as a script that opens its own connection, passes unchecked.
- Every MCP tool counts as outbound, including one that runs on your machine.
- If the hook cannot parse its input, it allows the call.

## What this does not show

- How the system at work spread to more than 35 people. That was a people problem, and code does not record it.
- Most of the skills. The system at work holds three dozen. Seven general ones are here, written for this repository.
- Anything measured across more than one user. The records here are the author's.

## Run the tests

```bash
node --test test/*.test.ts
```

Node 24 runs the TypeScript directly. There are no dependencies and no build step.
