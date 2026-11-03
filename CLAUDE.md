@AGENTS.md

## Development Process
Enforce TDD workflow. Use /sync (preflight) and /blueprint (design plan).
Validate with npm run lint, npm test and npm run build, then commit and git push.
This repo is a sandbox: branches are never merged into main, so never open pull
requests, merge, or suggest /done or /landed.
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