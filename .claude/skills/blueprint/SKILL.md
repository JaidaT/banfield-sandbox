---
name: blueprint
description: Project planning phase. Reads docs/ for context, asks clarifying questions, writes an ordered and checkable plan to docs/IMPLEMENTATION_PLAN.md, and appends architectural decisions to docs/DECISIONS.md. Use when the user wants to plan a feature before building it. This is the project's own planner, separate from any built-in design skill.
---

# /blueprint — Plan before building

Arguments: the feature to plan. If none is given, ask for it.

1. **Gather context.** Read every file in `docs/`. Read `docs/DECISIONS.md` and `docs/IMPLEMENTATION_PLAN.md` first if they exist. Skim only the code that the feature touches.
2. **Clarify.** If the scope, data shape, user-facing behavior or constraints are unclear, ask up to 4 focused questions (use AskUserQuestion) and wait for the answers. Do not guess on anything that would change the plan.
3. **Write the plan** to `docs/IMPLEMENTATION_PLAN.md`. Create `docs/` if it is missing.
   - Use one `## <Feature> (YYYY-MM-DD)` section per feature. Update an existing section in place. Add a new feature as a new section and leave the others alone.
   - Group the steps into ordered phases, such as `### Phase 1 — Data layer`, `### Phase 2 — API` and `### Phase 3 — UI`, and end with a tests/validation phase.
   - Make each step a checkbox (`- [ ]`): one concrete, verifiable change, naming the files where known.
   - Never uncheck or remove `- [x]` items that are already done.
4. **Record decisions.** For each real architectural decision made this session (a library choice, a data model, a boundary or pattern; not routine details), append to `docs/DECISIONS.md`:

```
## YYYY-MM-DD — <short title>
**Context:** <why a decision was needed>
**Decision:** <what was chosen>
**Alternatives considered:** <options and why they were rejected>
```

   - Append only. Never edit, reorder or delete past entries. If a decision replaces an older one, add a new entry that says "Supersedes <date — title>".
   - If no real decision was made, do not add an entry.
5. **Report** the plan outline (phases and step counts) and any decisions recorded. Do not start implementing.
