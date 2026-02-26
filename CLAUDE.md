# CLAUDE.md

## Project Overview

**AncestorTree** — Gia phả điện tử Họ Đặng làng Kỷ Các, Thạch Lâm, Hà Tĩnh.

- **Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase, TanStack Query v5
- **Package Manager:** pnpm (do NOT use npm or yarn)
- **Dev Port:** localhost:4000

## Agent Workflow Rules

### Core Principles
- **Simplicity First** — Make every change as simple as possible; minimize code impact
- **No Laziness** — Find root causes; no temporary fixes; hold to senior developer standards
- **Minimal Impact** — Touch only what's necessary; avoid introducing new bugs

### Workflow Orchestration
- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- If things go sideways, stop and re-plan — don't keep pushing
- Use subagents liberally to keep the main context window clean; one task per subagent
- For non-trivial changes, pause and ask if a more elegant approach exists
- If a fix feels hacky: *"Knowing everything I know now, implement the elegant solution"*
- Skip elegance checks for simple, obvious fixes — don't over-engineer

### Verification Before Done
- Never mark a task complete without proving it works
- Run `pnpm build` to verify compilation, run tests, check logs
- Ask: *"Would a staff engineer approve this?"*
- Diff behavior between main and your changes when relevant

### Autonomous Bug Fixing
- When given a bug report: just fix it — no hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user

### Self-Improvement Loop
- After any user correction: update `tasks/lessons.md` with the pattern
- Write rules to prevent repeating the same mistake
- Review lessons at session start

### Task Management
1. Write plan to `tasks/todo.md` with checkable items before implementation
2. Check in with user before implementation begins
3. Mark items complete as you go
4. Provide high-level summary at each step
5. Add a review section to `tasks/todo.md` when done
6. Capture lessons in `tasks/lessons.md` after corrections

## Quick Reference

```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Dev server → localhost:4000
pnpm build            # Production build (use to verify changes)
pnpm lint             # ESLint
```

Environment variables (no .env.local.example exists — create manually):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure

```
frontend/src/
├── proxy.ts                        # Auth middleware (Next.js 16 convention, NOT middleware.ts)
├── app/
│   ├── globals.css                 # Tailwind v4 config (no tailwind.config.js)
│   ├── layout.tsx                  # Root: AuthProvider + QueryProvider
│   ├── (auth)/                     # Public auth (login, register, forgot-password, reset-password)
│   └── (main)/                     # Authenticated app with sidebar
│       ├── layout.tsx              # SidebarProvider + AppSidebar
│       ├── page.tsx                # Homepage
│       ├── people/                 # /people, /people/new, /people/[id] (UUID, not handle)
│       ├── tree/                   # Cây gia phả
│       ├── directory/              # Danh bạ thành viên
│       ├── events/                 # Lịch sự kiện
│       ├── contributions/          # Đề xuất chỉnh sửa
│       ├── achievements/           # Vinh danh
│       ├── fund/                   # Quỹ khuyến học
│       ├── charter/                # Hương ước
│       ├── cau-duong/              # Cầu đương
│       ├── documents/              # Tài liệu + /documents/book (gia phả sách)
│       └── admin/                  # Admin panel (admin/editor only)
│           ├── users/              # QL Người dùng
│           ├── contributions/      # QL Đề xuất
│           ├── achievements/       # QL Vinh danh
│           ├── fund/               # QL Quỹ & Học bổng
│           ├── charter/            # QL Hương ước
│           └── cau-duong/          # QL Cầu đương
├── components/
│   ├── ui/                         # shadcn/ui (new-york style, neutral base)
│   ├── layout/app-sidebar.tsx      # Main navigation sidebar
│   ├── auth/auth-provider.tsx      # AuthContext + useAuth hook
│   ├── providers/query-provider.tsx
│   ├── people/                     # person-form, family-relations-card, avatar-upload, photo-gallery
│   ├── tree/family-tree.tsx
│   ├── home/                       # featured-charter, stats-card
│   ├── events/                     # add-event-dialog, calendar-grid
│   └── shared/                     # error-boundary, route-error
├── hooks/
│   ├── use-people.ts               # People CRUD
│   ├── use-families.ts             # Family relations (Sprint 7.5)
│   ├── use-achievements.ts         # Achievement CRUD
│   ├── use-fund.ts                 # Fund & scholarships
│   ├── use-clan-articles.ts        # Charter/hương ước
│   ├── use-cau-duong.ts            # Cầu đương rotation
│   ├── use-contributions.ts        # Contribution suggestions
│   ├── use-events.ts               # Events
│   ├── use-media.ts                # Media/photos
│   ├── use-profiles.ts             # User profiles
│   ├── use-can-edit.ts             # Subtree edit permission (FR-508/510)
│   └── use-mobile.ts               # Mobile viewport detection
├── lib/
│   ├── supabase.ts                 # Supabase client (browser + server)
│   ├── supabase-data.ts            # Core data: people, families, children, profiles, events, contributions, media
│   ├── supabase-data-achievements.ts
│   ├── supabase-data-cau-duong.ts  # Includes DFS algorithm for rotation order
│   ├── supabase-data-charter.ts    # clan_articles CRUD
│   ├── supabase-data-fund.ts       # fund_transactions + scholarships
│   ├── supabase-storage.ts         # Storage upload/delete (bucket: 'media', 5MB limit)
│   ├── book-generator.ts           # Printable book data (used directly, no hook)
│   ├── gedcom-export.ts            # GEDCOM 5.5.1 export (used directly, no hook)
│   ├── lunar-calendar.ts           # Lunar-solar date conversion
│   ├── format.ts                   # Formatting utilities
│   ├── utils.ts                    # cn() helper (clsx + tailwind-merge)
│   └── validations/person.ts       # Zod schema for person form
├── types/
│   └── index.ts                    # All TypeScript type definitions (single file)
```

Database migrations (run in Supabase SQL Editor, in order):
```
frontend/supabase/
├── database-setup.sql              # Core 7 tables: people, families, children, profiles, contributions, events, media
├── sprint6-migration.sql           # 4 tables: achievements, fund_transactions, scholarships, clan_articles
├── cau-duong-migration.sql         # 2 tables: cau_duong_pools, cau_duong_assignments
├── sprint75-migration.sql          # ALTER profiles + is_person_in_subtree() function
└── storage-setup.sql               # Supabase Storage bucket 'media'
```

SDLC docs:
```
docs/
├── 00-foundation/                  # VISION.md, problem-statement.md, market-research.md, business-case.md
├── 01-planning/                    # BRD.md, roadmap.md
├── 02-design/                      # technical-design.md, ui-ux-design.md, review-report.md
├── 04-build/                       # SPRINT-PLAN.md
└── 05-test/                        # TEST-PLAN.md
```

## Architecture Patterns

### Feature Module Pattern (follow for all new features)

```
1. Types       → src/types/index.ts (add interfaces)
2. Data layer  → src/lib/supabase-data-{module}.ts (async CRUD functions)
3. Hooks       → src/hooks/use-{module}.ts (React Query useQuery/useMutation)
4. Public page → src/app/(main)/{module}/page.tsx + error.tsx + loading.tsx
5. Admin page  → src/app/(main)/admin/{module}/page.tsx + error.tsx + loading.tsx
6. Navigation  → src/components/layout/app-sidebar.tsx
```

### Auth & Permissions

- Auth middleware is `src/proxy.ts` (Next.js 16 `proxy()` convention, NOT `middleware.ts`)
- 4 roles: `admin`, `editor`, `viewer`, `guest`
- `isEditor` = role is `admin` OR `editor` (admin is superset)
- Admin routes require `admin` or `editor` role
- Subtree editing: editors with `edit_root_person_id` can only edit their subtree (via `is_person_in_subtree` RPC)
- Self-service: users with `linked_person` can edit their own person record

### Supabase Client

- Browser client created via `createBrowserClient` with cookie auth and 25-second fetch timeout (free tier cold start)
- Server client via `createServerClient()` with service role key for admin operations
- All tables have Row Level Security (RLS) policies

### React Query Caching

- People list/stats: 5 min staleTime
- Tree data: 5 min staleTime
- Person relations: 5 min staleTime (heavy 3-phase query)
- Other queries: default staleTime

### Database (15 tables, 4 layers)

| Layer | Tables |
|-------|--------|
| Core Genealogy | `people`, `families`, `children` |
| Platform | `profiles`, `contributions`, `media`, `events` |
| Culture (v1.3) | `achievements`, `fund_transactions`, `scholarships`, `clan_articles` |
| Ceremony (v1.4) | `cau_duong_pools`, `cau_duong_assignments` |

Key DB details:
- `people.gender`: 1 = Male, 2 = Female
- `people.privacy_level`: 0 = public, 1 = members only, 2 = private
- `profiles.role`: default `viewer`, auto-created on auth.users INSERT via trigger
- Storage path pattern: `people/{personId}/{timestamp}.{ext}`

## Coding Conventions

### Naming
- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions/vars:** camelCase (`getUserData`)
- **Constants:** SCREAMING_SNAKE (`MAX_RETRY_COUNT`)
- **Data layer:** `supabase-data-{module}.ts`
- **Hooks:** `use-{module}.ts`

### TypeScript
- Strict mode enabled
- Use explicit types, avoid `any`
- All types in single file `src/types/index.ts`
- Path alias: `@/*` → `./src/*`

### React/Next.js
- Server Components by default, `'use client'` only when needed
- Route groups: `(auth)` for public, `(main)` for authenticated
- Every page should have `error.tsx` and `loading.tsx` boundaries
- React Query for server state, no global client state library

### Styling
- Tailwind CSS v4 (config in `globals.css`, no `tailwind.config.js`)
- shadcn/ui with new-york style and neutral base color
- Mobile-first responsive design

### Language
- Vietnamese for user-facing content
- English for code, comments, and variable names

## Git Conventions

Commit messages follow Conventional Commits:
```
feat: add family tree visualization
fix: resolve date picker timezone issue
docs: update API documentation
chore: upgrade dependencies
```

Branch naming:
```
feature/tree-visualization
fix/auth-session-bug
docs/api-reference
```

## Important Notes

- Always run `pnpm build` after changes to verify compilation
- People routes use UUID `[id]` param, not `[handle]`
- DFS algorithm for Cầu đương rotation is in TypeScript (`supabase-data-cau-duong.ts`), not in PostgreSQL
- `book-generator.ts` and `gedcom-export.ts` are used directly in pages (no hook layer)
- SDLC follows LITE tier (5 stages) defined in `.sdlc-config.json` — do NOT use generic 6-stage or 11-stage structure
