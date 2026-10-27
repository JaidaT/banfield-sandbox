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
**Context:** The prototype needs a skimmable pre-call brief for Jamie, with no CRM integration (copy-paste into Claude or JobTread is acceptable). No storage has been chosen yet.
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
