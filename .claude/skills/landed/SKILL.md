---
name: landed
description: Post-merge verification. Confirms the merged change passes CI on main, then deletes the merged feature branch locally and on the remote. Use after a PR has been merged.
disable-model-invocation: true
---

# /landed — Post-merge verification

Arguments: an optional branch name or PR number. The default is the current branch.

1. **Identify the PR.** Run `gh pr view <branch|number> --json number,state,mergeCommit,headRefName,baseRefName`.
   - If `state` is not `MERGED`, report that and stop. Delete nothing.
2. **Update main.** Run `git fetch --prune`, then `git switch main && git pull --ff-only`.
3. **Verify CI on main.** Find the run for the merge commit: `gh run list --branch main --commit <mergeCommit sha> --limit 5`.
   - If it is still running, use `gh run watch <id>`.
   - If it failed, report the failing jobs (`gh run view <id> --log-failed`, summarized), keep the branches, and stop.
   - If there is no run, say so and ask the user before continuing.
4. **Delete the branches**, but only after CI is green:
   - Local: `git branch -d <headRefName>`. If git refuses because of a squash or rebase merge, confirm the PR is merged (step 1), then use `-D`.
   - Remote: `git push origin --delete <headRefName>`. If the branch is already gone (auto-deleted), note that and go on.
   - Never delete `main` or the base branch.
5. **Report:**

```
Landed:   PR #<n> — <title>
Main CI:  ✅ <run url>
Cleanup:  local <deleted | n/a>, remote <deleted | already gone>
Now on:   main @ <short sha>
```
