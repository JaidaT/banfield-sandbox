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
- [ ] Run `npm run lint`, `npm test` and `npm run build`, and check both pages at mobile width in `npm run dev` (lint, test and build pass; the mobile-width visual check has not been done)

### Later (not in this plan)
- Quick Quiz UI and the handoff from submission to these outputs
- Persistence and aggregate analytics ("X% of visitors are type Y")
- Real booking integration, photo and floor-plan uploads, and the follow-up email
- Access control for `/team/*`
- Real submissions need random, non-descriptive ids. Demo URLs use sample ids like `mixed-cautious-controller`, which appear in the client result page's address and page data
- Next.js reported a known security vulnerability in version 16.4.0 during `npm run build` and recommends upgrading. Upgrade before anything is deployed
- The full questionnaire must work on its own for people who skipped the short quiz. When short-quiz answers exist (matched by booking email, with no accounts or logins), it skips or pre-fills those questions so nothing is asked twice. Keep the scoring and brief functions working from any subset of answers so a brief can also come from the full questionnaire
- A non-coder way for Banfield to edit archetypes, questions and fit rules (raw JSON on GitHub is too error-prone for them). Options: a Google Sheet as the source (fits their G Suite stack; preferred), an admin page, or plain-language errors plus an editing guide. Keep the existing validation as the safety net whichever method is chosen, and make its errors visible to whoever is editing. Confirm with Banfield how they want to edit before building
