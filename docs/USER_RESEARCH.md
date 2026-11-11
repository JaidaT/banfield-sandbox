# User Research: Validating the Quick Quiz

**For:** the project team and Banfield Design.
**Status:** plan ready; no sessions run yet. The quiz screen now exists, so sessions use the real quiz at `/quiz`. Last updated 2026-11-10.

## Why we are testing

The Quick Quiz does two jobs for Jamie before a discovery call:

1. **Identify the client type.** For example, "mostly an Analytical Validator, partly a Hands-On Controller."
2. **Label the lead hot, warm or cold.** Is this the right project for Banfield? Since the Oct 28 meeting, this comes from the project type and the investment together, and drops one step if a warning sign shows up (for example "just exploring for now"). Location plays no part.

The questions, and the points each answer gives toward a client type, are our best first draft. Before Banfield relies on the quiz, we need to check four things:

- **Accuracy:** does the quiz name the same client type Jamie would?
- **Lead label:** does hot, warm or cold match Jamie's own judgement of the project?
- **Ease:** can people finish in about 5 minutes on a phone, without confusion?
- **Tone:** does it feel like Jamie (warm, a little funny, not salesy), and does the result make people want to book a call rather than go it alone?

## What this testing can and cannot tell us

We will test with a small number of people. That is enough to catch confusing questions, obvious mismatches and tone problems. It is **not** enough to prove the quiz is accurate or to set exact numbers (for example, how many minutes counts as "fast").

So we treat results as **direction, not proof**. One mismatch is a reason to look closer, not automatically a reason to change the quiz. A pattern across several people is a reason to change it.

Because of this, the quiz currently **does not** use completion time to decide client type. Time taken is shown to Jamie as a note only (for example, "Finished quickly") until we have more evidence that speed actually says something about the person. The quiz measures it itself, from pressing "Let's start" to pressing "See my results", so reading the welcome screen does not count.

## Who is taking part

| Who | What they can tell us | What they cannot tell us |
|---|---|---|
| **Past Banfield client** (1 so far) | Whether the quiz names the client type Jamie already knows them to be. Our strongest accuracy check. | Typical completion time (one person is not a pattern). |
| **Recent renovator who did not use a designer** (1) | How the quiz reads to someone who made every design decision themself and hired only a contractor. Likely a Hands-On Controller. Tests whether the result makes a confident do-it-yourselfer want to talk to Jamie, or feel they do not need a designer. | The full range of client types. |
| **Classmates** (several) | Time to complete, confusing wording, phone usability, where people hesitate or skip. | Real client type, since they are not homeowners planning a project. |
| **Jamie and the team** (answering as past clients) | Whether the questions can tell the five client types apart at all. Fast, and needs no new participants. | Real behaviour; Jamie's memory of a client is not the client. |

## How to run a session

Use the real quiz. On the computer, run `npm run dev`; on a phone on the same Wi-Fi, open the computer's address followed by `/quiz` (for example `http://192.168.1.68:3000/quiz`). Ask participants to answer on their phone if possible, since most real visitors will.

- **The time is recorded for you.** It appears in the team brief's Behaviour section ("Time to complete"). Note your own start and end time too, as a check.
- **Take the phone back as soon as the client result appears.** This prototype shows the team brief, with the client type and the hot/warm/cold label, under a "Team view (demo only)" divider below the client result. Participants must not see it: it would colour everything they say afterwards, and real clients never see it. Read the brief yourself after the session.
- **The contact screen comes last and is optional for now.** Ask participants to skip it or use made-up details (see Privacy and consent). Note whether they filled it in or skipped it: it helps Banfield decide whether contact details should be required before the result.
- **If you see a red "1 Issue" box** while testing with `npm run dev` on a phone, tap the X and carry on. Some phone browsers add a hidden setting to the page, and the development tools report it. Visitors to the live site never see this.

### What to watch on a phone

- **The investment slider:** do people drag it easily, and do they find "Not sure yet"?
- **"What makes you feel confident?":** after two picks the other boxes turn grey. Do people notice, or try to tick a third?
- **The contact screen:** fill in or skip? Did "leave it blank" feel natural?
- **The result screen:** does it make them want to book a call with Jamie?

## The four test methods

### 1. Jamie's guess first (past client)

1. **Before** the past client takes the quiz, Jamie writes down which client type, or mix of types, they think this client is, and how good a fit the project was.
2. The client takes the quiz while thinking out loud (see method 4).
3. Compare the quiz's result with Jamie's written guess.

Writing the guess down first matters. If Jamie sees the quiz result first, it is easy to agree with it after the fact.

### 2. Jamie answers as past clients

1. Jamie and the team pick 5 to 10 past clients they remember well, ideally covering all five client types.
2. For each one, write down the client type you would assign them.
3. Answer the quiz the way that client would have.
4. Check whether the quiz's top client type matches what you wrote down.

If two different client types keep producing the same result, the questions are not separating them and need rewording.

### 3. Classmates with personas

Give each classmate one persona card (below) and ask them to answer **as that person**. Skip the hot/warm/cold comparison for classmates: without a real project, the label only reflects made-up answers. This makes their answers closer to a real homeowner's and tests whether the quiz can pick up each type.

Do not tell them which client type the card represents. Afterwards, check whether the quiz's result matches the card.

**Persona cards:**

- **A.** You and your partner are both accountants with three kids. You are busy, you want this done well, and you would rather a professional just tell you the best option.
- **B.** You read every review before buying anything. Before agreeing to a design, you want to know why it is better, what it costs and how it compares.
- **C.** This renovation is the biggest purchase of your life. You are worried about surprise costs and making a mistake you cannot undo. You will run big decisions past family.
- **D.** You have three Pinterest boards for this project already. You love design and want to be part of the creative process.
- **E.** You have managed large projects at work. You want to see the budget, the schedule and the vendor list, and be involved in every key decision.

(For the team only: A = Decisive Delegator, B = Analytical Validator, C = Cautious Reassurance Seeker, D = Creative Collaborator, E = Hands-On Controller.)

### 4. Think out loud (everyone)

Ask the participant to say what they are thinking as they answer: what they are unsure about, what made them laugh, what felt too personal. The facilitator stays quiet and takes notes, only prompting with "What are you thinking?" if they go silent.

With so few people, these comments are more valuable than the numbers.

## What to record for each session

| Field | Example |
|---|---|
| Participant (no real names; use P1, P2...) | P1 |
| Type | Past client / renovator / classmate / Jamie as past client |
| Persona card or Jamie's written guess | Card B / "Mostly Cautious, some Analytical" |
| Device | Phone / laptop |
| Time to complete | 6 min 10 s |
| Questions skipped | "What does home mean to you?" |
| Contact screen | Filled in / Skipped / Made-up details |
| Quiz result: client type blend | 55% Analytical Validator / 30% Hands-On Controller |
| Quiz result: lead label | Hot / Warm / Cold |
| Match? | Yes / Partly / No |
| Confusing or uncomfortable questions | "Investment question felt pushy" |
| Reaction to the client-facing result | "Made me want to book a call" |
| Other quotes | |

### How to fill in "Match?"

Compare the quiz's result with the persona card or Jamie's written guess. The quiz's result is the **Client type** list in the "Team view (demo only)" section; the top line is its main answer.

| Pick | When | Example (expected: Analytical Validator) |
|---|---|---|
| **Yes** | The expected type is the quiz's **top** type | Analytical 55%, Hands-On 30% |
| **Partly** | The expected type is **second** | Hands-On 50%, Analytical 35% |
| **No** | The expected type is third or lower | Delegator 60%, Creative 22%, Analytical 18% |

- **When it is not a Yes, write down the place and score**, for example "Partly (2nd, 35%)" or "No (3rd, 18%)". "No (3rd, 18%)" means the quiz barely saw that type; "No (3rd, 30%)" means it was close. If the same type keeps landing low, a question is probably not picking it up.
- **If the scores are nearly tied**, say so, for example "No (3rd, 32%, nearly tied)". Close scores mean the quiz could not tell those types apart.
- **If the brief shows a "Close call" note** (a bordered box under the headline), write "close call" in the Match? answer, for example "Partly (2nd, 33%, close call)". The quiz adds the note when types are within 5 points of each other. For the past client, also note whether Jamie found the note useful, and whether he agrees the type was unclear. That tells us whether 5 points is the right setting.
- **Past client:** also compare the hot/warm/cold label with how good a fit Jamie wrote down, and note both, for example "Type: Yes, Label: Partly".
- **Classmates:** compare the client type only (see method 3).
- Copy the same answer into the "Match?" column of the Results log below.

## What counts as a good result

These are starting targets, not pass/fail rules:

- **Accuracy:** the quiz's top client type matches Jamie's guess or the persona card in most sessions, and the right type appears in the top two in nearly all of them.
- **Lead label:** the quiz's hot, warm or cold label matches Jamie's judgement of the past client's project.
- **Ease:** most people finish in about 5 minutes, and no single question confuses more than one person.
- **Tone:** nobody says the quiz felt like a sales form or a test, and the renovator's reaction to the result leans toward "I'd talk to Jamie" rather than "I don't need a designer."

## What happens with the results

After each round, the team reviews the session notes together and decides on changes, for example:

- A question that confuses people gets reworded or removed.
- A question whose answers do not separate client types gets new answer options or different points.
- Points that consistently push results toward the wrong type get adjusted.
- If completion times turn out to line up with client type, we revisit adding points for speed.

All of these are edits to the question and rule files, not to the app's code. Each change is logged in the project's decisions log with the reason for it.

## Privacy and consent

- Ask every participant for permission before the session and explain that answers are used only to improve the quiz.
- Record participants as P1, P2 and so on, never by name. The past client's real details stay with Banfield.
- Do not store photos, addresses or contact details collected during testing in this project. On the quiz's contact screen, participants should skip it or use made-up details, and nobody should paste a participant's brief ("Copy as text") anywhere outside the session notes.

## Results log

| Date | Participant | Method | Match? | Key finding |
|---|---|---|---|---|
| | | | | |
