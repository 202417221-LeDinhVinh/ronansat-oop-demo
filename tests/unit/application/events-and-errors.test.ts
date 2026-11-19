import { describe, it, expect } from "vitest";
import { HttpErrorMapper } from "@/lib/http/errors/HttpErrorMapper";
import { DomainError, PersistenceError } from "@/lib/domain/shared/DomainError";
import {
    DomainEventBus,
    DomainEvents,
    VocabCardReviewedEvent,
} from "@/lib/domain/events";
import { StudentProgressHandler } from "@/lib/application/eventhandlers/StudentProgressHandler";
import { ErrorLogProjector } from "@/lib/application/eventhandlers/ErrorLogProjector";
import { PracticeService } from "@/lib/application/services/PracticeService";
import { VocabService } from "@/lib/application/services/VocabService";
import {
    InMemoryAttemptRepository,
    InMemoryErrorLogRepository,
    InMemoryQuestionRepository,
    InMemoryTestRepository,
    InMemoryUserRepository,
    InMemoryVocabCardRepository,
    InMemoryVocabDeckRepository,
} from "@/lib/infrastructure/persistence/inmemory/InMemoryRepositories";
import { Clock } from "@/lib/application/ports/Clock";
import { LeitnerScheduler } from "@/lib/domain/vocab/LeitnerScheduler";
import { Test, Section } from "@/lib/domain/test";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "@/lib/domain/question/StudentProducedResponseQuestion";
import { Student } from "@/lib/domain/user/Student";
import { Email } from "@/lib/domain/user/Email";
import { VocabDeck, VocabCard } from "@/lib/domain/vocab";

class FixedClock implements Clock {
    public constructor(private readonly value: Date) {}
    public now(): Date {
        return this.value;
    }
}

describe("Ch.10 Exceptions and Exception Chaining", () => {
    it("wraps an infrastructure error in PersistenceError with its cause", () => {
        const original = new Error("socket closed");
        const wrapped = PersistenceError.wrap("save", original);

        expect(wrapped).toBeInstanceOf(DomainError);
        expect(wrapped).toBeInstanceOf(PersistenceError);
        expect(wrapped.cause).toBe(original);
        expect(wrapped.message).toContain("save");

        let caught: unknown;
        try {
            throw wrapped;
        } catch (error) {
            caught = error;
            if (!(error instanceof PersistenceError)) {
                throw error;
            }
            expect(error.cause).toBe(original);
        }
        expect(caught).toBe(wrapped);
        expect(() => {
            throw wrapped;
        }).toThrow(PersistenceError);
    });

    it("maps PersistenceError to an opaque HTTP 500 response", async () => {
        const response = HttpErrorMapper.map(
            PersistenceError.wrap("save", new Error("secret database details"))
        );

        expect(response.status).toBe(500);
        const body = (await response.json()) as { error: string; code: string };
        expect(body.code).toBe("PERSISTENCE_ERROR");
        expect(body.error).toBe("Internal persistence error");
        expect(body.error).not.toContain("secret database details");
    });
});

describe("Ch.11 Observer Event Bus", () => {
    it("updates student progress and error log through AttemptSubmitted handlers", async () => {
        const userRepo = new InMemoryUserRepository();
        const testRepo = new InMemoryTestRepository();
        const questionRepo = new InMemoryQuestionRepository();
        const attemptRepo = new InMemoryAttemptRepository();
        const errorLogRepo = new InMemoryErrorLogRepository();
        const clock = new FixedClock(new Date("2026-11-16T12:00:00Z"));
        const eventBus = new DomainEventBus<DomainEvents>();

        eventBus.subscribe("AttemptSubmitted", new StudentProgressHandler(userRepo));
        eventBus.subscribe("AttemptSubmitted", new ErrorLogProjector(errorLogRepo));

        const student = new Student({
            id: "student_1",
            email: new Email("student@example.com"),
            name: "Student",
            passwordHash: "hash",
        });
        await userRepo.save(student);

        await testRepo.save(
            new Test({
                id: "t_1",
                title: "Practice Test",
                timeLimit: 35,
                difficulty: "medium",
                sections: [
                    new Section({ name: "Math", module: 1, questionsCount: 2, timeLimit: 35 }),
                ],
                questionIds: ["q_1", "q_2"],
            })
        );

        const correctQuestion = new MultipleChoiceQuestion({
            id: "q_1",
            testId: "t_1",
            section: "Math",
            module: 1,
            questionText: "2+2",
            explanation: "4",
            difficulty: "easy",
            points: 10,
            choices: ["3", "4"],
            correctAnswer: "4",
        });
        const missedQuestion = new StudentProducedResponseQuestion({
            id: "q_2",
            testId: "t_1",
            section: "Math",
            module: 1,
            questionText: "10/2",
            explanation: "5",
            difficulty: "easy",
            points: 10,
            acceptedAnswers: ["5"],
        });
        await questionRepo.save(correctQuestion);
        await questionRepo.save(missedQuestion);

        const practiceService = new PracticeService(
            attemptRepo,
            testRepo,
            questionRepo,
            clock,
            eventBus
        );

        const attempt = await practiceService.startAttempt({
            userId: "student_1",
            testId: "t_1",
            mode: "sectional",
            sectionalSubject: "Math",
            sectionalModule: 1,
        });
        await practiceService.recordAnswer({
            attemptId: attempt.id,
            userId: "student_1",
            questionId: "q_1",
            answer: "4",
        });
        const submitted = await practiceService.submitAttempt(attempt.id, "student_1");

        const reloadedStudent = await userRepo.findById("student_1");
        expect(reloadedStudent).toBeInstanceOf(Student);
        const progressed = reloadedStudent as Student;
        expect(progressed.testsTaken).toContain("t_1");
        expect(progressed.highestScore).toBe(submitted.score?.total);
        expect(progressed.wrongQuestions).toContain("q_2");
        expect(progressed.wrongQuestions).not.toContain("q_1");

        const errorLog = await errorLogRepo.findByUserAndQuestion("student_1", "q_2");
        expect(errorLog).not.toBeNull();
        expect(errorLog?.status).toBe("open");
        expect(errorLog?.timesMissed).toBe(1);
        expect(await errorLogRepo.findByUserAndQuestion("student_1", "q_1")).toBeNull();
    });

    it("publishes VocabCardReviewed events to subscribers", async () => {
        const deckRepo = new InMemoryVocabDeckRepository();
        const cardRepo = new InMemoryVocabCardRepository();
        const clock = new FixedClock(new Date("2026-11-16T12:00:00Z"));
        const eventBus = new DomainEventBus<DomainEvents>();
        const received: VocabCardReviewedEvent[] = [];

        eventBus.subscribe("VocabCardReviewed", {
            handle(event) {
                received.push(event);
            },
        });

        const vocabService = new VocabService(
            deckRepo,
            cardRepo,
            new LeitnerScheduler(),
            clock,
            eventBus
        );

        await deckRepo.save(
            new VocabDeck({
                id: "d_1",
                title: "Deck",
                description: "",
                isSystem: false,
                ownerId: "student_1",
            })
        );
        await cardRepo.save(
            new VocabCard({
                id: "c_1",
                deckId: "d_1",
                word: "Ephemeral",
                partOfSpeech: "adjective",
                definition: "Short-lived",
                exampleSentence: "Ephemeral joy.",
            })
        );

        await vocabService.reviewCard("student_1", "c_1", "good");

        expect(received).toHaveLength(1);
        expect(received[0].grade).toBe("good");
        expect(received[0].card.id).toBe("c_1");
        expect(received[0].card.box).toBe(2);
        expect(received[0].reviewedAt).toEqual(clock.now());
    });
});
