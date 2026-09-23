# Scripted sessions on a demo app

Claude ran these sessions as a product manager on a small demo notes app, on 23 Sep 2026. They are scripted, not real use. The records they wrote are `examples/records.jsonl`. The demo app is not in this repository.

## 1. Spec

Session: `b70e5947-9bc3-4f10-b2ba-6b47059e6cd0` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** I'm the PM for Jotter, a small notes app. I want a spec for sharing a note by link. Outcome: more people invited into Jotter by existing users. We see about 40 support tickets a month asking how to send a note to someone who doesn't have an account. Measure: share links opened per week, and sign-ups that came from a shared link. Save it in specs/.

I saved the spec to `specs/2026-09-23-share-note-by-link.md`. One gap remains: I left the success targets for both metrics as TBD. Neither metric is tracked today, so both start at zero, and the spec asks you to set the targets before build starts. What numbers do you want to count as success?

**The biggest risk is the existing share link.** `shareLink()` already exists in `src/notes.js:14`, but its URL is just the note's number, and notes are numbered 1, 2, 3 in order. Anyone could try each number and read every note. Because deleted notes' numbers get reused, an old link could also open a different user's note. The spec requires replacing it with a random token that can be switched off, and security has to approve that.

**What's in the smallest version:**
- A copyable link that anyone can open to read the note, with no login.
- A sign-up link on that page that records which shared link it came from.
- The owner can turn the link off, and deleting the note kills it.

**What's out:** editing, comments, email invites, passwords or expiry on links, and folder sharing.

The spec also names who approves each risk and lists five open decisions, each with an owner and a deadline.

Separately, not part of the spec: `deleteNote` in `src/notes.js` deletes the most recent note when it's given an id that doesn't exist.

## 2. Design brief

Session: `d686a5da-740b-4e18-a7d5-5903d5140d9f` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Can you turn the share-link spec in specs/ into a brief for our designer? We use a simple design system: one accent colour, system fonts, cards for notes. Save it next to the spec.

I've written the designer brief and saved it next to the spec as `specs/2026-09-23-share-note-by-link-design-brief.md`. (The brief template normally saves to `design/`, but you asked for it next to the spec.)

It covers three screens:
- **Share dialog:** where the owner creates and copies the link.
- **Shared-note page:** what the recipient sees, read-only and with no login.
- **"Not available" page:** shown when a link has been turned off or its note deleted.

For your design system:
- **Accent colour:** used only for the main action on each screen ("Copy link" and the sign-up link). "Turn off link" stays out of the accent colour.
- **Fonts:** system fonts only, including on the public pages.
- **Cards:** the recipient sees the owner's note card without its edit or delete controls.

The brief also lists every state for each screen, the accessibility requirements, and the real wording for each screen. Wording that still needs security or legal sign-off is marked ⚠️, mainly the sentence warning that anyone with the link can read the note.

It ends with 8 open questions for the designer. The main ones:
- whether sharing is off until the owner clicks Share
- whether the recipient always sees the latest version of the note
- where the Share button goes
- whether the public page names the owner
- how prominent the sign-up link should be
- what happens after someone reports a note

The spec also asks the PM to review 5–10 support tickets before the build, to check whether people want editing too. That review hasn't happened yet, and its result could change the dialog.

## 3. RICE

Session: `b02ab033-c8f1-4151-9ceb-ee748b5d95ae` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Our outcome this quarter is more people invited into Jotter by existing users. Please score these requests and tell me what to do first: (1) share a note by link, about 40 tickets a month, 2 weeks of work; (2) dark mode, 6 requests, 1 week; (3) export notes to PDF, 15 requests a month, 1 week; (4) invite a friend by email from the app, no requests yet but the growth lead wants it, 3 weeks. Write it up for the team.

Do share-a-note-by-link first. I scored all four against the invite outcome and it wins by a wide margin. The write-up is in `specs/2026-09-23-invite-outcome-rice.md`.

| Item | Score |
|---|---|
| Share note by link | **384** |
| Invite by email | not scored (needs discovery first) |
| Export to PDF | 72 |
| Dark mode | 4.8 |

- **Share link:** 40 users a month are already asking for a way to bring someone in. Every share shows a non-user a note with a sign-up link, and the existing spec adds the tracking to count those sign-ups.
- **Invite by email:** no users have asked for it yet, so I couldn't score it with any confidence. Even with generous guesses it would score 240, still second, and it takes 3 weeks instead of 2. I suggest judging it on share-link results after launch. A smaller "copy invite link" button could reuse the share-link work and take about a week.
- **PDF and dark mode:** neither brings in new people. The doc says what would change that answer and what users can do in the meantime.

**Effort risk:** the current `shareLink()` in `src/notes.js:14` builds the URL from the note's sequential id, so anyone could read every note by changing the number in the link. Replacing it with a random, revocable token needs security sign-off, which could push the work past 2 weeks. Even at a full month it scores 192 and stays first.

To score reach, I multiplied each item's request count by three for the quarter. Dark mode's 6 had no time period, so I counted it as 6. The doc is saved but not committed or shared with anyone yet.

## 4. Code review

Session: `4b548145-8d13-49b9-9da1-660255dd7fa2` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Can you review the last commit before the share-link work goes on top of it? I want to know what's broken.

Nothing is broken in the last commit itself. `b0e2dcb` only changes the test script, and the fix is right: `node --test test/` fails on Node 24 because it treats `test` as a module path, while `node --test test/*.test.js` runs and passes the one test.

The problems are in the commit before it, `ef3ffb0` (delete and share links), which the share-link work would actually build on. Its tests don't touch `deleteNote` or `shareLink`, so a green run doesn't cover any of this:

1. **Deleting a missing note removes the last note** (`src/notes.js:11-12`). `findIndex` returns `-1` for an unknown id, and `splice(-1, 1)` then deletes the last note. For example, `deleteNote(99)` on `[1,2,3]` silently removes note 3. It needs an `if (i === -1) return` (or a throw).
2. **Deleting and then adding creates duplicate ids** (`src/notes.js:4`). Ids come from `notes.length + 1`. If you add notes 1, 2 and 3, delete 1, then add one more, the new note is also id 3. After that, `deleteNote(3)` and `shareLink(3)` point at the wrong note, or at two notes. Use a counter that only goes up instead.
3. **Share links can be guessed** (`src/notes.js:15`). Links are `/n/<sequential id>`, so anyone can try `/n/1`, `/n/2` and so on to reach every note. `shareLink` also returns a link for ids that don't exist or have been deleted. This matters most for the share-link feature: it should use a random token saved on the note, not the id.
4. **Leftover state between tests.** The `notes` array is shared at module level and nothing resets it, so tests added later will see each other's notes.

I'd fix 1–3 before building share links on top. Point 2 on its own makes share links point at the wrong note once anything has been deleted.

## 5. Release gate

Session: `d688caf9-4250-4c94-99ec-c007d23bce57` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Are we ready to cut the next release? Check everything since the last tag.

**No, not ready.** Neither change since `v0.1.0` passes the gate. The share-link code contradicts its own spec, and `deleteNote` deletes the wrong note when it's given an id it can't find.

**Tests:** `npm test` (`node --test test/*.test.js`, Node v24.19.0) passes 1 of 1. That one test only covers `search`. Nothing tests `deleteNote` or `shareLink`.

| Change | Spec | Review | Tests | Security | Verdict |
|---|---|---|---|---|---|
| `ef3ffb0` Delete notes and share links | Share link: `specs/2026-09-23-share-note-by-link.md` exists but is untracked. Its success metrics are "TBD", it still has open decisions, and the code breaks its requirements. Delete: no spec of its own. | Reviewed now: 7 confirmed findings, 3 of them blocking | Pass, but no tests for the new code | Makes note content public. The spec requires security approval, and there's no security review. | **Not ready** |
| `b0e2dcb` Fix the test script | None. It's a one-line chore, so I'd waive the spec. | Reviewed now: no confirmed issues | Pass | None | Ready, if the spec waiver is accepted |

**Confirmed findings, most severe first**
1. **Share links can be guessed** (`src/notes.js:15`). The URL is built from the sequential note id, so trying `/n/1`, `/n/2` and so on reads every note. The spec requires a stored random token of at least 128 bits.
2. **Links can't be turned off, and deleting a note doesn't kill its link.** Nothing is stored, so there's nothing to revoke. Both are required in section 4 of the spec.
3. **`deleteNote` deletes the wrong note on a miss** (`src/notes.js:10-11`). When the id isn't found, `findIndex` returns -1 and `splice(-1, 1)` removes the last note. This happens with `deleteNote(999)`, with a string id like `deleteNote("1")`, and when the same note is deleted twice.
4. **Ids get reused after a delete** (`src/notes.js:4`). Ids are `notes.length + 1`. Add notes 1, 2 and 3, delete note 1, then add a note: you now have two notes with id 3. An old share link can then open a different note.
5. **`shareLink` never checks the note exists.** `shareLink(999)` returns a URL anyway.
6. **No tests** for delete on a missing id, id reuse, or links to missing notes.
7. **Tests share state.** `notes` lives at module level and is never reset, so new tests will interfere with each other.

I dropped 1 of the reviewer's 8 findings. It suspected the test-script glob could break, but that doesn't happen on this Node version and file layout.

**To ship:** release `b0e2dcb` on its own, or hold everything. Before `ef3ffb0` can go out it needs:
- the fixes for findings 1–5, with tests
- a separate spec for delete
- the share-link spec committed, with its TBD metrics filled in
- security sign-off on public share links

The Atlassian, Gmail and Google Calendar connectors aren't authorized, so I couldn't look for review or sign-off records outside this repo. You can connect them in your claude.ai connector settings.

## 6. Security review

Session: `5e7a8a5b-d10f-490e-8e87-a8720a9a9c9d` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Security needs something to read before they sign off on public share links. Can you put that together?

I wrote the review doc at `security/2026-09-23-public-share-links.md`, but security can't sign off on it yet. The share feature in the spec hasn't been built. The code that exists fails the gate: `shareLink()` puts the sequential note id in the URL, so anyone can step through `/n/1`, `/n/2`, … and read every note.

The doc covers the five gate sections:
- **Data:** the fields that exist now and the ones the spec plans, each classified. The share token is marked restricted because anyone holding it can read the note.
- **Identity:** there isn't one today. Notes have no owner and none of the functions check who's calling. The doc lists what the anonymous link holder should be allowed and what to strip.
- **Isolation:** it can't be shown until notes have owners. I included the test that should pass once the feature is built, run as the anonymous link holder. The functions it calls don't exist yet.
- **Audit:** nothing is logged today. I changed one thing from the spec: log a hash of the token, not the raw token, because the raw token would let anyone with log access open every shared note.
- **Findings:** nine items, each with a file, line, how it fails and a fix. Two beyond the spec's list:
  - `deleteNote` with an unknown id deletes the last note (`src/notes.js:10-11`).
  - Note ids get reused after a delete, so an old id can point to someone else's note (`src/notes.js:4`).

Things you should know:
- **`/security-review` didn't run.** It compares against `origin/HEAD`, this repo has no remote, and there are no uncommitted changes to review. The findings come from my own read of `src/notes.js`, and the doc says so. It needs a real run once the feature branch exists.
- **Owners are proposed.** I put you down as the proposed owner for the code fixes and left the trust & safety and security items blank. Please confirm or reassign.
- **Log location and retention** are blank, marked for you to fill in.

The gate isn't marked passed; security does that. The doc ends with a checklist of what's left before it's worth sending them.

## 7. Roadmap

Session: `c7bec395-5f68-4642-a2c7-e85be57ccecd` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** I need a roadmap for next quarter for leadership. Outcomes we care about: more people invited by existing users, and fewer support tickets. Use what's in specs/.

I wrote the Q4 roadmap to `specs/2026-09-23-q4-2026-roadmap.md`. The one bet for "now" is **share a note by link**, and it ranks first for both outcomes: more invites (score 384) and fewer support tickets (also 384, re-scored against tickets).

**Structure:**
- **Invites:** share links first (launch 23 Oct), then invite-by-email (decided at the 18 Dec check once there's share data), then PDF, then dark mode.
- **Support tickets:** share links first, then PDF export (score 180; next, recheck its ticket rate on 20 Nov), then dark mode (19; later).
- **Before build:** PM sets targets by 2 Oct, 5–10 of the tickets get reviewed, and security, privacy and trust & safety sign off. The security review says the current code fails, and the fixes are part of the 2-week estimate.
- **Decisions for leadership:** confirm the single bet, get a support-ticket baseline, and agree to decide on email invites and PDF using the check-in data.

**Gaps you should know about:**
- **No targets.** The specs leave both invite targets and the ticket target TBD by the PM, so they're blank in the roadmap too. I didn't make up numbers.
- **No overall ticket baseline.** The specs only have counts for specific requests (40, 15 and 6). The support outcome can't be measured properly until support reports total monthly volume.
- **No previous review.** This is the first roadmap, so the "last month's review" section says that.
- **I proposed the dates.** 23 Oct launch, then checks on 20 Nov and 18 Dec. If the security fixes double the effort, launch slips to about mid-November and the 8-week check moves into January.
- **The ticket scores are mine.** I re-scored the items against the ticket outcome using the same method as the existing prioritisation doc. That doc only scored them against invites.

## 8. Plan and tests

Session: `ed1c4354-1258-40f3-80cd-4e830876f683` (folder: `/Users/nirajpatel/team-os-sandbox/jotter`)

**Request:** Before we fix the delete and id bugs, get a plan written for how to fix them, and get tests written that show the bugs. Don't fix the code yet.

I wrote the plan and three new tests. All three fail on the current code, and the existing search test still passes. I haven't touched `src/notes.js`.

**The bugs** (findings 3 and 4 in the security doc):
- **Delete:** `deleteNote` with an id that doesn't exist deletes the newest note. When no note matches, `findIndex` returns `-1`, and `splice(-1, 1)` removes the last item in the list.
- **Id:** ids are reused after a delete. `id = notes.length + 1`, so the next note added after a delete can get an id that's already taken.

**Plan** (`specs/2026-09-23-delete-and-id-bugs-plan.md`):
- **Delete fix:** return early when there's no match, returning `true` if a note was deleted and `false` if not. It doesn't throw, so deleting the same note twice is safe.
- **Id fix:** keep a counter (`nextId`) that only goes up. I chose that over a UUID because making ids hard to guess is the job of the share-link token fix, which is separate work.
- The plan also sets the order of work and ends with marking both findings Resolved in the security doc.

**Tests** (added to `test/notes.test.js`):
- `deleting an unknown id leaves other notes alone`
- `deleting an already-deleted id leaves other notes alone`
- `ids are not reused after a delete`

The delete tests pass whether an unknown id throws or returns, so they don't lock in the choice in the plan.

`npm test` will fail until the fixes land.

