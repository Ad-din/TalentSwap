# SkillSwap

AI-powered peer-to-peer skill exchange platform — "What I can teach ↔ What I want to learn."

- `backend/` — Node.js/Express/MongoDB API (see backend/README.md)
- `frontend/` — Next.js/Tailwind client (see frontend/README.md)

## Quick start

```bash
# Terminal 1
cd backend && npm install && cp .env.example .env   # fill in MongoDB + Firebase Admin + OpenAI
npm run seed && npm run dev

# Terminal 2
cd frontend && npm install && cp .env.local.example .env.local   # fill in Firebase client config
npm run dev
```

Then visit http://localhost:3000.

## Status

**Priority 1 (Core)** — built end-to-end: Firebase auth, profiles, skill
taxonomy, teach/learn skill lists, weekly availability, approximate
location, and the deterministic, explainable matching engine (with a
graph-based multi-person exchange-cycle finder as an advanced extra).

**Priority 2 (Exchange)** — built end-to-end: swap requests (send/accept/
reject/cancel), real-time chat via authenticated Socket.IO, session
scheduling with overlap conflict-prevention, session completion (triggers
credit settlement), manual no-show reporting, and reviews gated to
completed sessions.

**Priority 3 (Economy)** — the credit ledger has been built and tested
since Priority 1; its REST read surface (balance + history) is now live
too.

**Priority 4-5** (AI coach/roadmaps, skill verification, gamification,
admin dashboard) are not yet built — the frontend has placeholder pages
for all of them so the full navigation from the spec exists; see each
package's README for the detailed breakdown.

## Known environment quirks (see conversation history for full context)

- **Windows + `mongodb+srv://` connection strings:** some Windows setups
  can't resolve the DNS SRV record Atlas connection strings rely on
  (`querySrv ECONNREFUSED`). `backend/src/config/db.js` forces Google's
  public DNS as a workaround - already applied in this codebase.
- **Paths containing `&` or other shell-special characters** break `npm`
  scripts on Windows (`nodemon` resolves to the wrong path). Keep the
  project path plain.
- **`.env` vs `.env.example`:** the app only reads a file literally named
  `.env` / `.env.local` - copy the example file, don't edit it in place.
