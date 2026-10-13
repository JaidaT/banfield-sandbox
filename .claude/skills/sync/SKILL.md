---
name: sync
description: Preflight check before starting work. Fetches remote state, checks the current branch against its upstream, and lists uncommitted files. Use at the start of a session or before branching, committing, or opening a PR.
---

# /sync — Preflight check

Read-only. Never pull, reset, stash, or commit. Only report.

1. Run `git fetch --prune`. If it fails (offline, auth), say so and go on with local state.
2. Get the branch: `git rev-parse --abbrev-ref HEAD`.
   - If `HEAD` is detached, report it and stop.
3. Get the upstream: `git rev-parse --abbrev-ref @{u}`.
   - If there is none, report "no upstream" and suggest `git push -u origin <branch>`.
4. Get the ahead/behind counts: `git rev-list --left-right --count HEAD...@{u}` (left = ahead, right = behind).
5. Check health:
   - An in-progress merge, rebase or cherry-pick (look for `.git/MERGE_HEAD`, `.git/rebase-merge`, `.git/rebase-apply` or `.git/CHERRY_PICK_HEAD`).
   - Unresolved conflicts (`git diff --name-only --diff-filter=U`).
   - The upstream branch was deleted on the remote (`git status -sb` shows `[gone]`).
6. List dirty files with `git status --porcelain`. Group them into staged, unstaged and untracked.
7. Report in this format, five lines at most:

```
Branch:   <name> → <upstream | none>
Sync:     ↑<ahead> ↓<behind>   (<up to date | behind: pull needed | diverged>)
Health:   <ok | list of problems>
Dirty:    <n> files — <short list, or "clean">
Next:     <one suggested action, or "ready">
```
