---
name: done
description: Validation gate for finishing work. Detects the scope (quick, standard or project) from the branch, diff size and implementation plan, then runs tests and lint, commits, and ships through a direct push or a PR, with CI checks. Use when the user says the work is done or ready to ship.
disable-model-invocation: true
---

# /done — Validation gate

## 1. Detect scope

Collect `git rev-parse --abbrev-ref HEAD` and `git diff --stat HEAD` (include untracked files from `git status --porcelain`). Check whether `docs/IMPLEMENTATION_PLAN.md` has any `- [ ]` items.

- **Project**: the plan exists and has unchecked items. This takes precedence.
- **Quick**: on `main`, with 3 or fewer files and under about 100 changed lines.
- **Standard**: everything else. If the change is large and on `main`, create a feature branch first.

State the detected scope and the signals behind it. The user may override it.

## 2. Validate (every scope, never skipped)

Run the `lint`, `test`, `typecheck` and `build` scripts from `package.json`, whichever exist. If one fails, stop: report the failure, fix it or ask, and do not commit. If there is no `test` script, say so plainly.

## 3. Ship

**Quick:** commit with a clear message → `git push` → `gh run list --branch main --limit 1`, then `gh run watch <id>` → report the CI result.

**Standard:**
1. Add an entry under `## [Unreleased]` in `CHANGELOG.md` (create the file if it is missing, in Keep a Changelog format).
2. Commit → `git push -u origin <branch>` → `gh pr create` with a summary and test notes.
3. `gh pr checks --watch`. If CI fails, report it and stop.
4. Ask the user whether to run `/code-review` on the PR now.

**Project:** do everything in Standard, plus these steps before the commit:
1. In `docs/IMPLEMENTATION_PLAN.md`, check off (`- [x]`) only the items this diff actually completes.
2. Write a handoff note at the top of `docs/HANDOFF.md`: date, what was done, what remains (the unchecked items), and any gotchas. Include the same note in the PR body.

## 4. Report

Give the scope, the validation results, the commit SHA, the PR URL (if any), CI status, and the next step.
