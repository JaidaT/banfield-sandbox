# Banfield Design - Full Questionnaire: Branching Logic Discovery

Sources: the Oct 2, Oct 9 and Oct 28 meetings with Jamie and Rachael; the current "Let us get to know you" web page and its 2024 printable PDF; the Quick Quiz `docs/DISCOVERY.md`.

Drafted in a separate chat on 2026-11-02, then checked against the meeting transcripts. Where the draft's own suggestions were presented as client requests, they are now marked as **team suggestions**.

## What this sandbox is for
Prototype **how the full questionnaire branches and how its questions are grouped into steps**.

Each step should be a short, themed screen: not the whole form on one page, and not one question per page.

Not in this sandbox:
- Archetype scoring
- Visual polish (the real design comes from the team's Figma wireframes)
- Storage and email delivery
- PDF export

## Agreed direction (from meetings)
- **Two separate tools.** A Quick Quiz on the website before booking, and a full questionnaire for hired clients that replaces "Let us get to know you" (Oct 9, Rachael: "a full-fledged Meet + Inspire built out separately").
- **When it's sent (confirmed Oct 28).** At onboarding, after the client hires Banfield: Meet + Inspire, proposal, signed, invoice, retainer paid, then a "welcome to the team" email containing the questionnaire link and a document introducing the team.
- **Clients are committed at this point**, so the form can be longer than the Quick Quiz. Frame it as "Let us get to know you", since people are happy to talk about themselves once hired (Rachael, Oct 9).
- **The two forms ask different questions.** Rachael (Oct 9): "I just think they should be different so no one ever has to do it again twice." The full questionnaire does not read Quick Quiz answers; overlap is avoided by choosing different questions for each form.
- **Separate from Quick Quiz results.** The Quick Quiz is lead generation and the full questionnaire is onboarding (Oct 28). Many clients never take the Quick Quiz, so the full questionnaire must work entirely on its own.

---

## P1 - The current form is one long, static page (HIGH)
- The web page tells clients it "might take a glass of wine or two" and to "involve your entire household".
- The 2024 PDF has fixed rows that most clients leave half-empty:
  - 6 household members
  - 3 pets
  - 12 family activities
  - 6 image sets ranked 1-7
- Every client gets every question. A furniture-only client is still asked about contractors, square footage and Green/LEED.
- Answers land in Google Sheets as "a long page of answers" (Oct 2). Staff paste them into Claude by hand (Oct 9).
- **Sandbox must:**
  - Split the form into themed steps.
  - Show only the steps and fields that apply to this client.
  - Replace fixed rows with "add another" repeaters.

## P2 - Questions must feel tailored, not generic (HIGH)
- Jamie, Oct 2: "Do you have kids? No, that question's just not even there. Yes: ages, boys/girls, then activities (sports, music)." The same applies to pets.
- Jamie, Oct 2: questions that aren't relevant feel impersonal. "If someone's doing furniture, they don't care [about] I need a contractor."
- Project type should drive the questions that follow. Types raised:
  - Oct 2: furniture/styling, facelift (paint, flooring), renovation, new build
  - PDF: renovation, addition, new build
- **Sandbox must:**
  - Ask project type early and branch on it.
  - Gate household sections (kids, pets, entertaining, work from home, travel) behind a single yes/no or count.

## P3 - Neither one giant page nor one question per page (HIGH)
- The current form overwhelms. Single-question screens would make a 60+ field form feel endless.
- People often use their phone (Oct 2), even if this form is likely done at home.
- **Step rules (team suggestions, to test):**
  - **One topic per step.** The client should be able to name the step in two or three words ("Your pets", "Everyday life").
  - **3-7 inputs per visible step**, counting a repeater as one input (raised from 6 by the team on 2026-11-06). A step should take about 1-2 minutes.
  - **Small branches reveal inline.** A yes/no that unlocks 1-3 follow-ups opens fields on the *same* step (e.g. "Working with a contractor? Yes: name, company, phone").
  - **Big branches skip whole steps.** A gate that controls 4+ questions shows or skips an entire step (e.g. no pets: skip the Pets step).
  - **Repeaters stay on one step.** Kids, pets and activities use "add another" cards on a single step, never one step per child.
  - **Progress shows steps, not question counts.** Branching changes the total, so show "Step 4 of 11", recalculated after each branch. A progress bar was requested (Oct 9 and Oct 28).
  - **Everything is optional except contact and project type.** Every open question accepts a skip, and "Not sure yet" is an option wherever it makes sense.

## P4 - Capture the details the team actually uses (HIGH)
From Oct 9 and Oct 28:
- **Names, not labels.** Kids' and pets' names and ages ("Louisa's bedroom", not "Bedroom 2"; the dog is Charlie).
- **Hobbies and travel**, which change the design (e.g. "foodies, so the kitchen matters").
- **Drink order.** Rachael uses it for hospitality, so ask "How do you actually take your coffee/tea?" as free text, not a cheeky dropdown (Oct 28).
- **Budget as an anchor**, used to pull clients back when scope grows. Jamie prefers the word "investment" and wants to know the overall investment and whether part of it is set aside for design (Oct 28).
- **How they want to live, not how a house "should" be.** Example: the couple building a 12-seat dining room who don't like hosting (Oct 9). Jamie, Oct 9: "What is your morning like? What's your ideal? I want to make houses that make people thrive."
- **"What does home mean to you?"** (Oct 9 prototype; Jamie liked it).
- **Occupation, optional.** Rachael (Oct 9) said it helps the team adapt (e.g. lawyers expect detail and punctuality), but asking can feel like "do you have money or not". Ask gently and keep it optional.
- **Inspiration photos and floor plans** belong here, not in the Quick Quiz (Oct 28).
- **Sandbox must:** keep each of these, phrased the way the team will use them.

## P5 - Style jargon (MEDIUM)
- The current form asks clients to circle labels like "Tuscan", "Transitional" and "Old World Elegant". Jamie: these mean something different to everyone (Oct 2).
- **Sandbox must:**
  - Use image-based choices without style labels.
  - Keep the mood words and favourite/least favourite colours.
- **Team suggestion, to test:** replace ranking each set 1-7 with "pick your favourite and least favourite" per set, which is quicker on a phone. Banfield did not ask for this; check it with them.

## P6 - Avoid repeating Quick Quiz questions (MEDIUM)
- Rachael (Oct 9): the two forms should ask different things so nobody answers twice.
- Jamie (Oct 9) worried the other way: if important questions are only in the optional Quick Quiz, the team is "at a disadvantage" when a hired client skipped it.
- Current state of the Quick Quiz prototype: it asks working style, coffee (cheeky version), home meaning, project type, timeframe, investment (slider), project stage and type of help. It does **not** ask detail orientation, what they are nervous or excited about, past designer experience or decision makers.
- **Sandbox approach:** no skip logic. The full questionnaire asks the detailed versions (overall investment and the design portion; the literal drink order) and keeps the behavioural questions above. If Banfield later moves any of them into the Quick Quiz, remove them here.

## P7 - The output must save time, not create work (MEDIUM, sandbox-lite)
- Rachael wants it saved to the client's Google Drive folder as a PDF or CSV (Oct 28), with answers divided into categories so the team is "not scrolling" (Oct 28).
- A copy-as-text button for pasting into Claude already exists in the Quick Quiz prototype.
- Rachael wants as much data as possible, including time taken (Oct 9).
- **Sandbox only needs to:**
  - Output the answers grouped by step, with skipped and hidden questions marked differently.
  - ~~Record time spent per step.~~ Removed by the team on 2026-11-06: the long questionnaire records no time (see DECISIONS.md).
- Export formats come later.

---

## Audit of the current form (2024 PDF), mapped to the new structure

| Current section | Keep / change | Goes to step |
|---|---|---|
| Contact (name, addresses, home/cell/work phone, email, contact preference, how found us) | Collapse 3 phones into 1 + optional second. | 1 Contact & site |
| Detail orientation, exciting/nervous/stressful, past designer | Merge "nervous" and "stressful". | 4 About working together |
| Square footage, project type (Reno/Addition/New build), age of home | Project type moves first and drives branching. Hide sq ft for furniture/styling. | 2 The project |
| Budget yes/no + range; contractor yes/no + details | Overall investment and design portion. Contractor as an inline reveal, hidden for furniture/styling. | 3 Investment & team |
| Timeline, critical date, why; years lived / plan to stay | Keep. | 2 The project |
| Decision makers | Keep. | 4 About working together |
| Who lives here (6 fixed rows: name, age, gender identity) | Repeater. Gender identity left out for now; ask Jamie (see open questions). | 5 Household |
| Special considerations; disabled/elderly/young children; daytime sleepers | Keep. Accessibility as checkboxes + note. | 5 Household |
| Pets (3 fixed rows: name, type, sex; furniture; roam) | Gate + repeater. Add durability concerns. Drop sex unless the team uses it. | 7 Pets |
| Entertaining (style, space, casual/formal, dinner/potluck/catered) | Gate on an honest frequency question. | 9 Entertaining |
| 12 activity rows (member, activity, space) | Repeater. | 6 Kids / 8 Everyday life |
| Storage; dining pattern; Meals/Music/Games/TV checklist | Keep. The orphaned checklist needs a clear question. | 8 Everyday life |
| Work from home + requirements | Gate + inline reveal. Drop "fax". | 8 Everyday life |
| Travel (yes, purpose, frequency, collect, favourite places) | Gate + inline reveal. | 10 Travel & taste |
| Your home (first word current/new, current/desired style, love/don't love) | Keep the first-word questions. Drop the style-name questions (P5). Add "What does home mean to you?" and "What is your morning like?". | 11 Your home, in words |
| Design style (circle style labels) | Keep, with a photo for each style (team decision 2026-11-06; was "Remove"). | 12 Style by pictures |
| Favourite piece, public place you love | Keep. | 10 Travel & taste |
| Green/LEED | Keep. Hide for furniture/styling. | 12 Style by pictures |
| Wish list, specific features | Keep. | 13 Wish list |
| Mood words, favourite/least colours, shared household taste | Keep. Show shared taste only if 2+ adults. | 12 Style by pictures |
| 6 image sets, rank 1-7 | Pick favourite/least per set (team suggestion, to test). | 12 Style by pictures |
| *(new)* Drink order | Add. | 10 Travel & taste |
| *(new)* Occupation (optional) | Add. | 1 Contact & site |
| *(new)* Inspiration photos, floor plans | Later (needs file storage). | 13 Wish list |
| *(new)* "Anything we missed?" | Add (Rachael, Oct 28). | 13 Wish list |

Note: the live web page only shows the intro text and 6 style image sets. The form fields didn't render when read, so the PDF is the reference here.

## Draft step map (starting point; question wording is placeholder)

| # | Step | Inputs | Shown when | Inline branches |
|---|---|---|---|---|
| 0 | Welcome | - | Always | - |
| 1 | Contact & site | Name, email, phone, contact preference, occupation (optional), mailing address | Always | "Site same as mailing?" No: site address |
| 2 | The project | Project type, spaces involved, sq ft, age of home, timeline + critical date + why, years lived / planning to stay | Always | Every space offered for every project type (team decision 2026-11-06; was "filtered by project type"). Sq ft and age hidden for furniture/styling. |
| 3 | Investment & team | Overall investment, portion set aside for design, contractor? | Always | Contractor yes: name, company, phone, email. Contractor hidden for furniture/styling. |
| 4 | About working together | Decision makers, detail orientation, excited about, nervous about, past designer + how it went | Always | Past designer yes: how it went |
| 5 | Household | Who lives here (repeater: name, age), any kids living here or staying often?, special considerations (checkboxes + note), daytime sleepers, any pets? | Always | - |
| 6 | Kids | Per child: activities, what their space needs | "Any kids?" is yes (asked on step 5), or any household member is under 18 (team decision 2026-11-07) | - |
| 7 | Pets | Repeater: name, type. Allowed on furniture? Roam everywhere? Durability concerns | "Any pets?" is yes (asked on step 5) | - |
| 8 | Everyday life | Your morning, where meals happen, storage pain points, work from home, family activities (repeater) | Always | Work from home yes: requirements |
| 9 | Entertaining | Style, casual/formal, enough space, what you need | "How often do people come over?" is not "Rarely" | - |
| 10 | Travel & taste | Travel? Drink order, favourite piece, public place you love | Always | Travel yes: purpose, frequency, collect, favourite places |
| 11 | Your home, in words | First word for current home, first word for new home, love, don't love, what home means to you | Always | - |
| 12 | Style by pictures | Image sets (pick favourite/least), mood words, colours, Green/LEED, shared taste | Always | Green/LEED hidden for furniture/styling. Shared taste only if 2+ adults. |
| 13 | Wish list | Wish list, specific features, anything we missed | Always | - |
| 14 | Review & thank you | Summary with edit links per step | Always | - |

Rough length:
- Busy family renovation: about 14 steps.
- Furniture/styling couple with no kids or pets: about 11 steps.

~~Measure real completion times in the sandbox.~~ The sandbox no longer records time (team decision 2026-11-06); to judge length, time test sessions by hand. There is no agreed target yet (see open questions).

Step 12 may be heavy with 6 image sets. If so, split it into "Style by pictures" and "Mood & colour".

## Branching rules: keep them simple (beginner-friendly)
Allow only three kinds of rule, stored as data:

1. **Step `showIf`**: skip a whole step.
2. **Field `showIf`**: reveal a field inline on the same step.
3. ~~**Option filter**: limit an option list by an earlier answer (e.g. spaces by project type).~~ Removed by the team on 2026-11-06: any project type may involve any space (e.g. a facelift in the basement), and nothing else used it. See DECISIONS.md.

Conditions use only these shapes, with no nesting deeper than one `any` or `all`:

```json
{ "field": "project_type", "equals": "new_build" }
{ "field": "project_type", "in": ["renovation", "new_build"] }
{ "field": "household_min_age", "lessThan": 18 }
{ "any": [ { "field": "...", "equals": "..." }, { "field": "...", "equals": "..." } ] }
```

Derived values (e.g. `household_min_age`, `adult_count`) are computed in one small function, not inside the rules.

Edge cases the sandbox must handle:
- **Changing an earlier answer.** If someone goes back and changes "Pets: yes" to "no", hide the Pets step and drop its answers from the output, but don't delete them until submit, in case they switch back.
- **Back button.** Back returns to the previous *visible* step.
- **Recalculation.** Progress recalculates after every answer that a rule depends on.
- **Repeaters.** Empty repeater cards are ignored on submit.
- **Resume later (team suggestion, deferred).** Nobody asked for this in the meetings. It is on the Later list.

## Sandbox success criteria
Walk these test personas through it and check the steps shown and the questions hidden:

1. **Growing family renovation.** Two parents, kids aged 7 and 10, a dog. Entertains often.
2. **Furniture/styling only.** Couple in their 60s, no kids or pets.
3. **New build, solo professional.** Works from home, travels for business, rarely hosts.
4. **Multi-generational.** Grandparent living in, accessibility needs.

Pass criteria:
- No step shows more than 7 inputs (a repeater counts as one).
- No step is skipped that should show, and none shows that should be skipped.
- The output reads cleanly, grouped by step.

## Context & constraints
- **Timeline:** one month to build.
- **Team:** developers are not advanced coders.
  - Keep questions, steps and rules in data files.
  - Use one small `isVisible(rule, answers)` function.
  - No backend, no framework the team hasn't used.
  - Match the Quick Quiz prototype's stack.
- **Ownership:** Banfield gets the code and wants to edit questions later. Data-driven questions make that possible. An admin page (Rachael's preference, Oct 28) is out of scope for this month.
- **Tone:** Jamie's voice. Personable, a bit of dry humour, still professional. The intro can keep the "glass of wine" line, since it's already theirs.
- **Mobile-first**, even though many will do it at home.
- **Privacy:** real clients will enter names, kids' ages and addresses. The sandbox uses made-up personas only. Meeting transcripts contain real client details and must not be committed to the repo.

## Out of scope for this sandbox
- Archetype scoring and the team brief
- Reading or pre-filling Quick Quiz answers
- PDF/CSV export
- Admin editing page
- Save and resume
- Photo and floor-plan uploads
- Storage and sending results anywhere
- JobTread integration
- Mid-project and testimonial surveys
- Design Box

## Open questions to resolve
- **Project types:** furniture/styling, facelift, renovation, new build. Is "addition" its own type or part of renovation?
- **Gender identity per household member:** does the team use it? Jamie mentioned boys/girls for kids (Oct 2); if kept, make it optional and inclusive.
- **Pet sex:** used for anything? If not, drop it.
- **Image sets:** reuse the current 6 sets (7 images each in the PDF), or choose new ones? Do we have rights and originals? Is "favourite and least favourite" acceptable instead of ranking?
- **Length:** what completion time is acceptable for hired clients? There is no number yet.
- **One submission per household?** The form says "involve your entire household". Do partners fill it in together, or separately (e.g. differing tastes, two drink orders)?
- **The four behavioural questions:** keep them here (current plan), or move them to the Quick Quiz? (Also in `docs/DISCOVERY.md`.)
