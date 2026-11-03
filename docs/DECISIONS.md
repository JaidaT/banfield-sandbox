# Decisions Log

## 2026-10-26 — Deterministic, data-driven archetype scoring
**Context:** The team brief needs an archetype blend (e.g. "60% Analytical Validator / 30% Hands-On Controller"). Banfield must be able to edit questions and archetypes without changing code, and the scoring must be testable.
**Decision:** Each answer option in `data/questions.json` carries per-archetype weights. Behavioural-signal adjustments live in `data/signals.json`. Pure functions in `lib/quiz/` sum the weights, apply the adjustments and normalize to percentages. Archetypes load from `data/archetypes.json`, and scoring works with any number of archetypes.
**Alternatives considered:** Claude API inference (flexible, but not deterministic, harder to test, costs money per run and needs secrets); hybrid weights plus a Claude-written narrative (deferred, since it can be layered on top later without changing the scoring).

## 2026-10-26 — Fit assessment kept separate from archetype scoring
**Context:** DISCOVERY treats fit (is this the right project?) and approach (how do we work with this client?) as independent axes.
**Decision:** `assessFit` runs from its own rules in `data/fit.json` and returns per-criterion ratings plus red flags. It never reads archetype weights, and the archetype scoring never reads fit answers.
**Alternatives considered:** A single combined score (rejected because it mixes two independent questions and hides why a lead is weak).

## 2026-10-26 — Team brief as an internal page with copy-as-text, no persistence yet
**Context:** The prototype needs a skimmable pre-call brief for Jamie, with no CRM integration (copy-paste into Claude or JobTread is acceptable). No storage has been chosen yet
**Decision:** Server-rendered `/team/brief/[id]` and client-facing `/result/[id]` pages, computed on request from fixture submissions, with a "copy as text" button on the brief. Persistence and aggregate analytics are deferred.
**Alternatives considered:** Text-only output (harder for Jamie to skim); emailing the brief (needs an email provider and secrets); a local JSON file or hosted database (premature before the quiz UI exists).

## 2026-10-26 — Client result is built separately and must never include team data
**Context:** Archetype and fit labels must never reach the client (P3, P6), and results must end positively with a booking CTA (P5).
**Decision:** `buildClientResult` is a separate function from `buildTeamBrief` and returns a type with no archetype or fit fields. A test checks every fixture's client output for any archetype id, label, tagline, segment name or fit rating.
**Alternatives considered:** One result object with team fields hidden in the UI (rejected because one rendering mistake would leak labels to the client).

## 2026-10-26 — Completion-time signals are note-only until validated
**Context:** The draft signal rules gave archetype points for finishing fast or slow. Validation will involve only a handful of people (one past client, one recent renovator who did not use a designer, and classmates who are not homeowners), so there is no data showing that completion speed reflects client type. Speed could just as easily reflect being on a phone or distracted.
**Decision:** `durationSeconds` rules in `data/signals.json` carry no weights. They still add a note to the team brief ("Finished quickly", "Took their time") so Jamie can judge it. A test in `__tests__/quiz/signals.test.ts` enforces this. Open-text length and skip rules are unchanged.
**Alternatives considered:** Keep the guessed weights (rejected because one wrong threshold would skew every client's blend); remove timing entirely (rejected because the note is still useful context for Jamie and the data is needed for later validation).

## 2026-11-02 — Lead temperature (hot, warm, cold) replaces the strong, possible, weak overall fit
**Context:** At the Oct 28 meeting Banfield said location barely matters (they take projects in Ontario, Edmonton and Revelstoke), fit really comes from project type and budget together, and they think of leads as hot, warm or cold. The v1 rule counted every criterion equally and rated location.
**Decision:** `assessFit` returns a lead temperature. Project type + investment set the starting label using per-project-type thresholds in `data/fit.json`. Any warning sign (such as "just exploring" or an existing red flag) lowers it by one step at most. Location is shown as information only. Client type stays independent and is shown below the label; the earlier decision to keep fit separate from archetype scoring still applies. Supersedes the overall-fit rule (2 or more concerns = weak) from the 2026-10-26 plan.
**Alternatives considered:** Only project type + investment decide, with other answers as notes (rejected because a "hot" lead that is just exploring would mislead Jamie); keep counting every criterion equally and only rename the labels (rejected because it ignores Banfield's feedback); let client type adjust the label (rejected for now because Banfield has not said which types are a worse fit).

## 2026-11-02 — Range question kind for the investment slider
**Context:** Banfield asked for an investment slider starting at $0 instead of fixed ranges.
**Decision:** Add a `range` question kind with `min`, `max` and `step` in `data/questions.json`, whose answer is a number, plus an optional escape option ("Not sure yet") stored as an option id. Investment uses $0 to $500K+ in $10K steps. Fit thresholds are amounts, so Banfield can change them without touching the question.
**Alternatives considered:** Keep fixed ranges and draw them as a slider (rejected because the thresholds would be tied to the range boundaries); free-number text input (rejected because typing is slower on mobile and invites typos).

## 2026-11-02 — Location removed from fit entirely
**Context:** Banfield confirmed location should not affect fit, but they still want to know where each project is. The lead temperature entry above kept a service area list for an information-only "Lower Mainland" note. The team of about 5 beginner coders must be able to understand and change the whole build within a month.
**Decision:** No service area list and no in-area check. The site address (street, city, postal code) stays in the brief's contact section, which is how the team sees location. Supersedes the "Location is shown as information only" part of 2026-11-02 — Lead temperature (hot, warm, cold) replaces the strong, possible, weak overall fit.
**Alternatives considered:** Keep the information-only note (rejected because city-name matching is easy to get subtly wrong, e.g. "North Van" vs "North Vancouver", and the 22-city list is one more thing to maintain for little benefit). A "Local" tag can be added later if Banfield asks for one.

## 2026-11-02 - One name per idea in the code
**Context:** After v2 the code mixed "fit" and "lead" for the hot/warm/cold result, called warning signs "red flags", and kept a "criterion" value on fit questions that nothing read any more. The team will rebuild the product from this prototype, so names must match what people see on screen.
**Decision:** Renamed `assessFit` to `assessLead`, `data/fit.json` to `data/lead-rules.json`, `fitRules` to `leadRules`, `brief.fit` to `brief.lead`, `redFlags` to `warningSigns`, and replaced `"criterion": "..."` on questions with `"fitQuestion": true`. Earlier entries in this log keep their original names; this entry maps them to the current ones. Behaviour is unchanged.
**Alternatives considered:** Keep "fit" everywhere (rejected because Banfield and the brief talk about hot, warm and cold leads); leave the names as they were (rejected because two names for one idea confuse beginner coders).

## 2026-11-02 - Long questionnaire is a separate module from the short quiz
**Context:** The long "Let us get to know you" questionnaire collects information for hired clients and has no scoring. DISCOVERY says it must work on its own for people who never took the short quiz, and the team will rebuild both later.
**Decision:** Its code and data live in their own folders (`data/questionnaire/`, `lib/questionnaire/`, `components/questionnaire/`, `app/questionnaire/`). `lib/questionnaire/` does not import from `lib/quiz/`. Only generic screen pieces with no quiz knowledge, such as `CopyBriefButton`, are shared.
**Alternatives considered:** Extend the short quiz's question format and loader (rejected because they are built around archetype weights and lead rules the long form does not use, and mixing them would make both harder to understand).

## 2026-11-02 - Branching with showIf conditions on top-level questions
**Context:** The current form shows everyone every question (fixed rows for 6 people, 3 pets, 12 activities), so people see questions that do not apply to them.
**Decision:** Each question can have a `showIf` list of conditions that must all match an earlier top-level answer (`equals` for one choice, `includes` for a multi choice), the same "all conditions must match" pattern as the short quiz's warning signs. Repeating "add another" groups replace fixed rows. Answers to questions that become hidden are dropped before validation and the summary.
**Alternatives considered:** Separate fixed paths for each kind of household (rejected because the combinations multiply quickly); any/or conditions and branching inside groups (deferred until the real questions show they are needed).

## 2026-11-02 - Long questionnaire screens are plain wireframes with no saving
**Context:** The team will design the real visuals in Figma. Banfield should not mistake the prototype's look for the final design. No storage has been chosen.
**Decision:** The screens use plain wireframe styling (grey, system font, no brand colours) with a visible "Prototype - not the final design" label. Answers are kept only while the page is open. The finished summary is shown on the last screen under a "Team view (demo only)" divider, and sample households have their own team summary pages.
**Alternatives considered:** Branded screens (rejected because they would look final); saving answers in the browser (deferred with save and resume, which needs real storage).

## 2026-11-02 - Long questionnaire uses themed steps with three kinds of rule
**Context:** `docs/QUESTIONNAIRE_DISCOVERY.md` (checked against the Oct 2, 9 and 28 transcripts) sets step rules (one topic, at most 6 inputs, small branches inline, big branches skip steps) and shows branches that the earlier `showIf` design could not express: "any child under 18", "project type is renovation or new build", and lists filtered by project type.
**Decision:** One data file, `data/questionnaire/questionnaire.json`, holds steps and their questions. Three kinds of rule: step `showIf`, field `showIf`, and option filters. Conditions are `equals`, `in`, `includes`, `lessThan` and one level of `any` or `all`. Values such as `household_min_age` and `adult_count` are computed in one small function, not inside rules. Hidden answers stay on screen until submit but are left out of the output. Image sets use "pick a favourite and a least favourite" instead of ranking, as a team suggestion to test with Banfield. Supersedes 2026-11-02 - Branching with showIf conditions on top-level questions.
**Alternatives considered:** Separate files for steps and questions (rejected because cross-references between two files are easier for beginners to break); free-form rule expressions (rejected as too hard to read and validate); keeping the 1-7 ranking (kept as an option if Banfield prefers it).

## 2026-11-02 - Quick Quiz overlap avoided by asking different questions, not by skip logic
**Context:** The questionnaire draft proposed a `skipIfQuickQuiz` flag. In the transcripts, Rachael (Oct 9) said the two forms "should be different so no one ever has to do it again twice", and on Oct 28 asked to keep them separate because many clients never take the Quick Quiz.
**Decision:** The full questionnaire never reads Quick Quiz answers. It asks the detailed versions of shared topics (overall investment and the design portion; the literal drink order) and keeps the behavioural questions the Quick Quiz does not ask. If Banfield moves any question into the Quick Quiz, it is removed from the full questionnaire.
**Alternatives considered:** Hide or pre-fill questions answered in the Quick Quiz (rejected because it needs matching by email, adds a rule type for beginners to maintain, and was not requested by Banfield).
