# banfield-sandbox

A prototype of the Quick Quiz for Banfield Design Co., built with help from Claude Code (an AI coding assistant in VS Code).

**This repo is a sandbox.** We use it to try out ideas. Branches stay separate and are never merged into `main`. The final product will be rebuilt separately, using this prototype as a reference.

This README tells you how to get the project running on your computer, how our team makes changes, and how the prototype works. If you're new to any of this, follow it step by step in order.

---

## 1. Install these first (one time only)

| Tool | What it's for | How to check it's installed |
|---|---|---|
| [Node.js](https://nodejs.org) **version 22** | Runs the app and its tools | `node --version` shows `v22.x.x` |
| [Git](https://git-scm.com/downloads) | Tracks changes to the code | `git --version` |
| [VS Code](https://code.visualstudio.com) | The code editor | - |
| Claude Code extension for VS Code | The AI assistant | Search "Claude Code" in VS Code's Extensions panel |

> You also need to be added as a collaborator on this repo. Ask the repo owner if you can't push.

---

## 2. Get the project on your computer (one time only)

Open a terminal and run:

```
git clone https://github.com/JaidaT/banfield-sandbox.git
cd banfield-sandbox
npm install
```

- `git clone` downloads the project.
- `npm install` downloads the packages the project needs into a `node_modules/` folder. This can take a minute.

Then open the project in VS Code: **File > Open Folder** > choose the `banfield-sandbox` folder. Open the folder, not single files, so Claude can see the whole project.

### Check that it works

In VS Code's terminal (**Terminal > New Terminal**):

```
npm test
```

You should see a line like `Tests  147 passed` with no failures. The number grows as we add tests. Then:

```
npm run dev
```

Open http://localhost:3000/team in your browser. You should see the sample briefs. Press `Ctrl + C` in the terminal to stop it.

> After you pull changes someone else made, run `npm install` again in case the packages changed.

---

## 3. How we make changes

Every change follows the same steps. The commands that start with `/` are typed into **Claude Code's chat**, not the terminal.

### Step 1: `/sync` (check you're up to date)

Switch to the branch you want to start from and get the latest version of it:

- For a fresh idea, start from `main`.
- To build on someone's earlier work, start from their branch. For example, `jaida/questionnaire-output-v2` was made from `jaida/questionnaire-output`.

```
git switch main
git pull
```

(Replace `main` with the branch you're starting from.)

Then type `/sync` in Claude Code. It reports whether your branch is up to date and lists any files you've changed. It never changes anything.

### Step 2: Create your own branch

Make a branch, which is your own copy to work in. Name it `name/feature-x`, using your first name and a short description of what you're doing:

```
git switch -c name/feature-x
```

For example, `jaida/progress-bar`. Use lowercase and hyphens, no spaces.

Only push to branches that start with your own name. Other people's branches are theirs. **Never push to `main`.** GitHub won't stop you, so check which branch you're on first with `git branch --show-current`.

### Step 3: `/blueprint` (plan before coding)

Type `/blueprint` in Claude Code and describe what you want to build. Claude will ask questions, then write a checklist plan in `docs/IMPLEMENTATION_PLAN.md`. Big decisions get recorded in `docs/DECISIONS.md`.

> In the setup guide, this command is called `/plan`. We renamed it to `/blueprint` because Claude Code already has a built-in `/plan`.

### Step 4: Build it with Claude

Ask Claude to build the next item on the plan. Claude follows **test-driven development (TDD)**:

1. **Red:** Claude writes a test first, in the `__tests__/` folder. It fails, because the feature doesn't exist yet.
2. **Green:** Claude writes the code that makes the test pass.
3. **Refactor:** Claude tidies up the code and runs the tests again.

**Your job:** read the test and check it describes what you actually wanted. If Claude writes code without a test first, ask it to start over from the test.

You can run all tests yourself at any time with `npm test`.

### Step 5: Check your work and back it up

When a piece of work is done, run the three checks in the terminal:

```
npm run lint
npm test
npm run build
```

- `npm run lint` checks code style.
- `npm test` runs every test.
- `npm run build` checks the whole app can be built.

If all three pass, ask Claude to commit your work, then back it up to GitHub:

```
git push
```

The first time you push a new branch, use `git push -u origin name/feature-x` instead. After that, plain `git push` works.

There are no pull requests and nothing is merged into `main`. Your branch on GitHub *is* the finished work.

### Quick reference

```
git switch main                 # go to the branch you're starting from
git pull                        # get latest
/sync                           # check status
git switch -c name/feature-x    # new branch
/blueprint                      # plan
(build with Claude, tests first)
npm run lint                    # check style
npm test                        # run tests
npm run build                   # check it builds
git push                        # back up to GitHub
```

---

## 4. What's in this project

| Path | What it is |
|---|---|
| `data/` | **The quiz's content and rules**: questions, client types, lead rules, wording. Most changes Banfield asks for happen here, not in the code. |
| `lib/quiz/` | **The logic**: turns a set of answers into a team brief and a client result. No screens here. |
| `components/` | **Pieces of screens** used by the pages, such as the brief and the copy button |
| `app/` | The pages, one folder per web address (see section 5) |
| `__tests__/` | Tests. `npm test` runs every file ending in `.test.tsx` or `.test.ts`. |
| `docs/DECISIONS.md` | Log of important decisions and why we made them. Only add to it; never delete entries. |
| `docs/IMPLEMENTATION_PLAN.md` | Checklists for each feature, with what's done |
| `docs/DISCOVERY.md` | What Banfield needs, meeting notes, and open questions |
| `docs/BRAND_NOTES.md` | Banfield's services, voice, colours and fonts |
| `docs/USER_RESEARCH.md`, `docs/COMPETITIVE_MATRIX.md` | Research about users and competitors |
| `CLAUDE.md` | Rules Claude reads before doing any work. Keep it short. |
| `.claude/skills/` | Our custom `/sync` and `/blueprint` commands |
| `.github/workflows/ci.yml` | Automatic checks on GitHub. They only run for `main` and pull requests, so they don't run on our sandbox branches. Run the checks yourself (Step 5). |

---

## 5. How the Quick Quiz prototype works

The quiz screen isn't built yet. Instead, six made-up people's answers (`data/sample-submissions.json`) show what the quiz will produce.

### What happens to a set of answers

```
Answers
  |-- scoreArchetypes  ->  client type blend   (e.g. 64% Cautious / 36% Hands-On)
  |-- assessLead       ->  hot, warm or cold lead, with the reason
  |-- signals          ->  notes like "Finished quickly"
  |
  |-- buildTeamBrief     ->  the team brief (team only)
  `-- buildClientResult  ->  the client's result screen (never shows client types or lead labels)
```

### The pages

| Address | What it shows | Who sees it |
|---|---|---|
| `/team` | List of the sample people | Team only |
| `/team/brief/<id>` | One person's pre-call brief, with a "Copy as text" button | Team only |
| `/result/<id>` | What that person would see after the quiz | Client |
| `/book` | Placeholder for the booking page | Client |

### The data files

| File | What it controls |
|---|---|
| `questions.json` | Every question and answer, and which client types each answer points to |
| `archetypes.json` | The 5 client types and the guidance shown for each |
| `lead-rules.json` | Hot, warm and cold: budget thresholds per project type, and the warning signs |
| `signals.json` | Notes based on how someone took the quiz (time taken, skipped questions) |
| `client-result.json` | The wording on the client's result screen |
| `sample-submissions.json` | The six made-up people |

Each file starts with a `_meta` section explaining its fields in plain English. Read it before editing.

### How to make common changes

- **Change a question's wording:** edit its `prompt` or an answer's `label` in `questions.json`. Don't change any `id`, because other files refer to them.
- **Change a budget threshold:** edit `hotFrom` or `warmFrom` in `lead-rules.json`.
- **Add a warning sign:** add an entry to `warningSigns` in `lead-rules.json`.
- **After any change:** run `npm test`. If you made a mistake in a data file (a typo in an id, a missing threshold), the tests fail with a message saying exactly what and where.

### Rules the code always follows

- Client types and lead labels **never** appear on client screens. Tests check every sample for this.
- Location never affects the lead label.
- A client's type never changes the lead label.

For why things work this way, see `docs/DECISIONS.md`.

---

## 6. Staying safe with Claude

- **Read before you approve.** Claude asks permission before running commands or editing files. Don't click through without reading.
- **Stay on a cautious permission mode.** Use "Ask before edits" or "Edit automatically", not a mode that skips all approvals.
- **Stop and ask** if Claude suggests `sudo`, `rm`, `chmod`, or anything outside this project folder.
- **Never commit secrets.** Passwords, API keys and tokens go in a `.env.local` file, which Git already ignores.
- **Commit often.** Git is your undo button.

---

## 7. Common problems

**`npm install` fails with `ERESOLVE could not resolve`**
Two packages disagree on a version. Don't use `--force` or `--legacy-peer-deps`. Copy the error and ask Claude or the team.

**`npm test` fails**
Read the test name in the error. It tells you which behaviour broke. Paste the error into Claude Code and ask what it means.

**`npm test` or `npm run dev` fails with a message about a data file**
You made a mistake editing a file in `data/`. The message names the file, the entry and the problem, for example `lead rules have no thresholds for project type castle`. Fix that entry, or undo your edit with Git.

**Buttons do nothing when testing on a phone**
Open the site on your phone using your computer's Wi-Fi address (for example `http://192.168.1.66:3000`), and restart `npm run dev` after pulling new changes. Wi-Fi addresses starting with `192.168.` are already allowed in `next.config.ts`.

**Git says "Your branch is behind"**
Run `git pull`.

**I pushed to `main` by accident**
Stop and tell the team before anyone pulls. Don't try to undo it yourself; ask Claude or the repo owner to help.

**A `/` command doesn't appear in Claude Code**
Make sure VS Code has the whole project folder open (**File > Open Folder**), not a single file.
