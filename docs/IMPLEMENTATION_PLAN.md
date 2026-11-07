# Implementation Plan

## Quick Quiz Output: Scoring, Team Brief and Client Result (2026-10-26)

Goal: turn a Quick Quiz submission into (a) a team-facing brief with an archetype blend, a fit assessment and per-archetype guidance, and (b) a warm client-facing result that ends with a booking CTA. Covers DISCOVERY P1, P2, P3, P5 and P6. The quiz UI is out of scope. Fixture submissions stand in for it.

Constraints carried from DISCOVERY.md:
- Archetype and fit labels appear only in the team brief, never in client-facing output (P3, P6).
- Archetypes, question weights and fit rules are loaded from data files and never hard-coded (P3, P7 ownership).
- The client result always ends positively with a "book a call with Jamie" CTA, in Jamie's voice (P5).
- Mobile-first (P8).

Before writing route code, read the relevant guides in `node_modules/next/dist/docs/` (routing, dynamic params, server/client components). Next 16.4 differs from older versions (see AGENTS.md).

### Phase 1: Data layer
- [x] Move `.claude/skills/data/archetypes.json` to `data/archetypes.json` and update references
- [x] Add `lib/quiz/types.ts` input types: `Archetype`, `Question`, `AnswerOption`, `Weights`, `SignalRule`, `FitRules`, `Submission` (contact, site address, answers, `durationSeconds`; skipped questions are the unanswered ones, derived in Phase 2). Output types (`ArchetypeBlend`, `FitAssessment`, `TeamBrief`, `ClientResult`) are added with the Phase 2 functions that produce them
- [x] Add `data/questions.json`: a stub Quick Quiz question bank (about 8 to 10 questions) covering the four Banfield sample behavioural questions, plus indirect questions ("how do you take your coffee", "what does home mean to you") and fit questions (scope, location, investment comfort range, timeframe, readiness, service type). Each option carries archetype weights and/or a fit key. Mark it `_meta.draft: true` for Banfield review
- [x] Add `data/signals.json`: behavioural-signal adjustment rules (for example a fast completion leans toward `decisive_delegator` and long open-text answers lean toward `analytical_validator` and `creative_collaborator`), with thresholds as data
- [x] Add `data/fit.json`: fit criteria (service area, investment ranges, timeframe windows, readiness and service levels) mapped to `strong | possible | weak` per criterion, plus red-flag rules (for example missing site address or "looking for free advice"). Mark it as a draft
- [x] Add `lib/quiz/load.ts`: typed loaders that validate the JSON files at load time and fail loudly on unknown archetype ids in weights
- [x] Add `data/sample-submissions.json` (moved from `__tests__/fixtures/` so the Phase 3 demo pages can load it too) plus `lib/quiz/submission.ts` (`validateSubmission`): 5 sample submissions (one leaning strongly toward each of several archetypes, a mixed blend, a weak-fit one, and one with skipped questions)

### Phase 2: Scoring and assessment (pure functions)
- [x] `lib/quiz/scoreArchetypes.ts` (with `lib/quiz/signals.ts` for the behavioural signals; every unanswered question counts as skipped): sum the option weights per archetype, apply the signal adjustments, normalize to whole-number percentages that add up to 100, and sort descending. Works for any number of archetypes and returns an even or "insufficient data" result when no weights apply
- [x] `lib/quiz/assessFit.ts` (draft overall rule: 2+ concerns = weak, any concern or non-strong = possible): per-criterion rating plus an overall rating and a list of reasons and red flags, kept independent of the archetype score
- [x] `lib/quiz/buildTeamBrief.ts`: compose the contact block (name, email, phone, full site address, uploads placeholder), the blend (top 2 or 3 above a configurable cutoff), guidance per archetype from `archetypes.json` (communication, pacing, pitch, risks, brief tips), a fit summary, behavioural notes (duration, skipped questions, answer length) and the raw answers
- [x] `lib/quiz/briefToText.ts`: render the brief as plain text or markdown for pasting into Claude or JobTread
- [x] `lib/quiz/buildClientResult.ts` (wording in `data/client-result.json` so Banfield can edit tone): a warm, label-free summary drawn from how they want to live (no archetype ids, labels, scores or fit ratings), plus the CTA content (book a call with Jamie, with prefill data and a follow-up email fallback note)

### Phase 3: UI
- [x] `app/team/brief/[id]/page.tsx`: a server component that loads a fixture by id and renders the brief so it's easy to skim: blend bars, fit table, guidance cards, behavioural notes and a collapsible section of raw answers. Mobile-first with Tailwind, and set `robots: noindex` in metadata (view in `components/TeamBriefView.tsx`; noindex set in `app/team/layout.tsx`)
- [x] `components/CopyBriefButton.tsx`: a client component that copies `briefToText` output to the clipboard and shows a confirmation
- [x] `app/result/[id]/page.tsx`: the client-facing result screen in Jamie's voice, ending with "We'd love to work with you" and a booking CTA (placeholder link that carries the prefilled name and email as query params; `app/book/page.tsx` is a placeholder that shows the prefilled details)
- [x] `app/team/page.tsx`: an index listing the fixture submissions with links to each brief and result (dev and demo only)
- [x] Brand colours (Frost White, Charcoal, Navy, Yellow) as theme tokens; Poppins body and Quicksand headings (Glacial Indifference not yet licensed)

### Phase 4: Tests and validation
- [x] Unit tests for the loaders: valid files load, and an unknown archetype id in weights throws
- [x] Unit tests for `scoreArchetypes`: percentages add up to 100, the ordering is correct, signal adjustments apply, adding a sixth archetype to a test dataset still works, and the empty case is handled
- [x] Unit tests for `assessFit`: each criterion rating, red flags, and a fit result that doesn't change when archetype answers change
- [x] Unit tests for `buildTeamBrief` and `briefToText`: required sections are present and contact fields are carried through
- [x] Unit tests for `buildClientResult`: the output never contains any archetype id, label, tagline, segment name or fit rating (checked against every fixture), and it always includes the CTA
- [x] Component tests: the brief page renders the blend and the copy button, and the result page renders the CTA with no team-only content
- [x] Replace the starter `__tests__/page.test.tsx` once `app/page.tsx` changes
- [ ] Run `npm run lint`, `npm test` and `npm run build`, and check both pages at mobile width in `npm run dev` (lint, test and build pass; the mobile-width check was done on the v2 pages instead, see the v2 section below)

### Later (not in this plan)
- Quick Quiz UI and the handoff from submission to these outputs (includes the progress bar Banfield asked for on Oct 28)
- Persistence and aggregate analytics ("X% of visitors are type Y")
- Real booking integration, photo and floor-plan uploads, and the follow-up email
- Access control for `/team/*`
- Real submissions need random, non-descriptive ids. Demo URLs use sample ids like `mixed-cautious-controller`, which appear in the client result page's address and page data
- Next.js reported a known security vulnerability in version 16.4.0 during `npm run build` and recommends upgrading. Upgrade before anything is deployed. Done 2026-11-02 on `jaida/questionnaire-output-v2`: `next` and `eslint-config-next` upgraded to 16.4.4; `npm audit --omit=dev` reports 0 vulnerabilities. The v1 branch is still on 16.4.0. Development-only tools (eslint, test tools) still show 17 audit warnings; they are not part of the live site but should be tidied before launch
- The full questionnaire must work on its own for people who skipped the short quiz. When short-quiz answers exist (matched by booking email, with no accounts or logins), it skips or pre-fills those questions so nothing is asked twice. Keep the scoring and brief functions working from any subset of answers so a brief can also come from the full questionnaire
- A non-coder way for Banfield to edit archetypes, questions and fit rules (raw JSON on GitHub is too error-prone for them). Options: a Google Sheet as the source (fits their G Suite stack; preferred), an admin page, or plain-language errors plus an editing guide. Keep the existing validation as the safety net whichever method is chosen, and make its errors visible to whoever is editing. Confirm with Banfield how they want to edit before building

## Quick Quiz v2: Oct 28 Meeting Changes (2026-11-02)

Goal: apply Banfield's Oct 28 feedback (see "Oct 28 meeting with Banfield" in DISCOVERY.md) to the output pipeline. Fit becomes a hot, warm or cold lead label driven by project type and investment, the investment question becomes a slider, the brief puts fit first, and the questions get the requested rewording. Built on branch `jaida/questionnaire-output-v2`; `jaida/questionnaire-output` stays as the version Banfield saw.

How the lead label works (draft, all numbers in `data/fit.json` for Banfield to review):
1. Project type + investment give the starting label. Each project type has two thresholds: at or above "hot from" is hot, at or above "warm from" is warm, below that is cold.
2. "Not sure yet" on investment, or a skipped project type question, starts at warm. Every project type answer, including "Not sure yet", has its own thresholds, so "not sure what project, $300K" can still be hot.
3. If any warning sign is raised (for example "just exploring", or the existing red flags), the label drops one step: hot to warm, warm to cold. It never drops more than one step.
4. Client type (personality) is shown right below the label and never changes it.
5. Location plays no part in fit. The site address still shows in the brief's contact section so the team knows where the project is. There is no service area list and no in-area check.

Work test-first: for each step, write or update the failing test, then change the code.

### Phase 1: Data and types
- [x] `lib/quiz/types.ts` (added as `LeadRules` and `LeadAssessment` next to the old `FitRules` and `FitAssessment`; the old types and the strong/possible/weak ratings are removed when `assessFit` switches over in Phase 2): add a `range` question kind (`min`, `max`, `step`, plus an optional escape option such as "Not sure yet"); allow a number as an `Answer`; add `LeadTemperature` (`hot | warm | cold`); replace `FitAssessment` with the lead result (`temperature`, `startingTemperature`, `lowered`, plain-language `reasons`, detail rows for project type, investment, timeframe, readiness and type of help, and `redFlags`); update `FitRules` (per-project-type thresholds, starting labels for unsure answers, warning signs) and drop the per-criterion strong/possible/weak ratings
- [x] `lib/quiz/load.ts` (range questions and `ignoreIfSkipped` in `parseQuestionBank`; new `parseLeadRules` next to the old `parseFitRules`, sharing the red flag checks; no service areas): validate range questions (min below max, step above 0, numbers only); validate the new `fit.json` shape (every project type option has thresholds, "hot from" is at or above "warm from", warning signs name real questions and options); keep failing loudly with clear messages
- [x] `lib/quiz/submission.ts`: a range answer must be a number inside min to max on a step, or the escape option id
- [x] `data/questions.json` wording: project stage question "What stage is your project at right now?" with matching answers; the four "type of help" answers now say how long Banfield is involved ("Start to finish", "Design, then hand-off", "One session", "Not sure yet"); new final question `anything_else` with `ignoreIfSkipped: true`. Banfield must confirm "stay involved until the project is complete" describes their full service
- [x] `data/questions.json` slider (done in one go with `fit.json`, the samples and `assessFit`, because they break together; the wording parts of this step are done above) (version 0.2.0, still a draft): turn `investment` into a range question ($0 to $500K+, $10K steps, "Not sure yet" escape), worded with "investment"; reword the `service` answers "Take it from idea to move-in" and "Design plans I can take to my builder" and the `readiness` prompt "Where are you at right now?" (draft wording, flagged for Banfield review); add an optional final text question `anything_else` ("Anything else we missed?") with `ignoreIfSkipped: true` (add the optional `ignoreIfSkipped` flag to `Question` in `types.ts` and validate it in `load.ts`)
- [x] `data/fit.json` (version 0.2.0, still a draft): per-project-type "hot from" and "warm from" amounts, including "Not sure yet"; starting label `warm` for unsure answers; add a "just exploring" warning sign alongside the existing red flags; remove `serviceAreas` and the old `criteria` ratings
- [x] `data/sample-submissions.json`: investment answers become numbers; make sure the samples cover hot, warm, cold, and one that is lowered by a warning sign (the skipper: a $250K renovation lowered by "already under construction"; Sam in Edmonton added as a hot lead outside the Lower Mainland); keep at least one sample outside the Lower Mainland to show location has no effect

### Phase 2: Logic
- [x] `lib/quiz/assessFit.ts`: compute the starting label from project type + investment, lower it one step if any warning sign is raised, and return the reasons in plain language (for example "Renovation at $200K: hot. Lowered to warm: just exploring for now."); never reads the site address or archetype weights
- [x] `lib/quiz/signals.ts` (new `skippedQuestions` helper, also used for the brief's skipped list): questions marked `ignoreIfSkipped: true` in `data/questions.json` (only "Anything else we missed?" for now) are not counted as skipped, so leaving it blank never adds to "Skipped 2 or more questions". "What does home mean to you?" still counts
- [x] `lib/quiz/buildTeamBrief.ts`: `HIGHLIGHT_MAX` from 3 to 2; headline puts the lead first ("Warm lead | 92% Creative Collaborator"); readable answers format money ("$200K", "$500K+")
- [x] `lib/quiz/briefToText.ts`: the lead section comes first, then client type and guidance, then notes and answers
- [x] `lib/quiz/buildClientResult.ts`: format the investment answer if it is shown (all answer text now comes from the shared `lib/quiz/answers.ts`); never show the lead label

### Phase 3: UI
- [x] `components/TeamBriefView.tsx`: the lead label (hot, warm or cold) with its reasons at the top, above the client type blend; project details table; warning signs listed under it; the site address stays in the contact section
- [x] `app/team/page.tsx`: show each sample's lead label in the list (comes from the headline, no code change needed)

### Phase 4: Tests and validation
- [x] Loader tests: valid range questions and the new `fit.json` load; a missing threshold, "hot from" below "warm from", or a warning sign naming an unknown option throws
- [x] `assessFit` tests: each starting label per threshold, unsure answers start warm, one warning sign lowers one step, two warning signs still lower only one step, cold stays cold, changing the site address never changes the label, and changing archetype answers never changes the label
- [x] Signal tests: a blank "Anything else we missed?" is not counted as skipped, and a blank "What does home mean to you?" still is
- [x] Brief tests: at most 2 guidance cards, lead-first headline, money formatting, lead section first in the copied text
- [x] Client result tests: no "hot lead", "warm lead" or "cold lead" text (in addition to the existing archetype and fit leak checks) for every sample
- [x] Component tests: the lead label renders above the blend
- [x] Run `npm run lint`, `npm test` and `npm run build`, and check the brief and result pages at mobile width in `npm run dev` (all pass; mobile width checked by Jaida on 2026-11-02)
- [x] Fix "Copy as text" doing nothing on a phone testing over Wi-Fi (found during the mobile check). Two causes, both safe to keep after launch: `allowedDevOrigins: ["192.168.*.*"]` in `next.config.ts` lets the dev server send the button's code to Wi-Fi devices (dev server only); and `components/CopyBriefButton.tsx` falls back to the older copy command when the clipboard feature is missing or blocked, as it is on plain http

### Later (not in this plan)
- Show the booking calendar on the result page (needs the booking tool and URL confirmed)
- Export briefs as PDF or CSV (low priority)
- Let the team edit the tips shown for weak (cold) leads through the admin page
- A separate "budget set aside for design" question and a "win the lottery" money-values question (ideas only; need wording from Banfield)
- The real coffee order in the full questionnaire
- Flag quizzes finished in under 30 seconds, or add a CAPTCHA, if junk leads appear
- An "after the quiz" booking form so people do not type their details twice, and recording direct bookings as "skipped quiz"

## Cleanup for the Rebuild (2026-11-02)

Goal: make the prototype a clear reference for the team's rebuild. No behaviour changes. Steps above that mention old names (`assessFit`, `data/fit.json`, `redFlags`, `criterion`) refer to what is now `assessLead`, `data/lead-rules.json`, `warningSigns` and `fitQuestion` (see DECISIONS.md).

- [x] One word for the hot/warm/cold result: "lead" (`assessLead`, `leadRules`, `brief.lead`, `data/lead-rules.json`)
- [x] `redFlags` renamed to `warningSigns`, matching the brief
- [x] `"criterion": "..."` on questions replaced with `"fitQuestion": true` (shared `trueOrFalse` check in `load.ts`)
- [x] Sample `weak-fit-explorer` renamed to `cold-explorer`
- [x] Removed `vite-tsconfig-paths`; `vitest.config.mts` uses `resolve.tsconfigPaths`
- [x] README rewritten for a sandbox repo (no pull requests or merging) with a section on how the prototype works; CLAUDE.md no longer points to `/done`
- [x] Update the teammate guide PDF (`docs/How_The_Prototype_Works.pdf`, kept out of Git) to v2 and the new names

### Notes for the rebuild
- `lib/quiz/load.ts` is mostly hand-written checks for the data files. A schema library such as Zod could do the same job in far less code.
- The GitHub checks in `.github/workflows/ci.yml` only run for `main` and pull requests, so they never run on sandbox branches.
- `main` is not protected on GitHub, so nothing stops an accidental push to it.

## Long Questionnaire: Adaptive "Let Us Get to Know You" (2026-11-02)

Goal: a prototype of the full questionnaire hired clients fill in during onboarding. It collects the same information as Banfield's current form, with no scoring, but splits it into short themed steps, only shows the steps and questions that apply, uses "add another" repeaters instead of fixed rows, and ends with the answers grouped by step for the team. Built on branch `jaida/long-questionnaire`. The reference for this section is `docs/QUESTIONNAIRE_DISCOVERY.md` (step map, step rules, branching rules, personas).

Constraints:
- Own folders: `data/questionnaire/`, `lib/questionnaire/`, `components/questionnaire/`, `app/questionnaire/`. Nothing in `lib/questionnaire/` imports from `lib/quiz/`; the form never reads Quick Quiz answers.
- Steps, questions, rules and wording live in one data file, `data/questionnaire/questionnaire.json`, never in code, so the final questions can replace the placeholders by editing data.
- Step rules from QUESTIONNAIRE_DISCOVERY P3: one topic per step, at most 7 inputs per visible step (a repeater counts as one; raised from 6 on 2026-11-06), small branches reveal on the same step, big branches skip whole steps, repeaters stay on one step, only contact and project type are required.
- Branching rules from QUESTIONNAIRE_DISCOVERY: step `showIf`, field `showIf` and option filters, with conditions `equals`, `in`, `includes` (multi choice), `lessThan`, `atLeast` and one level of `any` or `all`. Derived values (`household_min_age`, `adult_count`) come from one small function.
- Placeholder questions follow the step map and audit in QUESTIONNAIRE_DISCOVERY. Gender identity is left out until Jamie confirms it is used.
- Screens are deliberately plain wireframes (grey boxes, system font, no brand colours) with a visible "Prototype - not the final design" label.
- No saving between visits, no photo uploads, no export.

Work test-first: for each step, write the failing test, then change the code. Each step lists its own tests, so a step is only ticked when its tests pass. (Changed 2026-11-06: tests used to be listed separately in Phase 4, which contradicted working test-first.)

### Phase 1: Data and types
- [x] `lib/questionnaire/types.ts`: `Questionnaire` (steps), `Step` (id, title, intro, `showIf`, questions), `Question` kinds `short_text`, `long_text`, `single`, `multi`, `number`, `date`, `repeater` (child questions, `addLabel`, `max`) and `pick_images` (image sets, pick a favourite and a least favourite), `required` (default false), `help`, `showIf`, per-option `showIf` for option filters, and an optional per-option `image` (added 2026-11-06 for the style question); `Condition` (`equals`, `in`, `includes`, `lessThan`, `atLeast`, `any`, `all`); `Answers` (keyed by question id; a repeater's answer is a list of entries)
- [x] `lib/questionnaire/load.ts` (`parseQuestionnaire` and `stepSizeWarnings`): validate `questionnaire.json` with clear errors: duplicate step or question ids, unknown kinds, a condition naming a field that is not an earlier question or a known derived value, a condition naming an answer that does not exist, `any`/`all` nested more than one level, a visible step with more than 7 inputs when every question on it shows (warning list for review, not an error), a repeater inside a repeater
  - Tests (`load.test.ts`): a valid file loads; each mistake above throws a message naming the step or question
- [x] `data/questionnaire/questionnaire.json` (draft, wording reviewed by the team on 2026-11-06) and `loadQuestionnaire()`: 14 steps from the QUESTIONNAIRE_DISCOVERY step map (the review step is built by the screens) with placeholder wording in Jamie's voice and `_meta` notes in plain English. Includes "What is your morning like?", optional occupation, the literal drink order, overall investment and the portion set aside for design, the current form's project types, detail question and 9 style names, and "Anything else we missed?"
  - Tests (`questionnaireFile.test.ts`): the real file loads with the steps in order; only contact and project type are required; project types and style names match the current form; the step and shared-taste rules; plain ASCII text
- [x] `public/questionnaire/`: plain grey placeholder images, labelled with their name, for the 9 styles and the 2 image sets (living rooms and kitchens, A to D)
  - Tests (`questionnaireFile.test.ts`): every picture path in the file exists
- [x] `data/questionnaire/sample-answers.json`: the 4 personas from QUESTIONNAIRE_DISCOVERY (growing family renovation, furniture/styling couple, solo new build, multi-generational), each with a note and an `expectedSteps` list. The solo new build answers "Never" to hosting so one persona tests the Entertaining skip
  - Tests (`sampleAnswers.test.ts`): `parseSampleHouseholds` rejects answers that do not fit their question, unknown questions or steps, and bad picture picks

### Phase 2: Logic (no screens)
- [x] `lib/questionnaire/derived.ts`: `deriveValues(answers)` returns `household_min_age` and `adult_count` (18 and over) from the household repeater (null when no ages are entered)
  - Tests (`derived.test.ts`): youngest age and adult count, 17 vs 18, cards without an age, and the empty case
- [x] `lib/questionnaire/visibility.ts`: `matches(condition, answers, derived)` for every condition shape; `visibleSteps` (each step with its visible questions and the answer choices on offer) and `visibleAnswers` (answers to visible questions only) built on one walk through the questionnaire in order, so a leftover answer to a hidden question never opens its follow-ups
  - Tests (`visibility.test.ts`): each condition shape; no pets skips the Pets step; a child under 18 shows the Kids step; only "Never" skips Entertaining; furniture/styling hides square footage, contractor and Green/LEED; the spaces list is filtered by project type; a leftover hidden answer does not open its follow-ups
  - Persona tests (`visibility.test.ts`, the QUESTIONNAIRE_DISCOVERY pass criteria): each persona sees exactly its `expectedSteps`, has no answers to hidden questions, and no visible step shows more than 7 inputs (Everyday may show 8, see DECISIONS.md)
- [x] `lib/questionnaire/navigation.ts`: next and previous **visible** step (also from a step that has just become hidden), and "Step 4 of 11" progress that recalculates as answers change. Steps with no questions (the welcome) are not counted
  - Tests (`navigation.test.ts`): Back and Next skip hidden steps; nothing before the first or after the last; the total changes when a branch changes
- [x] `lib/questionnaire/validate.ts`: `stepProblems` (for blocking Next) and `allProblems` (before submit) list required visible questions left blank, too many repeater cards (empty cards ignored), and the same image as favourite and least favourite. Hidden questions are never required. Answers that are not a visible option are dropped by `visibleAnswers` instead, and an image outside its set can only come from a data typo, which `parseSampleHouseholds` catches
  - Tests (`validate.test.ts`): only contact and project type are required; a hidden question is never required; the card limit; the same picture twice; the personas have no problems
- [x] `lib/questionnaire/output.ts`: `buildOutput` groups answers by visible step (the welcome is left out), in the words people saw (choice labels, picture names), each question marked `answered`, `skipped` (visible but blank) or `hidden` (by a rule); lists skipped step titles; empty repeater cards removed; hidden answers left out even though the screen keeps them in case the client switches back; seconds spent on each step and in total
  - Tests (`output.test.ts`): hidden answers are left out after switching "yes" to "no", and come back if switched to "yes" again; empty cards are dropped; skipped and hidden are marked differently; seconds per step and in total
- [x] `lib/questionnaire/outputToText.ts`: plain text of the output, grouped by step, for the copy button, in the same format as the short quiz brief. Hidden questions are left out; skipped ones say "(skipped)". Curly quotes, long dashes and "..." typed on phones become plain ASCII; accented letters in names are kept
  - Tests (`outputToText.test.ts`): heading, time and skipped steps; step headings; repeater cards on one line; every persona is plain ASCII; phone punctuation is converted

### Phase 3: Wireframe screens
- [x] `components/questionnaire/QuestionField.tsx`: one question with its label, hint and problem message, for text, long text, number, date, single choice (radio buttons) and multiple choice (tick boxes, with a picture when the choice has one). Repeater cards reuse it for their fields
  - Tests (`__tests__/components/questionField.test.tsx`): each kind reports its answer; only choices on offer show; pictures show; a problem message is announced and marks the input
- [ ] `app/questionnaire/page.tsx` and `components/questionnaire/QuestionnaireForm.tsx` (client component): a welcome screen, one step per screen, Back and Next between visible steps, "Step N of M" with a progress bar, fields appearing and disappearing on the same step as answers change, Next blocked with a plain message only when contact or project type is missing. Records time per step. Plain wireframe styling and the "Prototype - not the final design" label
  - Tests: answering "No" to pets removes the Pets step from the progress count; an inline follow-up appears on the same step; Next is blocked only for contact and project type
- [x] `components/questionnaire/Repeater.tsx`: "Add another" and "Remove" cards on one step, starting with one empty card; the add button turns off at the limit
  - Tests (`__tests__/components/repeater.test.tsx`): "Add another" adds a card; "Remove" removes it and keeps the others; typing stores the card; the limit
- [x] `components/questionnaire/PickImages.tsx`: pick a favourite and a least favourite from each placeholder set, with big "Favourite" and "Least favourite" buttons under each picture that work on a phone. Picking a picture for the other role moves it, and tapping again un-picks
  - Tests (`__tests__/components/pickImages.test.tsx`): favourite and least favourite can be picked; one picture is never both; un-picking
- [ ] Review step: the answers grouped by step with an "Edit" link back to each step, then a thank-you; below a "Team view (demo only)" divider, the output with `components/CopyBriefButton.tsx` for "Copy as text"
  - Tests: "Edit" returns to that step; the team view shows the output text
- [ ] `app/team/questionnaire/[id]/page.tsx`: the team view for each persona, linked from `app/team/page.tsx`
  - Tests: each persona's page shows its name and skipped steps

### Phase 4: Final checks
- [ ] Run `npm run lint`, `npm test` and `npm run build`
- [ ] Click through `/questionnaire` on a computer and on a phone, once as each persona

### Later (not in this plan)
- Save and resume (team suggestion; nobody asked for it, and it needs storage or browser saving)
- Photo and floor-plan uploads (needs file storage)
- PDF or CSV export to Google Drive (Rachael, Oct 28)
- Banfield's real questions, wording and style images (replace the placeholders in `data/questionnaire/`)
- Sending the output to the team instead of showing it on screen
- The open questions in QUESTIONNAIRE_DISCOVERY (gender identity, pet sex, image sets, length, one submission per household, addition as a project type, the four behavioural questions)
