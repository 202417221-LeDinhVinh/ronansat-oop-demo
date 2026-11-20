# RonanSAT v3 - OOP Edition

RonanSAT is a full-stack SAT practice platform used as the semester project for the
Object-Oriented Programming lab. It reproduces the Bluebook-style digital SAT flow end to end:
timed Reading & Writing and Math modules, multiple-choice and student-produced-response
questions, scaled scoring, result review, an error log, analytics, spaced-repetition
vocabulary, and an admin studio.

This is **v3**. v2 rewrote the v1 MVP around a layered, dependency-inverted object-oriented
architecture; v3 maps that code to every topic of the IT3100E OOP syllabus and restyles the UI
after the current RonanSAT platform. See [Version history](#version-history) below.

## Features

| Area | Route | What it does |
| --- | --- | --- |
| Home | `/` | Greeting, latest score, best score, mistakes to review, vocabulary due today, recent results, score-trend sparkline, and a practice CTA. |
| Practice | `/practice` | Test library with two modes: full-length (all four modules in order with per-module timers) and sectional (one section + module). The test room supports MCQ, SPR numeric equivalence, a per-module timer, question navigator, mark-for-review, Desmos for Math, and a passage/question split view for Reading & Writing. |
| Results | `/results`, `/results/[id]` | Attempt history and a detail page with the total score (400-1600) or section score (200-800), per-module correct counts, a correct/incorrect/omitted question grid, and a review dialog with your answer, the correct answer, and the explanation. |
| Error log | `/error-log` | Every incorrect or omitted question across attempts, deduplicated per question. Filter by section, domain, skill, reason, and status; tag a mistake reason, save a note, mark it resolved, and retry the question inline. A correct retry resolves the entry automatically. |
| Statistics | `/statistics` | Full-length score trend chart (400-1600), a separate sectional-drill score view (200-800), accuracy by section and by domain, questions answered, a 12-week activity heatmap, and strongest/weakest skills. |
| Vocab | `/vocab` | System and personal decks, card CRUD, a flashcard study session with Leitner 1-5 spaced repetition (Again / Hard / Good / Easy), and a cards-due-today counter. |
| Admin | `/admin` | Admin-only studio with overview metrics, test CRUD, MCQ/SPR question CRUD, user roles, and system vocabulary decks. Access is enforced server-side by the controller layer. |

## How to run

Requirements: Node.js 20+ and npm. No API keys, external database, or network services are
needed at runtime.

```bash
npm install
npm run demo
```

`npm run demo` starts an in-memory MongoDB on port `27018`, seeds the full demo dataset, and
launches the Next.js dev server on `http://localhost:3000`. Both ports must be free. Open the
URL and sign in with one of the demo accounts below.

Run the unit test suite with:

```bash
npm test
```

Other useful commands: `npm run build` (production build), `npm run seed` (seed an already
running MongoDB), `npm run check:oop` (verify every file, symbol, and test named in the OOP
syllabus checklist), and `npx tsx scripts/verify-endpoints.ts` (API/page status verification
against a running demo).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ronansat.com` | `AdminPassword123!` |
| Student | `student@ronansat.com` | `StudentPassword123!` |

The seeded student has eight past attempts spread over six weeks (five full-length attempts
improving from 1050 to 1360, plus three sectional drills), tagged and untagged error-log
entries, and vocabulary study history so some cards are due today.

## Tech stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript 5 with `strict: true`
- Tailwind CSS v4 with design tokens in `app/globals.css`
- MongoDB through Mongoose, with `mongodb-memory-server` for the zero-config demo
- NextAuth credentials provider with bcrypt password hashing
- Zod for HTTP request validation
- Recharts for analytics, KaTeX for question math, self-hosted `@fontsource` fonts
- Vitest for unit tests

## Architecture

The code is split into four layers under `lib/`, plus a composition root. Dependencies point
inward only: the domain knows nothing about the other layers; the application layer knows the
domain and its own port interfaces; infrastructure implements those ports; HTTP adapts
requests to application services. Next.js routes and React pages contain no business logic and
no Mongoose calls.

```
app/                                Next.js App Router
  api/**/route.ts                   thin route handlers (delegate to one controller)
  page.tsx, practice/, results/,    React pages and layouts (UI only)
  error-log/, statistics/, vocab/,
  admin/, auth/, test/[id]/
components/                         shared UI primitives and product components
lib/
  domain/                           pure TypeScript, no mongoose / next imports
    shared/                         Entity<TId>, ValueObject, DomainError hierarchy
    user/                           User (abstract) -> Student, Admin; Email; Role
    test/                           Test, Section, TestMode
    question/                       Question (abstract) -> MultipleChoiceQuestion,
                                     StudentProducedResponseQuestion; QuestionFactory;
                                     Gradable / Describable / Comparable capabilities
    attempt/                        Attempt (aggregate root), AnswerRecord, AttemptStatus
    scoring/                        ScoringStrategy, full-length/sectional strategies,
                                     ScoringStrategyFactory, ScaledScore
    errorlog/                       ErrorLogEntry, MistakeReason, ErrorLogStatus
    vocab/                          VocabDeck, VocabCard, ReviewScheduler, LeitnerScheduler
    events/                         DomainEvents, DomainEventBus (typed Observer)
    statistics/                     read models for the statistics page
  application/                      use-case services and ports (interfaces)
    services/                       AuthService, TestService, PracticeService,
                                     ResultService, ErrorLogService, StatisticsService,
                                     VocabService, AdminService
    eventhandlers/                  StudentProgressHandler, ErrorLogProjector
    ports/                          IRepository and repository interfaces, PasswordHasher, Clock
  infrastructure/                   adapters to the outside world
    persistence/                    Mongoose schemas, MongoRepository<TEntity, TDoc>,
                                    Mongo*Repository implementations, InMemory*Repository fakes
    security/                       BcryptPasswordHasher, SystemClock
    seed/                           DemoSeeder, ProdSampleImporter
  http/                             HTTP adapter
    BaseController.ts               template-method request pipeline
    controllers/                    one controller class per use case / resource
    errors/                         HttpErrorMapper (DomainError -> HTTP status)
  container.ts                      composition root / singleton wiring
lib/authOptions.ts                  NextAuth configuration using AuthService
scripts/demo.ts                     zero-config demo launcher
scripts/verify-endpoints.ts         endpoint and page verification script
tests/unit/                         Vitest unit tests (domain and application)
```

Dependency rule: `domain <- application <- infrastructure/http <- container/routes`. The domain
layer compiles with no framework dependency. The application layer never imports Mongoose.
Controllers depend on application services, and services depend only on interfaces. The
container is the only place that constructs concrete repositories, hashers, clocks, services,
and controllers.

More detail, including a step-by-step request trace and a feature checklist, is in
[docs/v2/ARCHITECTURE.md](docs/v2/ARCHITECTURE.md).

## OOP in this project

Every claim below is backed by code in this repository.

| Concept | Class / file | Explanation |
| --- | --- | --- |
| Abstraction (abstract class) | `lib/domain/shared/Entity.ts` | `Entity<TId>` owns identity and identity-based equality; all aggregates extend it. |
| Abstraction (interfaces) | `lib/application/ports/` | Services depend on `IRepository`, `IUserRepository`, `IAttemptRepository`, `PasswordHasher`, `Clock`, and the other ports instead of concrete implementations. |
| Abstract class vs interfaces | `lib/domain/question/Question.ts`, `lib/domain/question/QuestionCapabilities.ts` | `Question` is an abstract class for shared state and template behaviour; it implements three capability interfaces (`Gradable`, `Describable`, `Comparable<Question>`). |
| Encapsulation / invariants | `lib/domain/attempt/Attempt.ts` | State is private; `recordAnswer()` rejects writes after submission and `submit(strategy, questions)` rejects a second submission. State is exposed through getters only. |
| Encapsulation / value objects | `lib/domain/user/Email.ts`, `lib/domain/scoring/ScaledScore.ts`, `lib/domain/test/Section.ts` | Immutable value objects that validate in their constructors: email format, score bounds (400-1600 or 200-800), and section shape. |
| Constructors / object comparison | `lib/domain/scoring/ScaledScore.ts`, `lib/domain/shared/ValueObject.ts`, `lib/domain/shared/Entity.ts` | `ScaledScore` has an overloaded constructor (props or section scores). Value objects use `equals` for structural equality; entities use `equals` for identity equality. |
| Method overloading / static vs instance | `lib/domain/vocab/VocabCard.ts` | `review(grade)` and `review(grade, scheduler, now)` are overload signatures. `VocabCard.MAX_BOX` is a static constant while `card.box` is per-instance state. |
| Inheritance | `Student` / `Admin` extend `User`; `MultipleChoiceQuestion` / `StudentProducedResponseQuestion` extend `Question`; `Mongo*Repository` extend `MongoRepository`; controllers extend `BaseController`; error types extend `DomainError`. | Shared behavior lives in the base class; subclasses add or override the parts that differ. |
| Polymorphism and binding | `question.isCorrect(answer)` in `Question` subclasses; `ScoringStrategy.score(attempt, questions)`; `user.canAccessAdmin()`; repositories with Mongo and in-memory implementations. | The caller uses a base type and dynamic binding selects the concrete behaviour. The one explicit downcast (`instanceof Student`) is justified in `StudentProgressHandler`. |
| Composition / aggregation | `Test` has `Section[]` (composition) and references questions by id (aggregation); `Attempt` has `AnswerRecord[]` (composition); `VocabDeck` contains `VocabCard[]` (composition). | Aggregates own the objects that cannot exist alone and only reference objects with their own lifecycle. |
| Generics | `lib/infrastructure/persistence/inmemory/InMemoryRepositories.ts`, `lib/application/ports/repositories/IRepository.ts`, `lib/domain/shared/Page.ts`, `collectEntityIds` | One generic `InMemoryRepository<T, TId>`, a bounded `IRepository<TEntity extends Entity<TId>, TId>`, a generic `Page<T>`, and an `Entity<unknown>` wildcard helper. |
| Exceptions | `lib/domain/shared/DomainError.ts`, `lib/infrastructure/persistence/MongoRepository.ts`, `lib/http/errors/HttpErrorMapper.ts` | The domain error hierarchy includes `PersistenceError` with a chained `cause`; repositories wrap driver failures and controllers map them to an opaque 500. |
| Observer | `lib/domain/events/DomainEventBus.ts`, `lib/application/eventhandlers/`, `lib/container.ts` | After `AttemptSubmitted`, `StudentProgressHandler` and `ErrorLogProjector` update progress and the error log through a typed event bus. |
| Dependency Injection | Service constructors in `lib/application/services/` | Every dependency is passed in through the constructor and wired once in `lib/container.ts`. |
| Template Method | `BaseController.handle()` and `MongoRepository.save()/findById()` | The base class fixes the algorithm; subclasses implement `execute()` or the `toEntity()` / `toDocument()` hooks. |
| Factory | `ScoringStrategyFactory.getStrategy(mode)`, `QuestionFactory.fromPersistence()` | Object creation is centralized and returns the correct subtype. |

## Design patterns

| Pattern | Where | Role |
| --- | --- | --- |
| Repository | `IRepository<T, TId>` plus `MongoRepository` and `Mongo*Repository` in `lib/infrastructure/persistence/`; `InMemory*Repository` in `persistence/inmemory/` | Keeps persistence out of the domain and lets tests swap in-memory fakes. |
| Strategy | `FullLengthScoringStrategy`, `SectionalScoringStrategy`, `LeitnerScheduler` | Swappable scoring and spaced-repetition algorithms. |
| Factory | `ScoringStrategyFactory`, `QuestionFactory` | Creates the right strategy for a test mode and the right question subtype for stored data. |
| Template Method | `BaseController.handle()` (authenticate -> authorize -> validate -> execute -> map errors) and `MongoRepository` CRUD with `toEntity` / `toDocument` hooks | Fixes the request and persistence skeletons while allowing subclass-specific steps. |
| Observer | `DomainEventBus`, `StudentProgressHandler`, `ErrorLogProjector` | `AttemptSubmitted` and `VocabCardReviewed` events notify subscribers without coupling the service to their side effects. |
| Singleton / Composition Root | `Container.getInstance()` in `lib/container.ts`, exported as `container` | Builds repositories, services, controllers, and event subscriptions exactly once. |
| Dependency Injection | Constructor injection in every service and controller | Application code depends on interfaces and receives them from the container. |

## Scoring

Both scoring strategies use the same simplified linear conversion for one section:

```
sectionScaled = 200 + round(600 * correct / total / 10) * 10
sectionScaled = clamp(sectionScaled, 200, 800)
```

- `FullLengthScoringStrategy`: splits the questions into Reading & Writing (section name
  contains "reading" or "verbal") and Math (section name contains "math"), scales each section
  independently, and sets `total = rwScaled + mathScaled`, so the total is in 400-1600.
- `SectionalScoringStrategy`: scores only the requested section/module and reports that single
  scaled value in 200-800.
- Wrong answers and omitted questions both count as incorrect. There is no penalty beyond not
  earning the point.
- `rawCorrectCounts` and `totalQuestions` are stored on the `ScaledScore` value object and shown
  in the result detail UI.

This is a documented simplification for the lab project, not the real College Board equating
algorithm. The UI labels it as a simplified linear scale.

## Testing

`npm test` runs Vitest with eight unit test files under `tests/unit/`, covering the domain and
application layers:

- scoring strategies and score bounds (`scoring.test.ts`)
- attempt invariants and answer recording (`attempt.test.ts`)
- SPR numeric equivalence and MCQ matching (`question-spr.test.ts`)
- users, email validation, and error-log deduplication/retry (`user-and-errorlog.test.ts`)
- Leitner scheduling (`vocab-leitner.test.ts`)
- application services with in-memory repositories (`services.test.ts`)
- constructors, equality, overloading, capabilities, generics, wildcards, and binding
  (`domain/oop-foundations.test.ts`)
- exception chaining, opaque 500 mapping, and Observer event handling
  (`application/events-and-errors.test.ts`)

The suite contains **79 unit tests**. No database or running server is required for `npm test`.
`npm run check:oop` additionally verifies every file, symbol, and test named in
[`docs/v3/OOP-CHECKLIST.md`](docs/v3/OOP-CHECKLIST.md).

## Screenshots

Desktop shots are 1440 px wide, mobile shots 375 px.

| Screen | File |
| --- | --- |
| Login / register | [01-auth-desktop-1440.png](docs/screenshots/v3/01-auth-desktop-1440.png) |
| Home dashboard | [02-dashboard-desktop-1440.png](docs/screenshots/v3/02-dashboard-desktop-1440.png) |
| Practice library | [03-practice-desktop-1440.png](docs/screenshots/v3/03-practice-desktop-1440.png) |
| Test room | [04-test-room-desktop-1440.png](docs/screenshots/v3/04-test-room-desktop-1440.png) |
| Results list | [05-results-list-desktop-1440.png](docs/screenshots/v3/05-results-list-desktop-1440.png) |
| Result detail | [06-result-detail-desktop-1440.png](docs/screenshots/v3/06-result-detail-desktop-1440.png) |
| Error log | [07-error-log-desktop-1440.png](docs/screenshots/v3/07-error-log-desktop-1440.png) |
| Statistics | [08-statistics-desktop-1440.png](docs/screenshots/v3/08-statistics-desktop-1440.png) |
| Vocabulary decks | [09-vocab-library-desktop-1440.png](docs/screenshots/v3/09-vocab-library-desktop-1440.png) |
| Flashcard study | [10-vocab-study-desktop-1440.png](docs/screenshots/v3/10-vocab-study-desktop-1440.png) |
| Settings | [11-settings-desktop-1440.png](docs/screenshots/v3/11-settings-desktop-1440.png) |
| Admin overview | [12-admin-overview-desktop-1440.png](docs/screenshots/v3/12-admin-overview-desktop-1440.png) |
| Admin tests | [13-admin-tests-desktop-1440.png](docs/screenshots/v3/13-admin-tests-desktop-1440.png) |
| Admin questions | [14-admin-questions-desktop-1440.png](docs/screenshots/v3/14-admin-questions-desktop-1440.png) |
| Admin users | [15-admin-users-desktop-1440.png](docs/screenshots/v3/15-admin-users-desktop-1440.png) |
| Admin vocabulary | [16-admin-vocab-desktop-1440.png](docs/screenshots/v3/16-admin-vocab-desktop-1440.png) |
| Mobile home | [17-dashboard-mobile-375.png](docs/screenshots/v3/17-dashboard-mobile-375.png) |
| Mobile test room | [18-test-room-mobile-375.png](docs/screenshots/v3/18-test-room-mobile-375.png) |
| Mobile flashcard study | [19-vocab-study-mobile-375.png](docs/screenshots/v3/19-vocab-study-mobile-375.png) |

## UML

The diagrams live in [docs/uml/](docs/uml/) (Mermaid sources `.mmd` next to each PNG/SVG):

- [01a-domain-class.png](docs/uml/01a-domain-class.png) - users, tests, questions (split views: `01a1`, `01a2`)
- [01b-domain-class.png](docs/uml/01b-domain-class.png) - attempts, scoring, error log, vocabulary (split views: `01b1`, `01b2`)
- [02-scoring-strategy.png](docs/uml/02-scoring-strategy.png) - Strategy pattern and polymorphism
- [03a-layered-architecture.png](docs/uml/03a-layered-architecture.png) - layers and controllers (split views: `03a1`, `03a2`)
- [03b-repository-architecture.png](docs/uml/03b-repository-architecture.png) - repositories and ports
- [04-use-case.png](docs/uml/04-use-case.png) - actors and use cases (`04a` student, `04b` admin)
- [05-sequence-submit-attempt.png](docs/uml/05-sequence-submit-attempt.png) - submit-attempt sequence (`05a` submit, `05b` event handlers)
- [06-sequence-vocab-review.png](docs/uml/06-sequence-vocab-review.png) - vocabulary review sequence
- [07-observer-events.png](docs/uml/07-observer-events.png) - Observer: typed domain event bus and handlers
- [08-exception-hierarchy.png](docs/uml/08-exception-hierarchy.png) - `DomainError` hierarchy and HTTP mapping

The presentation deck is `slides/main.pdf` (LaTeX source `slides/main.tex`, speaker script `slides/script.md`).

## Version history

v1 is the original MVP, preserved in git as tag **`v1-mvp`**. v2 is preserved on the `v2-oop`
branch. v3 is the current `main`.

### v2 to v3

- Every IT3100E syllabus topic (constructors and comparison, overloading, static members,
  aggregation vs composition, abstract classes vs interfaces, up/downcasting, generics,
  exceptions, Observer/event handling) is backed by running code and a unit test, listed in
  [`docs/v3/OOP-CHECKLIST.md`](docs/v3/OOP-CHECKLIST.md) and verified by `npm run check:oop`.
- Submission side effects (student progress, error log) moved out of `PracticeService` into
  Observer handlers on a typed `DomainEventBus`.
- The UI was restyled after the current RonanSAT platform (sidebar shell, stat cards, charts,
  flashcards) without adding features or routes.
- UML gained the Observer and exception diagrams, and the slides were updated to 38 pages.

### v1 to v2

- v1 used procedural object-literal services (`export const xService = { ... }`) that mixed
  validation, Mongoose access, and response shaping. v2 uses domain entities, application
  services with constructor injection, repositories behind interfaces, and thin controllers.
- v1 included leaderboard, hall of fame/student cards, and an AI chat tutor. These features and
  their routes, models, components, and seed data were removed in v2 so the product focuses on
  practice, review, analytics, vocabulary, and administration.
- v1 rendered with Ant Design. v2 uses one set of shared Tailwind UI primitives, self-hosted
  fonts, and the Warm Studio visual system.
- v1 accepted only multiple-choice questions. v2 imports and serves both MCQ and SPR questions,
  including numeric equivalence for answers such as `0.5`, `.5`, and `1/2`.
- v1 had no enforced layering: pages and route handlers contained business logic and database
  calls. v2 keeps routes to a single controller delegation and keeps Mongoose inside
  `lib/infrastructure`.
