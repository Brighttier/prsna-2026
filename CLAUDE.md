# CLAUDE.md - Presona Recruit (prsna-2026)

## Project Overview

AI-powered recruitment SaaS platform (Presona Recruit) that automates hiring workflows: resume screening via AI Gatekeeper, real-time AI video interviews via Lumina (Gemini Live API), candidate pipeline management, offer management, and onboarding.

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 3.4, React Router v7 (HashRouter)
- **Backend**: Firebase Cloud Functions v2 (Node.js 22), Firestore, Firebase Auth, Firebase Storage, Firebase Hosting
- **AI**: Google Gemini 2.0 Flash (batch + document parsing), Gemini 2.5 Flash Native Audio (real-time interviews), text-embedding-004 (vector embeddings)
- **Email**: Resend (transactional emails)
- **Icons**: Lucide React
- **Charts**: Recharts

## Directory Structure

```
/                       # Frontend root (React app)
├── App.tsx             # Main router (HashRouter) + Layout component
├── index.tsx           # React entry point
├── index.css           # Tailwind directives + global styles
├── types.ts            # All TypeScript interfaces and enums
├── components/         # Reusable UI components (Sidebar, Card, DynamicBranding, LockdownOverlay)
├── pages/              # Route-level page components
├── services/           # Business logic layer
│   ├── store.ts        # Custom reactive store with Firestore sync
│   ├── firebase.ts     # Firebase SDK initialization
│   ├── auth.ts         # Authentication (signup, signin, password reset)
│   ├── ai.ts           # AI service (httpsCallable wrappers)
│   └── geminiService.ts # Gemini audio utilities
├── hooks/              # Custom hooks
│   └── useGeminiLive.ts # Real-time audio/video interview hook
├── functions/          # Firebase Cloud Functions (separate Node.js project)
│   ├── src/index.ts    # All Cloud Function implementations
│   ├── src/utils/      # Utility modules (email templates, vector embeddings)
│   └── lib/            # Compiled JS output (generated)
├── vite.config.ts      # Vite config (port 3000, path alias @/*)
├── tailwind.config.js  # Tailwind with CSS variable-based brand colors
└── firebase.json       # Firebase deployment config
```

## Commands

```bash
# Frontend development
npm run dev             # Start Vite dev server on port 3000
npm run build           # Production build to dist/
npm run preview         # Preview production build

# Cloud Functions
cd functions && npm run build    # Compile TS to lib/
cd functions && npm run serve    # Build + start Firebase emulator

# Deployment
firebase deploy                  # Deploy everything (hosting + functions + rules)
firebase deploy --only functions # Deploy only Cloud Functions
firebase deploy --only hosting   # Deploy only frontend
npm run sync-deploy              # Git commit + push + firebase deploy (auto)
```

## Architecture Notes

### Multi-tenancy
- Each org is keyed as `org_${userId}` in Firestore under `organizations/{orgId}`
- Sub-collections: `jobs`, `candidates`, `assessments`, `invitations`
- White-label support: per-org branding (color, font, corner style) via CSS variables

### State Management
- Custom store in `services/store.ts` with subscription pattern (not Redux/Zustand)
- Firestore `onSnapshot()` listeners for real-time updates
- `store.subscribe()` in components with `isHydrated` flag for loading states

### Routing
- Uses `HashRouter` (hash-based URLs) for Firebase Hosting compatibility
- Full-screen routes (interview, offer, login, landing, onboarding, career) skip sidebar layout
- Protected routes redirect to `/login` when unauthenticated

### AI Integration
- **Document Parsing**: Gemini 2.0 Flash multimodal extracts text from PDF/DOCX/DOC (no third-party parsers)
- **Resume Screening**: Frontend calls `httpsCallable` -> Cloud Function -> Gemini analysis
- **Vector Embeddings**: text-embedding-004 generates candidate/job embeddings; cosine similarity for semantic matching
- **Live Interviews**: Direct Gemini Live API via WebSocket in `useGeminiLive` hook
- **Kill Switches**: `settings.killSwitches.global|resume|interview` can disable AI features per org

### Styling
- Tailwind with dynamic brand colors via CSS variables (`--brand-600`, etc.)
- Custom Tailwind classes: `bg-brand-600`, `text-brand-700`, etc.
- Responsive design with `sm:`, `md:`, `lg:` breakpoints

## Environment Variables

### Frontend (.env, VITE_ prefix)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY` (also available as `GEMINI_API_KEY` via vite.config.ts define)

### Cloud Functions (Firebase Secret Manager)
- `GEMINI_API_KEY` - Google AI API key
- `RESEND_API_KEY` - Resend email service key

## Firestore Collections

```
organizations/{orgId}           # Org settings, branding, kill switches
  /jobs/{jobId}                 # Job postings
  /candidates/{candidateId}     # Candidate profiles, analysis, offers, onboarding
  /assessments/{assessmentId}   # Assessment modules (question banks)
  /invitations/{inviteId}       # Team invitations
users/{userId}                  # User profiles with orgId reference
```

## Key Patterns

- All React components are functional with hooks (no class components)
- TypeScript throughout; shared types in `types.ts`
- PascalCase for components/interfaces, camelCase for functions/variables
- Path alias `@/*` maps to project root
- Cloud Functions use lazy GenAI client initialization (secrets not available at module level)
- Frontend -> backend communication exclusively via `httpsCallable()` (no REST endpoints)
- No test framework configured; testing is manual
- `.env` is gitignored; Firebase config values are not secret (standard Firebase practice)
