# Banfield Design — Questionnaire Prototype: Pain Points & Requirements

## Agreed direction (Oct 9, confirmed by Banfield in writing)
Two separate tools, built from one shared question bank (build the full version first, then condense):
1. **Quick Quiz (public, on website):** ~5 min, filled out *before* booking a discovery call with Jamie. Qualifies the lead and identifies the client type.
2. **Full "Meet & Inspire" (hired clients only):** Replaces the current "Let us get to know you" form.
No client should answer the same question twice across the two.

The team-facing brief must answer two separate questions:
- **Fit:** Is this the right project for Banfield? Scope, location, investment, timeframe, readiness, service requirements.
- **Approach:** How should we work with this client? Decision-making style, trust requirements, comfort with uncertainty, expectations of expertise, likely collaboration challenges.

These are independent axes. Banfield's example: two clients with the same $400K budget. One is decisive and trusting; the other struggles to approve minor decisions. Both fit, but they need very different experiences.
The brief must identify the client type, not just list answers.

---

## P1 — Discovery calls are long because Jamie extracts everything live (HIGH)
- Calls are booked as "45 min" but blocked for an hour, and some run 2 hours.
- Jamie said a 5-minute pre-read could cut the call to about 30 minutes.
- Bookings often arrive incomplete: a first name only, "North Burnaby" instead of an address, no photos.
- Jamie uses the site address before calls to pull listings, Google Maps and city records.
- **Prototype must:**
  - Require name, email, phone and full site address.
  - Let clients optionally upload photos and floor plans.
  - Generate a skimmable pre-call brief for Jamie.

## P2 — The team can't read a client's mindset or trust level before meeting them (HIGH)
- First meetings get spent on "psychology," not design: undoing fixed ideas and building trust.
- Example: a client arrived with "everything picked," and two meetings went to walking her back.
- The core question the team wants answered is: "Will they trust us, and how many steps will it take?"
- **Prototype must:**
  - Ask indirect, abstract questions instead of "are you type A?" Examples raised:
    - "How do you take your coffee?"
    - "What does home mean to you?"
    - Occupation, asked optionally and never framed as a wealth check.
    - Inspiration: the DOPE personality test.
  - Track behavioural signals too: time to complete, skipped questions, one-word vs detailed open answers.
- Banfield supplied sample behavioural questions (AI-drafted starting points, not final):
  - Natural decision-making approach
  - Desired involvement in the design process
  - Reaction to a concept that differs from what they pictured
  - What builds confidence during a project (pick up to two)
- These are direct self-report questions. Mix them with the indirect signals above (coffee, "what does home mean to you", completion time, skipped questions). Self-report alone is easy to answer aspirationally.

## P3 — Banfield needs to know the client type before the first call (HIGH)
Banfield-defined archetypes:
1. **Decisive Delegator.** Fast decisions, outcome-focused, busy professional, wants the team to take ownership. Prefers 2 excellent options over 10. Impatient with unnecessary meetings.
2. **Analytical Validator.** Research-driven, wants specs, comparative pricing, energy performance, documented reasoning. Challenges recommendations to understand them, not from distrust.
3. **Cautious Reassurance Seeker.** Risk-sensitive, often making one of the largest purchases of their life. Fears costly mistakes, jargon, surprise costs. Seeks approval from trades, family and friends.
4. **Creative Collaborator.** Engaged, visual, idea-rich, arrives with Pinterest boards. Wants to participate. Higher scope-creep risk.
5. **Hands-On Controller.** Wants visibility into budget, decisions, vendors, timelines. Has often managed major projects professionally.

Mapping to Banfield's existing client segments:
| Segment | Likely archetypes |
|---|---|
| Growing Family Renovation | Decisive Delegator, Cautious Reassurance Seeker |
| Established Homeowner / Forever Home | Decisive Delegator, Creative Collaborator, Analytical Validator |
| Performance-Minded Planner | Analytical Validator, Hands-On Controller |
| Staying Put | Cautious Reassurance Seeker |
| Multi-generational Family | Analytical Validator |

Note: Banfield's Brand Standards (pp. 24-28) list Performance-Minded Planner as one of five segments, but its audit note says to treat it as a trait layered onto Growing Family or Established Homeowner, not a standalone persona. Kept as a segment for now; see open questions. Segment summaries are in BRAND_NOTES.md.

**Prototype must:**
- The archetype blend and per-archetype guidance appear only in the team brief, never in client-facing results.
- Score answers toward archetypes and output a blend, e.g. "60% Analytical Validator / 30% Hands-On Controller". Segments map to several types, so a single label is too blunt.
- Per archetype, include in the brief:
  - Recommended communication style (e.g. 2 options vs detailed comparisons; short bullets vs documented reasoning)
  - Meeting pacing
  - Package to pitch
  - Collaboration risks (e.g. scope creep, approval delays)
- Load archetypes from a data file (`archetypes.json`); never hard-code them.

## P4 — Clients think they know the solution but haven't defined the problem (HIGH)
- Examples:
  - A cancer survivor wanted an all-white kitchen for a "fresh start"; she actually needed warmth.
  - A couple designed a dining room for 12, but they don't like hosting.
  - A client wanted an all-white bathroom and loved green and brick-red.
- Style labels like "Scandinavian modern" mean different things to everyone.
- **Prototype must:**
  - Ask how they *want to live*, not what finishes they want.
  - Use image-based choices instead of style jargon.
  - Never tell them their answer is "wrong."

## P5 — The quiz must not replace Jamie or scare people off (HIGH, constraint)
- Clients hire Banfield partly because they talk to Jamie directly. Avoid making it transactional.
- Results must not make the client feel they can DIY it.
- Results must not overwhelm or intimidate the client.
- Every result must end positively ("We'd love to work with you"), followed by a CTA:
  - Book a call with Jamie, showing picked time slots with their info pre-filled.
  - Fallback: a follow-up email 2–3 days later.
- Tone: Jamie's voice. Personable, dry humour, loosens people up ("it's not that deep"), still professional.

## P6 — Banfield needs to qualify fit before investing call time (HIGH)
- Fit criteria from Banfield:
  - Scope
  - Location
  - Investment
  - Timeframe
  - Readiness
  - Service requirements
- Evidence: prospects wanting free help, weekly scam inquiries, uncommitted callers who never book.
- **Prototype must:**
  - Output a fit assessment in the team brief, separate from the archetype.
  - Never show fit or archetype labels to the client.
  - Always end positively with a booking CTA.

## P7 — The current Meet & Inspire (Google Sheets) is long, generic and manual (HIGH, full version)
- One long non-adaptive form that ends in "a long page of answers."
- Clients get questions that aren't relevant to them.
- Staff copy answers into Claude by hand to build profiles.
- **Prototype must:**
  - Branch adaptively:
    - Kids → names, ages, activities
    - Pets → type, durability needs
    - Project type → furniture/styling, facelift, renovation or new build
  - Capture the personal details the team uses for hospitality and personalization:
    - Kids' and pets' names ("Louisa's room," not "Bedroom 2")
    - Hobbies, travel (e.g. foodies → kitchen matters)
    - Drink preferences
    - Budget as an anchor
  - Output a structured, AI-ready summary. Optionally add a to-do or scope draft that can be pasted into JobTread.
- Audit of the current "Let us get to know you" form (web page + 2024 printable PDF):
  - One long static form, framed as "This might take a glass of wine or two!"
  - No branching: fixed rows for up to 6 household members, 3 pets, 12 family activities.
  - Sections:
    - Contact
    - Project and household (sq ft, project type, budget, contractor, timeline, decision makers)
    - Family and pets
    - Entertaining
    - Activities, storage, dining patterns, work-from-home
    - Travel
    - Your home
    - Design style
    - Mood
    - Image ranking (6 sets, rank favourite to least)
  - Asks for gender identity per household member.
  - Mixes open text, circle-all-that-apply and ranking. The web version and PDF differ.
- Several questions are already behavioural and belong in the Quick Quiz instead:
  - Detail orientation (low/medium/high)
  - What they're most nervous or excited about
  - Past designer experience
  - Who the decision makers are
  Moving them avoids asking twice.

## P8 — Drop-off and attention span (MEDIUM)
- Quick quiz: about 5 minutes max, with a progress bar and minimal typing.
- Full version: framed as "Let us get to know you." Clients are already committed, so it can be longer.
- Many visitors arrive on mobile from Instagram or Google while shopping several designers. Build mobile-first.

---

## Context & constraints
- **Ideal client:** busy professional families (e.g. two accountants with three kids) designing for how they live, not for resale.
- **Stack:** G Suite, Claude for summaries and proposals, JobTread as the CRM (no integration; copy-paste is fine).
- **Website:** Squarespace. Embed via iframe (preferred over a subdomain), hosted with help from their Cloudflare contact.
- **Analytics wanted:** aggregate stats across all quiz-takers, e.g. "X% of visitors are type Y." These would complement Squarespace demographics.
- **Ownership:** Banfield gets the full code and wants to be able to edit questions later.
- **Out of scope for now:** client portal app, DesignBox, JobTread integration, mid-project and testimonial surveys.

## Open questions / tensions to resolve
- **Budget in the Quick Quiz:** "Investment" is a fit criterion, but Jamie said budget means little up front and worried the quiz could scare people off. Consider ranges, or a soft framing like "investment comfort".
- **Style labels:** The current form asks clients to circle styles like "Tuscan" and "Transitional". Jamie said these labels mean different things to everyone (P4). Replace them with image-based choices.
- **Missing source (resolved 2026-10-26):** Banfield's segment definitions (Brand Standards, pp. 24-28, dated Aug 16, 2026) have been received. Relevant notes are in BRAND_NOTES.md.
- **Performance-Minded Planner: segment or trait?** The Brand Standards call it one of five segments but its audit note says to treat it as a trait on another segment. Confirm with Banfield before the brief describes it either way.
- **What is "Meet + Inspire"?** This document calls it the full form for hired clients; the Brand Standards call it the complimentary 45-minute consultation (the call the Quick Quiz books). Confirm the name for each before writing CTA copy.
- **Book with Jamie, or with the team?** P5 says clients value talking to Jamie directly; the Brand Standards' "person to platform" shift says "this isn't just Jamie, this is a studio." Confirm how the CTA should name who they will meet.
- **Should the quiz identify life-stage segment too?** It currently scores working-style archetypes only. Segment would need household questions (for example kids, aging parents).
- **Unvalidated archetypes:** The archetype-to-question mapping hasn't been tested with real users. Validate it in USER_RESEARCH.md.