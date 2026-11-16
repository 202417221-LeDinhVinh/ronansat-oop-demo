# RonanSAT v2 Architecture

This document describes the layered architecture of the v2 rewrite, the dependency rule, the
composition root, one complete request flow, and the steps for adding a feature. It matches the
code in `lib/` and the Next.js routes in `app/api/`.

## 1. Layers

```
+--------------------------------------------------------------+
| app/api/**/route.ts          thin HTTP entry points           |
| components/, app/**/page.tsx React UI (no business logic)     |
+-----------------------------+--------------------------------+
                              |
+-----------------------------v--------------------------------+
| lib/http/                    HTTP adapter                     |
|   BaseController             template-method pipeline        |
|   controllers/               one class per use case           |
|   errors/HttpErrorMapper     DomainError -> HTTP status       |
+-----------------------------+--------------------------------+
                              |
+-----------------------------v--------------------------------+
| lib/application/             use cases and ports              |
|   services/                  AuthService, TestService,        |
|                              PracticeService, ResultService,  |
|                              ErrorLogService,                 |
|                              StatisticsService, VocabService, |
|                              AdminService                    |
|   ports/                     IRepository, I*Repository,       |
|                              PasswordHasher, Clock            |
+-----------------------------+--------------------------------+
                              |
+-----------------------------v--------------------------------+
| lib/domain/                  pure TypeScript                  |
|   shared/                    Entity, ValueObject, DomainError |
|   user/ test/ question/      entities, value objects,         |
|   attempt/ scoring/          strategies, invariants           |
|   errorlog/ vocab/ statistics/                                |
+--------------------------------------------------------------+

lib/infrastructure/ implements application ports and persists domain entities:
  persistence/  Mongoose schemas, MongoRepository, Mongo*Repository, InMemory*Repository
  security/     BcryptPasswordHasher, SystemClock
  seed/         ProdSampleImporter, DemoSeeder
```

### What belongs where

- **Domain** (`lib/domain`): entities, value objects, domain errors, and algorithms such as
  scoring and Leitner scheduling. Imports nothing from Mongoose, Next.js, React, or the other
  layers. This is enforced by review and lint rules.
- **Application** (`lib/application`): use-case services and port interfaces. Services receive
  their dependencies through constructors and depend only on the domain and the ports. They
  contain the workflow logic: auth, starting/submitting attempts, assembling results, error-log
  operations, statistics aggregation, vocabulary review, and admin operations.
- **Infrastructure** (`lib/infrastructure`): concrete adapters. Mongoose is allowed only here.
  `MongoRepository<TEntity, TDoc>` implements the generic CRUD template and declares abstract
  `toEntity()` / `toDocument()` hooks that each concrete repository implements. The in-memory
  repositories implement the same interfaces for unit tests.
- **HTTP** (`lib/http`): `BaseController` and concrete controllers. Controllers translate an
  HTTP request into an application-service call and serialize the result. They do not contain
  domain rules or persistence code.
- **UI** (`app/`, `components/`): React pages and components. They call the JSON API through
  `lib/axios.ts` and render state; they do not import Mongoose or instantiate repositories.
- **Composition root** (`lib/container.ts`): the only place that constructs concrete classes.

### Dependency rule

Dependencies point inward:

```
container  ->  http  ->  application  ->  domain
     |            |            ^
     +------------+------------+
          infrastructure implements application ports
```

- `lib/domain` depends on nothing outside itself.
- `lib/application` depends on `lib/domain` and its own port interfaces.
- `lib/infrastructure` depends on `lib/domain` and `lib/application/ports` (it implements them).
- `lib/http` depends on `lib/application`, `lib/domain`, and `lib/authOptions`.
- `lib/container.ts` depends on all layers to wire them.
- `app/api/**/route.ts` depends only on `lib/container` (and the `RequestContext` type).
- React pages/components depend on the HTTP API, never on the container or Mongoose.

Consequences: the domain is testable without a database or framework; services can be unit
tested with in-memory repositories; and Mongoose imports are confined to `lib/infrastructure`
(plus `lib/mongodb.ts` for the connection helper).

## 2. Composition root

`lib/container.ts` defines `Container` with a private constructor and a static
`getInstance()`, then exports one shared instance:

```ts
export class Container {
  public static getInstance(): Container { /* creates once */ }
  private constructor() { /* builds everything below */ }
}

export const container = Container.getInstance();
```

Construction order inside the container:

1. Ports: `BcryptPasswordHasher`, `SystemClock`, `LeitnerScheduler`.
2. Repositories: `MongoUserRepository`, `MongoTestRepository`, `MongoQuestionRepository`,
   `MongoAttemptRepository`, `MongoErrorLogRepository`, `MongoVocabDeckRepository`,
   `MongoVocabCardRepository`.
3. Application services: each service receives the repositories and ports it needs, for example
   `PracticeService(attemptRepo, testRepo, questionRepo, userRepo, errorLogRepo, clock)`.
4. Controllers: each controller receives its application service, for example
   `SubmitAttemptController(practiceService)`.

A route handler therefore stays trivial:

```ts
import { container } from "@/lib/container";

export async function POST(req: Request, context: RequestContext) {
    return container.submitAttemptController.handle(req, context);
}
```

This is the Singleton pattern (one container per process) plus the Composition Root and
Dependency Injection patterns (constructors receive collaborators; the container wires them).

## 3. Request flow: submitting an attempt

The student clicks **Submit Test** in the test room.

1. **UI** - `components/TestEngine.tsx` calls
   `api.post("/api/attempts/{attemptId}/submit", {})`.
2. **Route** - `app/api/attempts/[id]/submit/route.ts` delegates to
   `container.submitAttemptController.handle(req, context)`.
3. **Template pipeline** - `BaseController.handle()` in `lib/http/BaseController.ts` runs:
   - `dbConnect()` (`lib/mongodb.ts`) to ensure the Mongoose connection is ready.
   - `authenticate()` via `getServerSession(authOptions)`.
   - `authorize(session)`; this controller has no required role, so it only relies on the
     session check inside `execute()`.
   - `parseAndValidate()`; no schema is configured, so the input is empty.
   - `execute()` - the subclass hook.
   Any thrown `DomainError` is converted by `HttpErrorMapper.map()` to 404, 400, 401, 403, or
   409; unexpected errors become 500 responses.
4. **Controller** - `SubmitAttemptController.execute()` in
   `lib/http/controllers/practice/SubmitAttemptController.ts`:
   - requires `session.user.id` (otherwise `UnauthorizedError`);
   - reads the attempt id from `context.params.id`;
   - calls `practiceService.submitAttempt(attemptId, session.user.id)`;
   - builds the response with `attemptId` and the score values.
5. **Application service** - `PracticeService.submitAttempt()` in
   `lib/application/services/PracticeService.ts`:
   - loads the attempt with `attemptRepo.findById(attemptId)`; throws `NotFoundError` if missing;
   - rejects attempts owned by another user with `ForbiddenError`;
   - loads questions with `questionRepo.findByTestId(attempt.testId)`, filtering by section and
     module for sectional attempts;
   - obtains a strategy from `ScoringStrategyFactory.getStrategy(attempt.mode)`;
   - calls `attempt.submit(strategy, questions, clock.now())`.
6. **Domain** - `Attempt.submit()` in `lib/domain/attempt/Attempt.ts`:
   - throws `InvariantViolationError` if the attempt is already submitted;
   - calls `strategy.score(attempt, questions)`, which returns a `ScaledScore` value object;
   - stores the score, marks the status `submitted`, sets `submittedAt`, and returns the score.
   The strategy is either `FullLengthScoringStrategy` or `SectionalScoringStrategy`, selected by
   `ScoringStrategyFactory`.
7. **Persistence and side effects** back in `PracticeService`:
   - `attemptRepo.save(attempt)` persists the submitted attempt and score;
   - if the user is a `Student`, `recordTestCompletion(testId, score.total, now)` updates
     progress and the user is saved;
   - for every unanswered or incorrect question, the service calls
     `errorLogRepo.findByUserAndQuestion(userId, questionId)`. An existing
     `ErrorLogEntry.recordNewMistake(attemptId, now)` increments the miss count and reopens the
     entry; otherwise a new `ErrorLogEntry` is created. This keeps the log deduplicated per
     question.
8. **Response** - `BaseController.handle()` serializes the controller result with
   `NextResponse.json(result, { status: 200 })`. The test room redirects to
   `/results/{attemptId}`.

The same pattern applies to every other endpoint: route -> `BaseController.handle()` ->
controller `execute()` -> application service -> domain entity/value object -> repository port
-> infrastructure implementation.

## 4. How to add a new feature

Use the existing features as templates. For a new resource or use case, follow this order:

1. **Domain** (`lib/domain/<context>/`): add the entity or value object and enforce invariants
   in its constructor and intention-revealing methods. Extend `Entity<string>` or
   `ValueObject`. Add domain-specific errors from `lib/domain/shared/DomainError.ts` when a rule
   is violated. Do not import Mongoose, Next.js, or React. Export it from the context index.
2. **Ports** (`lib/application/ports/repositories/`): add a repository interface extending
   `IRepository<TEntity, string>` with the queries the use case needs. Export it from the ports
   index. If the feature needs a new collaborator (for example a notifier), define a port
   interface next to `PasswordHasher` and `Clock`.
3. **Infrastructure** (`lib/infrastructure/persistence/`): add a Mongoose schema, a
   `MongoRepository` subclass implementing `toEntity()` and `toDocument()`, and an in-memory
   implementation for tests. Register the schema if the model registry needs it.
4. **Application** (`lib/application/services/`): add methods to an existing service or create a
   new service class with constructor injection. Put workflow and authorization logic here, not
   in controllers. Throw domain errors for invalid states.
5. **HTTP** (`lib/http/controllers/`): add a controller class extending `BaseController`,
   set `requiredRole = "admin"` where appropriate, add a Zod `schema` for request validation,
   and implement `execute()`. Keep it a thin translation layer.
6. **Container** (`lib/container.ts`): construct the new repository, service, and controller,
   and expose them as public readonly fields.
7. **Route** (`app/api/.../route.ts`): add a thin handler that delegates to the controller with
   `handle(req, context)`.
8. **UI** (`app/`, `components/`): add the page or component and call the API through
   `lib/axios.ts`. Reuse the primitives in `components/ui/`. No business rules or Mongoose
   imports here.
9. **Tests** (`tests/unit/`): test domain invariants and the service with
   `InMemory*Repository` fakes. Run `npm test`.
10. **Gates**: run `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build`, then
    verify endpoints with the demo running.

Checklist for a correct change:

- No business logic in `app/api/**/route.ts`, pages, or React components.
- No Mongoose import outside `lib/infrastructure` (and `lib/mongodb.ts`).
- No `any` in `lib/domain` or `lib/application`.
- Services depend on interfaces, not concrete classes.
- New controllers are wired in the container and reached through a thin route.
- Domain invariants are enforced in domain methods and covered by unit tests.
