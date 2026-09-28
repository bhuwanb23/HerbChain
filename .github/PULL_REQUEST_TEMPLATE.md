<!-- Thank you for contributing! Please fill in the sections below. -->

## What does this PR do?

<!-- One or two sentences: what changed and why. Link related issues with "Fixes #123". -->

## Which component(s) does this touch?

- [ ] `backend/` (Express + Prisma API)
- [ ] `App/` (React Native mobile app)
- [ ] `website/` (React admin portal)
- [ ] `docs/` / repo tooling

## Checklist

- [ ] Backend changes: `cd backend && npm test` passes locally
- [ ] Website changes: `npm run lint` passes
- [ ] State-changing backend logic runs inside a Prisma transaction and appends a `BatchEvent`
- [ ] No secrets, `.env` files, or SQLite DBs committed
- [ ] Docs updated if behavior/contract changed (`docs/phase_*.md` is the spec of record)

## Screenshots (if UI)

<!-- Drag in before/after screenshots for mobile or website changes. -->
