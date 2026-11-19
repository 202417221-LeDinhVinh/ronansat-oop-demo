# OOP Syllabus Checklist (Ch.3 - Ch.13)

Every row names a real file, a symbol that exists in that file, and a unit test under `tests/`.
Run `npm run check:oop` to verify the whole table mechanically. A row with `-` in the test column
is a design-pattern or infrastructure claim that is exercised indirectly rather than by its own
focused test.

## Ch.3 Classes, Objects, and Encapsulation

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Encapsulation and invariants | `lib/domain/attempt/Attempt.ts` | `recordAnswer` | State is private and changes only through intention-revealing methods; a submitted attempt rejects new answers. | `records answers and updates answer records correctly` |
| Value object validation | `lib/domain/user/Email.ts` | `EMAIL_REGEX` | Email normalizes input and rejects malformed addresses in its constructor. | `throws ValidationError for invalid email formats` |
| Shared identity in a base class | `lib/domain/shared/Entity.ts` | `equals` | Every entity inherits identity and identity-based equality. | `compares value objects by value and entities by identity` |

## Ch.4 Constructors and Object Comparison

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Constructor overloading | `lib/domain/scoring/ScaledScore.ts` | `CompleteSectionScores` | Two constructor signatures exist: full props, or section scores plus raw counts. | `builds a ScaledScore from section scores via the overloaded constructor` |
| Value object equality | `lib/domain/shared/ValueObject.ts` | `equals` | Two separately allocated value objects with the same props are equal. | `compares value objects by value and entities by identity` |
| Entity identity equality | `lib/domain/shared/Entity.ts` | `equals` | Two Attempt objects with the same id are equal even when they are different objects. | `compares value objects by value and entities by identity` |

## Ch.5 Method Overloading and Static vs Instance Members

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Method overloading | `lib/domain/vocab/VocabCard.ts` | `public review` | `review(grade)` uses the default scheduler; `review(grade, scheduler, now)` is the injected form. | `reviews a VocabCard with both overloaded review signatures` |
| Static member | `lib/domain/vocab/VocabCard.ts` | `MAX_BOX` | `VocabCard.MAX_BOX` is class-level state shared by every card. | `exposes a static MAX_BOX constant beside the instance box value` |
| Instance member | `lib/domain/vocab/VocabCard.ts` | `public get box` | Every card owns its own box number, separate from other cards. | `exposes a static MAX_BOX constant beside the instance box value` |

## Ch.6 Aggregation vs Composition

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Composition: Test owns Section | `lib/domain/test/Test.ts` | `Composition: a Test owns` | Section value objects are created and destroyed with the test. | `exposes composed sections and aggregated question ids on Test` |
| Composition: Attempt owns AnswerRecord | `lib/domain/attempt/Attempt.ts` | `Composition: AnswerRecord` | Answer records have no meaning outside their attempt. | `records answers and updates answer records correctly` |
| Aggregation: Test references Question by id | `lib/domain/test/Test.ts` | `Aggregation: questions live` | Questions keep their own repository lifecycle and are only referenced by id. | `exposes composed sections and aggregated question ids on Test` |

## Ch.7 Abstract Classes, Interfaces, and Multiple Interfaces

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Abstract class with shared state and template behaviour | `lib/domain/question/Question.ts` | `abstract class Question` | Shared fields plus concrete `describe` and `compareTo`; subclasses implement `isCorrect`. | `dispatches isCorrect polymorphically through a Question array` |
| Multiple capability interfaces | `lib/domain/question/QuestionCapabilities.ts` | `interface Gradable` | Small roles: gradable, describable, and comparable. | `describes and orders questions through Gradable, Describable, and Comparable capabilities` |
| One class implements several interfaces | `lib/domain/question/Question.ts` | `implements Gradable, Describable, Comparable<Question>` | Question fulfils all three capabilities at once. | `describes and orders questions through Gradable, Describable, and Comparable capabilities` |
| Interface used by a service | `lib/application/services/TestService.ts` | `compareTo` | The test-room listing sorts through the Comparable capability. | `orders questions through compareTo inside TestService` |

## Ch.8 Upcasting, Downcasting, and Binding

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Upcasting to a base type | `lib/application/services/PracticeService.ts` | `let questions = await this.questionRepo.findByTestId` | Questions are handled as `Question[]`, never as concrete subclasses. | `starts attempt, records answers, and submits with automatic error logging` |
| Dynamic binding | `lib/domain/question/StudentProducedResponseQuestion.ts` | `isCorrect` | The same call on a `Question` reference runs MCQ or SPR logic depending on the runtime object. | `dispatches isCorrect polymorphically through a Question array` |
| Justified downcast with a type guard | `lib/application/eventhandlers/StudentProgressHandler.ts` | `instanceof Student` | Only a Student has progress fields; the guard makes the narrowing safe and explicit. | `updates student progress and error log through AttemptSubmitted handlers` |

## Ch.9 Generics

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Generic in-memory repository | `lib/infrastructure/persistence/inmemory/InMemoryRepositories.ts` | `abstract class InMemoryRepository` | One generic Map-based CRUD class; thin subclasses add only their extra queries. | `starts attempt, records answers, and submits with automatic error logging` |
| Bounded repository type parameter | `lib/application/ports/repositories/IRepository.ts` | `TEntity extends Entity<TId>` | The repository can only store domain entities. | `retrieves tests and questions by test id` |
| Generic Page container | `lib/domain/shared/Page.ts` | `export class Page` | Carries items plus paging metadata and supports `map<U>`. | `pages and maps items with the generic Page type` |
| Page used by a listing service | `lib/application/services/TestService.ts` | `getTestsPage` | The test listing is built as `Page<Test>` and the array contract is derived from it. | `returns a generic Page from the test listing service` |
| Unknown wildcard analogue | `lib/domain/shared/Entity.ts` | `collectEntityIds` | Accepts any `Entity<unknown>` and reads only the common id. | `collects ids from entities using the Entity<unknown> wildcard helper` |

## Ch.10 Exceptions

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Domain exception hierarchy | `lib/domain/shared/DomainError.ts` | `abstract class DomainError` | Errors are typed domain objects, not raw strings. | `wraps an infrastructure error in PersistenceError with its cause` |
| Exception chaining with cause | `lib/domain/shared/DomainError.ts` | `PersistenceError` | The wrapped driver error is preserved as `cause`. | `wraps an infrastructure error in PersistenceError with its cause` |
| Infrastructure wrapping | `lib/infrastructure/persistence/MongoRepository.ts` | `PersistenceError.wrap` | Mongo driver failures are translated before leaving the repository. | `wraps an infrastructure error in PersistenceError with its cause` |
| Opaque HTTP 500 mapping | `lib/http/errors/HttpErrorMapper.ts` | `PERSISTENCE_ERROR` | The controller pipeline returns 500 without leaking the cause or driver text. | `maps PersistenceError to an opaque HTTP 500 response` |

## Ch.11 Event Handling and the Observer Pattern

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Typed event map | `lib/domain/events/DomainEvents.ts` | `interface DomainEvents` | Event names and payloads are checked at compile time. | `publishes VocabCardReviewed events to subscribers` |
| Observer bus | `lib/domain/events/DomainEventBus.ts` | `public async publish` | Subscribers are awaited before the publisher continues. | `publishes VocabCardReviewed events to subscribers` |
| Student progress subscriber | `lib/application/eventhandlers/StudentProgressHandler.ts` | `StudentProgressHandler` | Updates tests taken, best score, and missed question ids. | `updates student progress and error log through AttemptSubmitted handlers` |
| Error log subscriber | `lib/application/eventhandlers/ErrorLogProjector.ts` | `ErrorLogProjector` | Projects missed questions into the deduplicated error log. | `updates student progress and error log through AttemptSubmitted handlers` |
| Composition-root subscription | `lib/container.ts` | `eventBus.subscribe` | Subscriptions are wired once where all concrete classes are known. | `updates student progress and error log through AttemptSubmitted handlers` |

## Ch.12 Collections and Iteration

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Map-backed collections | `lib/infrastructure/persistence/inmemory/InMemoryRepositories.ts` | `new Map` | In-memory repositories use typed Maps keyed by id. | `starts attempt, records answers, and submits with automatic error logging` |
| Generic collection transformation | `lib/domain/shared/Page.ts` | `map<U>` | Page transforms collections while preserving paging metadata. | `pages and maps items with the generic Page type` |
| Set deduplication | `lib/application/services/ResultService.ts` | `new Set` | Result summaries fetch each distinct test once. | - |

## Ch.13 SOLID Principles

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Single Responsibility | `lib/application/services/PracticeService.ts` | `submitAttempt` | The service owns the submit workflow; scoring, progress, and error-log projection live elsewhere. | `starts attempt, records answers, and submits with automatic error logging` |
| Open/Closed | `lib/domain/scoring/ScoringStrategyFactory.ts` | `getStrategy` | New scoring modes plug in as strategies without editing the attempt aggregate. | `returns SectionalScoringStrategy when mode is sectional` |
| Liskov Substitution | `lib/domain/question/MultipleChoiceQuestion.ts` | `extends Question` | Any question subclass can be used wherever `Question` is expected. | `dispatches isCorrect polymorphically through a Question array` |
| Interface Segregation | `lib/domain/question/QuestionCapabilities.ts` | `interface Describable` | Clients depend on a tiny capability instead of the full question class. | `describes and orders questions through Gradable, Describable, and Comparable capabilities` |
| Dependency Inversion | `lib/application/services/PracticeService.ts` | `private readonly attemptRepo: IAttemptRepository` | The service depends on repository interfaces supplied by the container. | `starts attempt, records answers, and submits with automatic error logging` |

## Design Patterns

| Concept | File | Symbol | Explanation | Test |
| --- | --- | --- | --- | --- |
| Repository | `lib/application/ports/repositories/IRepository.ts` | `interface IRepository` | Persistence is hidden behind a generic interface with Mongo and in-memory implementations. | `retrieves tests and questions by test id` |
| Strategy | `lib/domain/scoring/ScoringStrategy.ts` | `interface ScoringStrategy` | Full-length and sectional scoring are interchangeable algorithms. | `returns FullLengthScoringStrategy when mode is full_length` |
| Factory | `lib/domain/scoring/ScoringStrategyFactory.ts` | `class ScoringStrategyFactory` | The correct strategy is chosen from the test mode. | `returns FullLengthScoringStrategy when mode is full_length` |
| Template Method | `lib/http/BaseController.ts` | `public async handle` | The base class fixes the request pipeline and subclasses implement `execute`. | - |
| Observer | `lib/domain/events/DomainEventBus.ts` | `class DomainEventBus` | Subscribers react to domain events without coupling to the publisher. | `publishes VocabCardReviewed events to subscribers` |
| Composition Root | `lib/container.ts` | `class Container` | One place constructs every repository, service, controller, and subscriber. | - |
| Dependency Injection | `lib/container.ts` | `private constructor()` | Collaborators are passed through constructors and wired once. | - |
