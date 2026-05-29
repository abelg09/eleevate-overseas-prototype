# EleevateOverseas Platform

## Overview

EleevateOverseas is a comprehensive overseas education super-app. Students discover universities and programs worldwide, track their applications in a visual pipeline, and get expert consultant guidance — all in one platform.

pnpm workspace monorepo with TypeScript throughout.

## Architecture

```
artifacts/
  api-server/       — Express 5 API server (port via $PORT env)
  eleevate/         — React + Vite frontend (port via $PORT env)
  mockup-sandbox/   — Component preview server for canvas

lib/
  db/               — Drizzle ORM schema + PostgreSQL client
  api-spec/         — OpenAPI spec (source of truth) + Orval codegen config
  api-client-react/ — Generated TanStack Query hooks (DO NOT EDIT)
  api-zod/          — Generated Zod schemas (DO NOT EDIT)
```

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → `lib/api-spec/openapi.yaml`)
- **Auth**: Clerk (Replit-managed, white-label)
- **Frontend routing**: Wouter
- **UI**: Tailwind v4 + shadcn components
- **State**: TanStack Query v5

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

**IMPORTANT after codegen**: Orval regenerates `lib/api-zod/src/index.ts` with both `./generated/api` and `./generated/types` exports, causing duplicate name conflicts. After running codegen, update `lib/api-zod/src/index.ts` to only contain:
```typescript
export * from "./generated/api";
```

## Database Schema

19 tables in PostgreSQL:
- `users` — core user record linked to Clerk (clerkId, role: student|consultant|partner|admin, onboardingComplete)
- `students` — student profile (targetCountries[], studyLevel, gpa, ielts/toefl/gre/gmat scores, budget)
- `consultants` — consultant profile (agencyName, specializations[], countriesServed[], yearsExperience, bio)
- `universities` — university data (name, country, city, ranking, acceptanceRate, avgTuitionUsd, featured)
- `programs` — programs at universities (name, degree enum, field, tuition, entry requirements)
- `countries` — study destination guides (visa info, cost of living, popular cities)
- `applications` — student → program applications (status pipeline: researching → enrolled)
- `documents` — uploaded documents linked to users/applications
- `shortlists` — student university bookmarks (studentId, universityId)
- `support_tickets` — help desk tickets (userId, subject, body, status: open|in_progress|resolved|closed)
- `loyalty_points` — rewards ledger (userId, event, points, createdAt)
- `test_scores` — student test scores (studentId, testType: IELTS|TOEFL|GRE|GMAT|SAT|Duolingo, score, takenAt)
- `leads` — CRM leads per consultant (studentName, email, phone, status pipeline, consultantId)
- `lead_activities` — activity log per lead (leadId, type, note, consultantId)
- `counselling_sessions` — booked counselling sessions (consultantId, studentName, scheduledAt, status, meetLink)
- `sop_documents` — SOP/LOR/Resume documents (consultantId, studentName, type, content, aiGenerated)
- `team_members` — consultant team members (consultantId, email, role, status)
- `partners` — partner institutions (name, type: university|employer|sponsor, country, contactName, status)
- `branding_settings` — per-consultant SaaS branding (consultantId, companyName, primaryColor, logoUrl, customDomain)

## API Routes

All prefixed with `/api`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /users/me | ✓ | Get/create current user |
| PUT | /users/me | ✓ | Update user profile |
| POST | /users/onboarding | ✓ | Complete onboarding (sets role + creates profile) |
| GET | /students/me | ✓ | Get student profile |
| PUT | /students/me | ✓ | Update student profile |
| GET | /students/me/dashboard-summary | ✓ | Dashboard stats |
| GET | /students/me/shortlist | ✓ | Get shortlisted universities |
| GET | /students/me/shortlist/ids | ✓ | Get shortlisted university IDs |
| POST | /students/me/shortlist/:universityId | ✓ | Toggle university shortlist |
| POST | /students/me/shortlist/ai-recommend | ✓ | AI-powered university recommendations |
| GET | /students/me/test-scores | ✓ | List test scores |
| POST | /students/me/test-scores | ✓ | Add test score |
| DELETE | /students/me/test-scores/:id | ✓ | Delete test score |
| GET | /students/me/loyalty | ✓ | Get loyalty points + ledger |
| POST | /students/me/loyalty | ✓ | Add loyalty event/points |
| GET | /support/tickets | ✓ | List support tickets |
| POST | /support/tickets | ✓ | Create support ticket |
| GET | /support/tickets/:id | ✓ | Get ticket detail |
| PATCH | /support/tickets/:id | ✓ | Update ticket status |
| GET | /consultants | — | List consultants |
| GET | /consultants/me | ✓ | Get consultant profile |
| PUT | /consultants/me | ✓ | Update consultant profile |
| GET | /consultants/me/pipeline-summary | ✓ | Consultant dashboard |
| GET | /universities | — | List universities (search, country, ranking filters) |
| GET | /universities/featured | — | Featured universities |
| GET | /universities/:id | — | University detail |
| GET | /programs | — | List programs (universityId, degree filters) |
| GET | /programs/:id | — | Program detail (includes university) |
| GET | /countries | — | List all countries |
| GET | /countries/:code | — | Country detail |
| GET | /applications | ✓ | List my applications |
| POST | /applications | ✓ | Create application |
| GET | /applications/recent | ✓ | 5 most recent applications |
| GET | /applications/:id | ✓ | Application detail |
| PATCH | /applications/:id | ✓ | Update application status/notes |
| GET | /documents | ✓ | List my documents |
| POST | /documents | ✓ | Upload document record |
| DELETE | /documents/:id | ✓ | Delete document |
| POST | /storage/uploads/request-url | ✓ | Get presigned GCS upload URL |
| GET | /storage/objects/:objectPath | ✓ | Download/serve stored object |

## Frontend Pages

| Route | Page | Auth required |
|-------|------|---------------|
| / | Landing page (redirects signed-in users to dashboard) | No |
| /sign-in/*? | Clerk sign-in | No |
| /sign-up/*? | Clerk sign-up | No |
| /onboarding | Multi-step onboarding wizard (role → profile → preferences) | Yes |
| /dashboard | Student dashboard with stats + recent applications | Yes |
| /universities | University explorer with search, country, bookmark toggle | Yes |
| /universities/:id | University detail + programs list + apply | Yes |
| /applications | Application tracker (grouped by status + deadline countdown) | Yes |
| /countries | Study destinations guide | Yes |
| /profile | Student profile editor (scores, countries, preferences) | Yes |
| /shortlist | AI shortlisting wizard + saved shortlist | Yes |
| /documents | Document Vault — upload, list, version history | Yes |
| /visa-center | Country visa guides + checklists | Yes |
| /language-hub | IELTS/TOEFL/GRE resources + score logging | Yes |
| /rewards | Loyalty points ledger + tier progress + referral | Yes |
| /support | Support ticket form + FAQ accordion | Yes |
| /consultant/dashboard | Consultant pipeline dashboard | Yes |
| /consultant/profile | Consultant profile editor | Yes |
| /consultant/crm | CRM Lead Pipeline — Kanban leads + activity log | Yes (consultant) |
| /consultant/counselling | Counselling session scheduler | Yes (consultant) |
| /consultant/chatbot | AI assistant chatbot | Yes (consultant) |
| /consultant/sop | SOP/LOR/Resume builder + AI generation | Yes (consultant) |
| /consultant/doc-review | Document review — approve/reject student docs | Yes (consultant) |
| /consultant/team | Team member management + roles | Yes (consultant) |
| /consultant/partners | Partner institution management | Yes (consultant) |
| /consultant/branding | SaaS white-label branding settings | Yes (consultant) |

## Object Storage

Documents are stored in Replit Object Storage via GCS presigned URLs:
1. Client calls `POST /api/storage/uploads/request-url` with `{name, size, contentType}`
2. Server returns a `uploadURL` (presigned GCS PUT URL) + `objectPath`
3. Client PUTs the file directly to GCS using the presigned URL
4. Client calls `POST /api/documents` to save the document record in the DB

## AI Features

- `POST /api/students/me/shortlist/ai-recommend` — uses GPT-4.1 via `@workspace/integrations-openai-ai-server` to score and rank all universities against student's profile (studyLevel, budget, GPA, IELTS/TOEFL/GRE, targetCountries). Returns ranked list with matchScore (0-100) + rationale.

## Important Notes

- `lib/api-client-react` hooks are manually written (not Orval-generated for the new routes) — the new hooks live in `lib/api-client-react/src/generated/api.ts` and types in `api.schemas.ts`. Rebuild the package with `cd lib/api-client-react && pnpm exec tsc --project tsconfig.json` after editing.
- Generated hooks return `T` directly (not `{ data: T }`)
- When using `enabled` on a query, always pass `queryKey` too
- Tailwind v4 with `@tailwindcss/vite` — use `tailwindcss({ optimize: false })` (required for Clerk themes)
- CSS layers: `@layer theme, base, clerk, components, utilities;` before `@import "tailwindcss"`
- API server auto-creates user record on first `GET /api/users/me` if not found

## Seed Data

Seeded via `executeSql` (SQL directly):
- 8 countries: GB, US, CA, AU, DE, NL, SG, IE
- 10 universities: Oxford, Cambridge, MIT, Toronto, Melbourne, TU Munich, Delft, NUS, Harvard, UCL
- 10 programs: MSc CS programs, MBAs, and specialist programs across the seeded universities

## Auth Flow

1. Unauthenticated users see landing page at `/`
2. Sign-up redirects to `/onboarding` (3-step wizard: role → name → preferences)
3. Onboarding calls `POST /api/users/onboarding` which creates user + role-specific profile
4. Students go to `/dashboard`, consultants go to `/consultant/dashboard`
5. Protected routes redirect unauthenticated users to `/`
6. Clerk dev keys used in development; live keys used in production automatically

## Clerk Auth Notes

- Server: `@clerk/express` with `clerkMiddleware()` mounted before routes
- Client: `@clerk/react` with `ClerkProvider` + `publishableKeyFromHost` for custom domain support
- Proxy path: `/api/__clerk` (via `clerkProxyMiddleware`)
- Auth pages use branded `appearance` object with shadcn theme, Inter font, electric cobalt primary
- `requireAuth` middleware in `artifacts/api-server/src/middlewares/requireAuth.ts`

## Important Notes

- `lib/api-client-react` and `lib/api-zod` are generated — never edit manually
- Generated hooks return `T` directly (not `{ data: T }`)
- When using `enabled` on a query, always pass `queryKey` too
- Tailwind v4 with `@tailwindcss/vite` — use `tailwindcss({ optimize: false })` (required for Clerk themes)
- CSS layers: `@layer theme, base, clerk, components, utilities;` before `@import "tailwindcss"`
- API server auto-creates user record on first `GET /api/users/me` if not found
