# SkillSwap Frontend

Next.js (App Router) + Tailwind CSS client for SkillSwap.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in Firebase client config + API URL
npm run dev                          # http://localhost:3000
```

Get the Firebase web config from Firebase Console -> Project Settings ->
General -> Your apps -> SDK setup and configuration.

## Structure

```
app/
  layout.js            root layout - fonts, nav, AuthProvider
  page.js               landing page
  auth/login, auth/signup
  onboarding/            teach/learn skills, weekly availability, location
  dashboard/             post-login summary
  profile/                bio, experience level, skill lists
  matches/                ranked, explainable matches + "Request swap" button
  requests/               incoming/outgoing swap requests, accept/reject/cancel
  messages/               conversation list + live chat (Socket.IO)
  sessions/               schedule/cancel/complete/no-show, prompts a review on completion
  credits/                balance + transaction history
  notifications/          list + mark read
  goals/ achievements/ ai-coach/ roadmaps/ admin/   (placeholders - Priority 4-5)
components/
  NavBar.js, RequireAuth.js, MatchCard.js, ComingSoon.js
  SwapRequestModal.js, ScheduleSessionModal.js, ReviewModal.js
lib/
  firebase.js    Firebase client SDK init
  AuthContext.js React context wrapping Firebase auth state + backend profile
  api.js          centralized fetch wrapper: attaches auth token, parses responses, normalizes errors
  socket.js        authenticated Socket.IO client singleton (used by messages/)
```

## Design system

Two-color system reflecting the app's core "teach ↔ learn" concept:
`teach` (deep teal, `#0F5C56`) for what a user offers, `learn` (warm
tangerine, `#E8703A`) for what a user is seeking. Display type is Fraunces
(serif, warm), UI type is Inter. See `tailwind.config.js` for the full token
set.

## What's implemented vs. placeholder

Matches `backend/README.md`'s priority order:

- **Built (Priority 1 - Core):** landing page, signup/login (Firebase email +
  Google), onboarding (skills, weekly availability, location), dashboard,
  profile, and the matches page with the full explainable-score breakdown
  (the `MatchCard` component - expandable weighted breakdown table, mirrors
  spec section 11).
- **Built (Priority 2 - Exchange):** sending a swap request from a match
  (`SwapRequestModal`), accepting/rejecting/cancelling on the `/requests`
  page, real-time chat once a swap is accepted (`/messages`, backed by the
  authenticated Socket.IO layer), scheduling/cancelling/completing/
  reporting-no-show on sessions (`/sessions`, `ScheduleSessionModal`), and
  leaving a star rating after a completed session (`ReviewModal`).
- **Built (Priority 3 - Economy, read surface):** `/credits` shows live
  balance and transaction history.
- **Placeholder (Priority 4-5):** goals, achievements, ai-coach, roadmaps,
  admin. Each renders a `ComingSoon` card naming which priority tier it
  belongs to, so the full page list from the spec exists and is reachable.

## Note on `next/font/google` in restricted environments

The root layout fetches Fraunces and Inter from Google Fonts at build time.
This requires outbound network access to `fonts.googleapis.com`; if your
build environment blocks that, swap `next/font/google` for local font files
temporarily, or allow that domain.
