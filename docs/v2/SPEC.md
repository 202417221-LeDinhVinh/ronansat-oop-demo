# RonanSAT v2 (OOP edition) - Product & Architecture Spec

Audience: the implementing agent. This is the binding spec for the v2 rewrite of this repo
(`C:\Users\MHC\Desktop\ronansat-oop-demo`, git branch `v2-oop`, v1 is tagged `v1-mvp`).
It is a university **Object-Oriented Programming lab** project, so the code must clearly
demonstrate OOP in TypeScript while also being a polished, working product.

## 0. Hard rules

- Work only inside `C:\Users\MHC\Desktop\ronansat-oop-demo`. You MAY READ files in
  `C:\Users\MHC\Desktop\ronansat-platform` for design reference (read-only). Never write,
  delete, run scripts, run git, or install anything there.
- Do not run any git command (I handle git).
- English only for code, comments, identifiers, docs, and UI copy. Rewrite any Vietnamese comment you touch.
- Keep `npm run demo` zero-config: no internet, no external accounts, no API keys at runtime.
  In-memory MongoDB (mongodb-memory-server) + seed, then `next dev` on port 3000. If port 3000
  or 27018 is busy, print a clear message and exit (do not crash with a stack trace).
- Fonts must be self-hosted via npm `@fontsource/*` packages (no `next/font/google`, no CDN).
- No secrets in code. Demo credentials stay: `admin@ronansat.com / AdminPassword123!`,
  `student@ronansat.com / StudentPassword123!`.
- Every process you start, you stop before you finish.

## 1. Scope (features)

Keep ONLY these product areas; remove the rest of v1 (leaderboard, hall of fame/student cards,
AI chat) including their routes, models, components and seed data.

1. **Auth** - register, login (NextAuth credentials, bcrypt), logout. Roles: student, admin.
2. **Home** (`/` after login; a simple landing/login when logged out) - greeting, latest score and
   best score, "continue / start practice" CTA, recent results (3), error-log count to review,
   vocab cards due today, small score-trend sparkline.
3. **Practice** (`/practice`) - library of tests. Two modes per test: **Full-length** (all 4 modules
   in order R&W M1, R&W M2, Math M1, Math M2 with per-module timers) and **Sectional** (pick one
   section + module). Test room at `/test/[id]` (keep the Bluebook-like exam UI from v1, cleaned up:
   timer, question navigator, mark for review, Desmos for Math only, passage left / question right
   for R&W). Supports BOTH question types: multiple choice and student-produced response (SPR,
   a text input; accepts equivalent answers such as `0.5`, `.5`, `1/2` where the accepted answers allow).
4. **Result** (`/results` list and `/results/[attemptId]` detail) - total scaled score 400-1600 and
   section scores 200-800 for full-length; section score for sectional; per-module correct counts;
   question grid (correct/incorrect/omitted) opening a review panel with the question, your answer,
   the correct answer and the explanation.
5. **Error log** (`/error-log`) - every incorrectly answered or omitted question across attempts,
   deduplicated per question (keep latest attempt, show how many times missed). Filters: section,
   domain, skill, reason, status. The student can tag a reason (Careless, Concept gap,
   Misread question, Time pressure, Guessed), write a short note, mark it resolved, and
   **retry** the question inline (correct retry marks it resolved automatically).
6. **Statistics** (`/statistics`) - score trend over time (line chart), accuracy by section and by
   domain/skill (bar chart / table), questions answered, average time per question if tracked,
   activity heatmap (last 12 weeks), strongest/weakest skills. Charts with `recharts`.
7. **Vocab** (`/vocab`) - decks of SAT words (word, part of speech, definition, example sentence).
   Browse decks, add/edit/delete own cards and decks, **flashcard study** session with
   spaced repetition (Leitner boxes 1-5; "Again / Hard / Good / Easy"), cards due today count.
   Seed 3 decks with ~80 real SAT words total (write accurate definitions and examples yourself).
8. **Admin** (`/admin`, admin role only, enforced server-side) - overview metrics (users, tests,
   questions, attempts), Tests CRUD (title, sections with module/time limit), Questions CRUD for a
   test (both MCQ and SPR, passage, choices, correct answer(s), explanation, domain, skill,
   difficulty, image URL), Users list with role change, Vocab system decks CRUD.

## 2. Data

- `data/prod-sample-tests.json` (do not edit by hand) has 2 real SAT tests. Import ALL questions now,
  including the 25 `spr` questions (`question_spr_accepted_answers`). Keep domain and skill.
  Local figure images in `public/demo-figures/` (already downloaded; reuse, extend
  `scripts/fetch-demo-figures.ts` only if something is missing).
- Seed for the student account: 6-8 past attempts spread over the last ~6 weeks (mix of
  full-length and sectional), with realistic, improving scores derived from actual per-question
  answers (the stored score must equal what the scoring strategy computes from those answers),
  so Home, Results, Statistics and Error log are populated. Some error-log entries already tagged.
  Vocab study history so some cards are due today.

## 3. Architecture (the OOP part - this is graded)

Layered, dependency-inverted design. Folder layout under `src/` or `lib/` (pick one, be consistent):

```
lib/
  domain/            # pure TypeScript, NO mongoose / next imports
    shared/          # Entity<TId> (abstract), ValueObject, DomainError hierarchy
    user/            # User (abstract), Student, Admin; Role; Email value object
    test/            # Test, Section (module, timeLimit), TestMode
    question/        # Question (abstract), MultipleChoiceQuestion, StudentProducedResponseQuestion
    attempt/         # Attempt (aggregate root), AnswerRecord, AttemptStatus
    scoring/         # ScoringStrategy (interface), FullLengthScoringStrategy,
                     # SectionalScoringStrategy, ScoringStrategyFactory, ScaledScore value object
    errorlog/        # ErrorLogEntry, MistakeReason, ErrorLogStatus
    vocab/           # VocabDeck, VocabCard, ReviewScheduler (interface), LeitnerScheduler, ReviewGrade
    statistics/      # read models (StatisticsSnapshot etc.)
  application/       # services (use cases) as CLASSES with constructor injection
                     # AuthService, TestService, PracticeService (start/submit attempt),
                     # ResultService, ErrorLogService, StatisticsService, VocabService, AdminService
                     # ports: PasswordHasher, Clock (interfaces)
  infrastructure/
    persistence/     # mongoose schemas + models; Repository implementations
                     # IRepository<T, TId> lives in domain or application as an interface;
                     # MongoRepository<TEntity, TDoc> abstract generic class implementing it with
                     # abstract toEntity()/toDocument() mappers (Template Method);
                     # MongoTestRepository, MongoQuestionRepository, MongoAttemptRepository, ...
    security/        # BcryptPasswordHasher implements PasswordHasher
    seed/            # ProdSampleImporter (class), DemoSeeder (class)
  http/
    BaseController.ts   # abstract; Template Method: authenticate -> authorize(requiredRole) ->
                        # validate (zod) -> execute() (abstract) -> map result/errors to NextResponse
    errors/             # HttpError mapping from DomainError subclasses (NotFoundError -> 404,
                        # ValidationError -> 400, UnauthorizedError -> 401, ForbiddenError -> 403)
    controllers/        # one class per use case or per resource, extending BaseController
  container.ts       # composition root: builds repositories, services, controllers once (singleton)
```

Mandatory OOP elements (each must be real, used by the running app, and unit-tested):
- **Encapsulation**: entity state in `private`/`readonly` fields, exposed via getters and intention-revealing
  methods (`attempt.recordAnswer(...)`, `attempt.submit(strategy)`, `card.review(grade, scheduler, clock)`);
  invariants enforced in constructors/methods (e.g. cannot answer after submit, ScaledScore range,
  Email format). No public mutable fields on entities.
- **Abstraction**: interfaces for `IRepository<T, TId>`, `ScoringStrategy`, `ReviewScheduler`,
  `PasswordHasher`, `Clock`. Services depend on interfaces, never on mongoose.
- **Inheritance**: `Entity<TId>` base; `User` -> `Student`/`Admin`; `Question` -> `MultipleChoiceQuestion` /
  `StudentProducedResponseQuestion`; `MongoRepository<...>` -> concrete repositories;
  `BaseController` -> controllers; `DomainError` -> subclasses.
- **Polymorphism**: `question.isCorrect(answer)` differs per subclass (SPR normalizes and compares
  numeric equivalents); `ScoringStrategy.score(attempt)` differs for full-length vs sectional;
  `user.canAccessAdmin()`/permissions differ by subclass; repositories swappable
  (`InMemory*Repository` used in unit tests vs `Mongo*Repository` in the app).
- **Composition**: `Test` has `Section[]`; `Attempt` has `AnswerRecord[]`; `VocabDeck` has `VocabCard[]`.
- **Design patterns** (name them in code doc comments): Repository, Strategy, Factory
  (`ScoringStrategyFactory`, `QuestionFactory.fromPersistence`), Template Method (BaseController,
  MongoRepository), Singleton/Composition Root (container), Dependency Injection (constructor).
- Next.js route handlers (`app/api/**/route.ts`) are thin: 1-5 lines delegating to a controller from the
  container. No business logic or mongoose calls in routes, pages or React components.
- No more `export const xService = { ... }` object-literal services anywhere.
- Strict TypeScript (`strict: true`), no `any` in `lib/domain` and `lib/application` (lint rule error there).

Scoring: use a documented, simplified linear raw-to-scaled conversion per section
(e.g. scaled = 200 + round(600 * correct / total / 10) * 10), implemented in the strategies and
explained in README. Full-length total = R&W + Math. Sectional reports that section only.

## 4. UI - match the current RonanSAT web design ("The Warm Studio")

Read (read-only) in `C:\Users\MHC\Desktop\ronansat-platform`:
- `docs/DESIGN.md` (sections 1-5; ignore dark mode, forum, courses and other features we do not build),
- `app/globals.css` (`@theme inline` tokens: colors, radii, shadows, typography scale),
- `components/ui/` (Button, Card, Badge, Tabs, Dialog, Input, Select ... look & API),
- `components/nav/` (app shell / navigation), `components/dashboard/`, `components/statistics/`,
  `components/vocab/`, `components/review/`, `components/test/` and `components/test-room/` for layout ideas.
Rebuild a SIMPLIFIED version here (do not copy the whole system or its dependencies): warm off-white
canvas `#faf9f7`, white cards, hairline warm borders, soft shadows, pastel gold brand accent with
ink text, the same fonts (Bricolage Grotesque display, DM Sans body, Geist Mono) via `@fontsource`.
Light mode only. Tailwind v4 tokens in `app/globals.css`.
- ONE set of shared primitives in `components/ui/` (Button, Card, Badge, Input, Textarea, Select,
  Tabs, Dialog, EmptyState, StatCard, PageHeader, Skeleton). Reuse them everywhere; no duplicated
  one-off buttons/cards. Remove antd if it is no longer needed.
- App shell: left sidebar nav on desktop (Home, Practice, Results, Error log, Statistics, Vocab,
  Admin for admins), top bar with user menu; bottom tab bar on mobile. Responsive down to 375 px.
- Every page has loading (skeleton), empty and error states.
- Keep `components/RichText.tsx` as the one renderer for question HTML/LaTeX (KaTeX + sanitize).

## 5. Quality gates (all must pass at the end of every phase)

- `npx tsc --noEmit` -> 0 errors. `npm run lint` -> 0 errors.
- `npm test` (vitest) -> all pass; >= 50 unit tests covering the domain (scoring strategies, SPR answer
  equivalence, attempt invariants, Leitner scheduling, error log dedup) and services with
  `InMemory*Repository` fakes.
- `npm run build` -> success.
- `npm run demo` + `scripts/verify-endpoints.ts` (rewrite for v2) -> every API and page returns the
  expected status for student, admin and anonymous (anonymous gets 401/redirect on protected routes,
  student gets 403 on admin APIs).
- Browser screenshots (Playwright or puppeteer) of every page at 1440 px and the Home + test room at
  375 px into `docs/screenshots/v2/`. LOOK at every screenshot yourself; fix layout bugs, overflow,
  raw LaTeX, broken images, unstyled elements. Repeat until clean.

## 6. Docs

- `README.md` rewritten for v2: features, how to run, demo accounts, architecture diagram (folder
  layers), an "OOP in this project" table: concept -> class/file -> short explanation (only true claims),
  design patterns table, scoring formula, testing.
- `docs/v2/ARCHITECTURE.md`: layers, dependency rule, request flow example (submit attempt).
