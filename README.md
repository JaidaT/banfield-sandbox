# banfield-sandbox

A Next.js web app built with help from Claude Code (an AI coding assistant in VS Code).

This README tells you how to get the project running on your computer and how our team makes changes. If you're new to any of this, follow it step by step in order.

---

## 1. Install these first (one time only)

| Tool | What it's for | How to check it's installed |
|---|---|---|
| [Node.js](https://nodejs.org) **version 22** | Runs the app and its tools | `node --version` shows `v22.x.x` |
| [Git](https://git-scm.com/downloads) | Tracks changes to the code | `git --version` |
| [VS Code](https://code.visualstudio.com) | The code editor | — |
| Claude Code extension for VS Code | The AI assistant | Search "Claude Code" in VS Code's Extensions panel |
| [GitHub CLI](https://cli.github.com) (`gh`) | Lets Claude open pull requests for you | `gh --version` |

After installing the GitHub CLI, log in once:

```
gh auth login
```

Pick **GitHub.com**, then **HTTPS**, then log in with your browser.

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

Then open the project in VS Code: **File → Open Folder** → choose the `banfield-sandbox` folder. Open the folder, not single files, so Claude can see the whole project.

### Check that it works

In VS Code's terminal (**Terminal → New Terminal**):

```
npm test
```

You should see `Tests  1 passed`. Then:

```
npm run dev
```

Open http://localhost:3000 in your browser. You should see the app. Press `Ctrl + C` in the terminal to stop it.

---

## 3. How we make changes

Every change follows the same steps. The commands that start with `/` are typed into **Claude Code's chat**, not the terminal.

### Step 1: `/sync` (check you're up to date)

Make sure you're on `main` and have the latest code:

```
git switch main
git pull
```

Then type `/sync` in Claude Code. It reports whether your branch is up to date and lists any files you've changed. It never changes anything.

### Step 2: Create your own branch

Never work directly on `main`. Make a branch, which is your own copy to work in. Name it `name/feature-x`, using your first name and a short description of what you're doing:

```
git switch -c name/feature-x
```

For example, `jaida/login-page`. Use lowercase and hyphens, no spaces.

Only push to branches that start with your own name. Other people's branches are theirs. Your work reaches `main` only through a pull request (Steps 5 and 6).

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

### Step 5: `/done` (check and ship)

Type `/done` in Claude Code. It:

- runs lint (code style checks), tests and a build. If anything fails, it stops and tells you.
- commits your work, pushes your branch, and opens a **pull request (PR)** on GitHub.
- waits for the automatic checks (CI) to pass.

### Step 6: Get it reviewed and merged

Ask a teammate to look at your PR on GitHub. Once it's approved and the checks are green, click **Merge pull request** on GitHub.

### Step 7: `/landed` (clean up)

After the merge, type `/landed` in Claude Code. It confirms `main` still passes its checks, deletes your old branch, and switches you back to `main`, ready for the next task.

### Quick reference

```
git switch main                 # go to main
git pull                        # get latest
/sync                           # check status
git switch -c name/feature-x    # new branch
/blueprint                      # plan
(build with Claude, tests first)
/done                           # check + open PR
(merge PR on GitHub)
/landed                         # clean up
```

---

## 4. What's in this project

| Path | What it is |
|---|---|
| `app/` | The app's pages |
| `__tests__/` | Tests. `npm test` runs every file ending in `.test.tsx` or `.test.ts`. |
| `docs/DECISIONS.md` | Log of important decisions and why we made them. Only add to it; never delete entries. |
| `docs/IMPLEMENTATION_PLAN.md` | Checklist for the feature currently being built |
| `docs/DISCOVERY.md`, `docs/USER_RESEARCH.md`, `docs/COMPETITIVE_MATRIX.md` | Research about users and competitors |
| `CLAUDE.md` | Rules Claude reads before doing any work. Keep it short. |
| `.claude/skills/` | Our custom `/sync`, `/blueprint`, `/done` and `/landed` commands |
| `.github/workflows/ci.yml` | The automatic checks that run on GitHub for every push and PR |

---

## 5. Staying safe with Claude

- **Read before you approve.** Claude asks permission before running commands or editing files. Don't click through without reading.
- **Stay on a cautious permission mode.** Use "Ask before edits" or "Edit automatically", not a mode that skips all approvals.
- **Stop and ask** if Claude suggests `sudo`, `rm`, `chmod`, or anything outside this project folder.
- **Never commit secrets.** Passwords, API keys and tokens go in a `.env.local` file, which Git already ignores.
- **Commit often.** Git is your undo button.

---

## 6. Common problems

**`npm install` fails with `ERESOLVE could not resolve`**
Two packages disagree on a version. Don't use `--force` or `--legacy-peer-deps`. Copy the error and ask Claude or the team.

**`npm test` fails**
Read the test name in the error. It tells you which behavior broke. Paste the error into Claude Code and ask what it means.

**Git says "Your branch is behind"**
Run `git pull`.

**Git says "protected branch" or "push declined" when you push**
You're trying to push straight to `main`, which is protected. Make your own branch (Step 2), push that, and open a PR with `/done`.

**`/done` or `/landed` says `gh: command not found` or asks you to log in**
Install the GitHub CLI and run `gh auth login` (see section 1).

**A `/` command doesn't appear in Claude Code**
Make sure VS Code has the whole project folder open (**File → Open Folder**), not a single file.
