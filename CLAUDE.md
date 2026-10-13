@AGENTS.md

## Development Process
Enforce TDD workflow. Use /sync (preflight), /blueprint (design plan), and
/done (validate).
Refer to docs/DECISIONS.md and docs/IMPLEMENTATION_PLAN.md for context before work.
Dev server: npm run dev (Next.js) or npx expo start (Expo).
## Security
- Runtime: work only inside this project folder; never use sudo or admin rights.
- Scanning: Use /security-review for OWASP checks.
- Secrets: Never commit .env, keys, or tokens (use .env.local for Next.js,
app.config.ts extras for Expo).
## Code Style
- Types: Required (TypeScript, strict mode).
- Components: Functional components + hooks only.
- Formatting: No special Unicode in code/output.