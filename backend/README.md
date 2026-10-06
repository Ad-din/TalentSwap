# SkillSwap Backend

Node.js / Express / MongoDB API for SkillSwap, a peer-to-peer skill exchange platform.

## Architecture

```
src/
  config/       env-driven config: db connection, Firebase Admin init, tunable business rules (appConfig.js)
  models/       Mongoose schemas
  controllers/  request handlers (thin - delegate business logic to services/)
  services/     business logic: matching engine, cycle detection, credit ledger
  routes/       Express routers, mounted in app.js
  middleware/   auth (Firebase token verification), role checks, error handling
  validators/   request validation (express-validator, added per-route as routes grow)
  utils/        geo distance, timezone-aware availability overlap
  seed/         skill taxonomy seed data + runner
```

Identity is handled by **Firebase Authentication** (email/password + Google); MongoDB
never stores passwords. The Express auth middleware verifies the Firebase ID token via
the Admin SDK on every protected request and loads the matching Mongo `User` by
`firebaseUid`.

## Setup

```bash
npm install
cp .env.example .env   # fill in MongoDB URI, Firebase service account, OpenAI key
npm run seed            # populates the skill taxonomy
npm run dev              # starts on http://localhost:5000
```

### Firebase Admin credentials

Generate a service account key from Firebase Console -> Project Settings ->
Service Accounts, then set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
`FIREBASE_PRIVATE_KEY` (keep the `\n` escapes in the .env value - they're
converted to real newlines at runtime).

## Environment variables

See `.env.example` for the full list. Notably, matching weights, skill-taxonomy
scores, location distance tiers, and the credit economy rates are all
configurable there rather than hardcoded - see `src/config/appConfig.js`.

## Implemented so far (Priority 1 - Core)

- Firebase-authenticated registration + profile (`/api/auth`, `/api/users`)
- Skill taxonomy CRUD + browsing, admin-gated writes (`/api/skills`)
- Teach/learn skill lists per user, duplicate-prevented (`/api/user-skills`)
- Deterministic, explainable matching engine (`/api/matches`) implementing the
  40/20/15/15/10 weighted score, mutual-exchange prioritization, and a
  graph-based multi-person cycle finder (`/api/matches/cycles`)

## Implemented (Priority 2 - Exchange)

- Swap requests: send/accept/reject/cancel, self-request and duplicate-pending
  guards (`/api/swap-requests`)
- Sessions: scheduling with overlap conflict-prevention, completion (triggers
  credit settlement), cancellation, manual no-show reporting (`/api/sessions`)
- Reviews: only after a completed session, one per (session, reviewer),
  recomputes the reviewee's reputation (`/api/reviews`)
- Real-time chat: `Conversation`/`Message` models, REST history endpoints
  (`/api/messages`), and an authenticated Socket.IO layer in `server.js` -
  every socket verifies its Firebase token and room membership before it can
  join or send, and messages persist through the same code path REST uses
- Notifications: created on swap requests/responses, session events, no-show
  reports, and reviews; listed/marked read via `/api/notifications`

## Implemented (Priority 3 - Economy, REST surface)

Balance and transaction history (`/api/credits`). The ledger logic itself
(`services/creditService.js`) has been in place and unit-tested since
Priority 1.

## Not yet built (Priority 4-5, per development order)

AI coach / roadmaps, skill verification assessments, gamification, and the
admin dashboard. `src/app.js` has a comment marking where each mounts.

## Tests

```bash
npm test
```

Covers: the matching engine's scoring functions (exact/related/category,
mutual-exchange prioritization, availability overlap, location, experience);
the credit ledger (signup bonus, debit/credit atomicity, the insufficient-
balance guard, full session settlement); and session scheduling conflict
detection plus the swap-request self-request authorization guard. The
credit-ledger and session tests use `mongodb-memory-server`, which downloads
a MongoDB binary on first run - that requires outbound internet access once.

## API overview (implemented routes)

| Method | Path                              | Auth        | Description                          |
|--------|-----------------------------------|-------------|---------------------------------------|
| POST   | /api/auth/register                | Firebase    | Create Mongo profile after signup     |
| GET    | /api/auth/me                      | User        | Current user's full profile           |
| GET    | /api/users/:id                    | User        | Any user's profile                    |
| PATCH  | /api/users/me                     | User        | Update display name/bio/experience    |
| PUT    | /api/users/me/availability        | User        | Replace weekly availability slots     |
| PUT    | /api/users/me/location            | User        | Update approximate location           |
| GET    | /api/skills                       | Public      | Browse taxonomy (filter by category)  |
| GET    | /api/skills/categories            | Public      | List distinct categories              |
| POST   | /api/skills                       | Admin       | Create a skill                        |
| PATCH  | /api/skills/:id                   | Admin       | Update a skill                        |
| DELETE | /api/skills/:id                   | Admin       | Soft-delete (deactivate) a skill      |
| GET    | /api/user-skills/me                | User        | List my teach/learn skills            |
| POST   | /api/user-skills/me                | User        | Add a teach/learn skill                |
| DELETE | /api/user-skills/me/:id            | User        | Remove a skill from my list           |
| GET    | /api/matches                      | User        | Ranked, explainable candidate matches |
| GET    | /api/matches/:userId/explanation  | User        | Full breakdown for one candidate      |
| GET    | /api/matches/cycles               | User        | Multi-person exchange cycle suggestions |
| GET    | /api/user-skills/:userId          | User        | Another user's public teach/learn lists |
| POST   | /api/swap-requests                | User        | Send a swap request                   |
| GET    | /api/swap-requests/me             | User        | List requests I sent/received         |
| POST   | /api/swap-requests/:id/respond    | User        | Accept or reject (recipient only)     |
| POST   | /api/swap-requests/:id/cancel     | User        | Cancel a pending request (requester)  |
| POST   | /api/sessions                     | User        | Schedule a session from an accepted swap |
| GET    | /api/sessions/me                  | User        | List my sessions                      |
| POST   | /api/sessions/:id/cancel          | User        | Cancel (participants only)            |
| POST   | /api/sessions/:id/complete        | User        | Mark complete, settles credits        |
| POST   | /api/sessions/:id/no-show         | User        | Report the other participant no-show  |
| POST   | /api/reviews                      | User        | Review a completed session            |
| GET    | /api/reviews/user/:userId         | Public      | A user's received reviews             |
| GET    | /api/messages/conversations       | User        | List my conversations                 |
| GET    | /api/messages/conversations/:id/messages | User  | Message history for a conversation    |
| POST   | /api/messages/conversations/:id/messages | User  | Send a message (REST fallback to socket) |
| GET    | /api/notifications/me             | User        | List my notifications                 |
| POST   | /api/notifications/:id/read       | User        | Mark one notification read            |
| POST   | /api/notifications/read-all       | User        | Mark all notifications read           |
| GET    | /api/credits/me/balance           | User        | Current Skill Credit balance          |
| GET    | /api/credits/me/history            | User        | Transaction history                   |

### Real-time chat (Socket.IO)

Connect with `auth: { token: <Firebase ID token> }`. Events: `join_conversation(conversationId, ack)`, `send_message({ conversationId, text }, ack)`, and incoming `new_message` broadcasts to everyone in the room. Every socket is authenticated the same way as REST requests - a missing/invalid token or non-participant room-join is rejected.
