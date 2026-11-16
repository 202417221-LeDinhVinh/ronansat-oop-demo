import { describe, it, expect, beforeEach } from "vitest";
import {
    InMemoryUserRepository,
    InMemoryTestRepository,
    InMemoryQuestionRepository,
    InMemoryAttemptRepository,
    InMemoryErrorLogRepository,
    InMemoryVocabDeckRepository,
    InMemoryVocabCardRepository,
} from "@/lib/infrastructure/persistence/inmemory/InMemoryRepositories";
import { PasswordHasher } from "@/lib/application/ports/PasswordHasher";
import { Clock } from "@/lib/application/ports/Clock";
import { LeitnerScheduler } from "@/lib/domain/vocab/LeitnerScheduler";
import { AuthService } from "@/lib/application/services/AuthService";
import { TestService } from "@/lib/application/services/TestService";
import { PracticeService } from "@/lib/application/services/PracticeService";
import { ErrorLogService } from "@/lib/application/services/ErrorLogService";
import { VocabService } from "@/lib/application/services/VocabService";
import { AdminService } from "@/lib/application/services/AdminService";
import { Test, Section } from "@/lib/domain/test";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "@/lib/domain/question/StudentProducedResponseQuestion";
import { ErrorLogEntry } from "@/lib/domain/errorlog/ErrorLogEntry";
import { Student } from "@/lib/domain/user/Student";
import { Email } from "@/lib/domain/user/Email";
import {
    ConflictError,
    NotFoundError,
    UnauthorizedError,
} from "@/lib/domain/shared/DomainError";

class FakePasswordHasher implements PasswordHasher {
    public async hash(plain: string): Promise<string> {
        return `hashed_${plain}`;
    }
    public async compare(plain: string, hash: string): Promise<boolean> {
        return hash === `hashed_${plain}`;
    }
}

class FakeClock implements Clock {
    public currentTime: Date = new Date("2026-11-16T12:00:00Z");
    public now(): Date {
        return this.currentTime;
    }
}

describe("Application Layer Services (tested with In-Memory Fakes)", () => {
    let userRepo: InMemoryUserRepository;
    let testRepo: InMemoryTestRepository;
    let questionRepo: InMemoryQuestionRepository;
    let attemptRepo: InMemoryAttemptRepository;
    let errorLogRepo: InMemoryErrorLogRepository;
    let deckRepo: InMemoryVocabDeckRepository;
    let cardRepo: InMemoryVocabCardRepository;
    let hasher: FakePasswordHasher;
    let clock: FakeClock;
    let scheduler: LeitnerScheduler;

    beforeEach(() => {
        userRepo = new InMemoryUserRepository();
        testRepo = new InMemoryTestRepository();
        questionRepo = new InMemoryQuestionRepository();
        attemptRepo = new InMemoryAttemptRepository();
        errorLogRepo = new InMemoryErrorLogRepository();
        deckRepo = new InMemoryVocabDeckRepository();
        cardRepo = new InMemoryVocabCardRepository();
        hasher = new FakePasswordHasher();
        clock = new FakeClock();
        scheduler = new LeitnerScheduler();
    });

    describe("AuthService", () => {
        it("registers a student and stores hashed password", async () => {
            const authService = new AuthService(userRepo, hasher);
            const user = await authService.register({
                name: "Alex",
                email: "alex@example.com",
                password: "Password123!",
            });

            expect(user.id).toBeDefined();
            expect(user.email.value).toBe("alex@example.com");
            expect(user.passwordHash).toBe("hashed_Password123!");
            expect(user.role).toBe("student");
        });

        it("throws ConflictError if email is already taken", async () => {
            const authService = new AuthService(userRepo, hasher);
            await authService.register({
                name: "Alex",
                email: "alex@example.com",
                password: "Password123!",
            });

            await expect(
                authService.register({
                    name: "Alex Dup",
                    email: "ALEX@example.com",
                    password: "Password123!",
                })
            ).rejects.toThrow(ConflictError);
        });

        it("validates credentials and returns authenticated user", async () => {
            const authService = new AuthService(userRepo, hasher);
            await authService.register({
                name: "Alex",
                email: "alex@example.com",
                password: "Password123!",
            });

            const loggedIn = await authService.validateCredentials("alex@example.com", "Password123!");
            expect(loggedIn.email.value).toBe("alex@example.com");

            await expect(
                authService.validateCredentials("alex@example.com", "WrongPassword")
            ).rejects.toThrow(UnauthorizedError);
        });
    });

    describe("TestService", () => {
        it("retrieves tests and questions by test id", async () => {
            const test = new Test({
                id: "t_1",
                title: "Practice Test 1",
                timeLimit: 134,
                difficulty: "medium",
                sections: [new Section({ name: "Math", module: 1, questionsCount: 1, timeLimit: 35 })],
                questionIds: ["q_1"],
            });
            await testRepo.save(test);

            const q1 = new MultipleChoiceQuestion({
                id: "q_1",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "What is 2 + 2?",
                choices: ["2", "3", "4", "5"],
                correctAnswer: "4",
                explanation: "2+2=4",
                difficulty: "easy",
                points: 10,
            });
            await questionRepo.save(q1);

            const testService = new TestService(testRepo, questionRepo);
            const allTests = await testService.getAllTests();
            expect(allTests.length).toBe(1);

            const foundTest = await testService.getTestById("t_1");
            expect(foundTest.title).toBe("Practice Test 1");

            const questions = await testService.getQuestionsByTestId("t_1");
            expect(questions.length).toBe(1);
            expect(questions[0].id).toBe("q_1");
        });

        it("throws NotFoundError when test id does not exist", async () => {
            const testService = new TestService(testRepo, questionRepo);
            await expect(testService.getTestById("nonexistent")).rejects.toThrow(NotFoundError);
        });
    });

    describe("PracticeService", () => {
        it("starts attempt, records answers, and submits with automatic error logging", async () => {
            const student = new Student({
                id: "student_1",
                email: new Email("student@example.com"),
                name: "Student",
                passwordHash: "hash",
            });
            await userRepo.save(student);

            const test = new Test({
                id: "t_1",
                title: "Practice Test 1",
                timeLimit: 134,
                difficulty: "medium",
                sections: [new Section({ name: "Math", module: 1, questionsCount: 2, timeLimit: 35 })],
                questionIds: ["q_1", "q_2"],
            });
            await testRepo.save(test);

            const q1 = new MultipleChoiceQuestion({
                id: "q_1",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "What is 2+2?",
                choices: ["3", "4"],
                correctAnswer: "4",
                explanation: "4",
                difficulty: "easy",
                points: 10,
            });
            const q2 = new StudentProducedResponseQuestion({
                id: "q_2",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "What is 10/2?",
                explanation: "5",
                difficulty: "easy",
                points: 10,
                acceptedAnswers: ["5"],
            });
            await questionRepo.save(q1);
            await questionRepo.save(q2);

            const practiceService = new PracticeService(
                attemptRepo,
                testRepo,
                questionRepo,
                userRepo,
                errorLogRepo,
                clock
            );

            // 1. Start Attempt
            const attempt = await practiceService.startAttempt({
                userId: "student_1",
                testId: "t_1",
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
            });
            expect(attempt.status).toBe("in_progress");

            // 2. Record answer: q1 is correct, q2 is wrong
            const res1 = await practiceService.recordAnswer({
                attemptId: attempt.id,
                userId: "student_1",
                questionId: "q_1",
                answer: "4",
            });
            expect(res1.isCorrect).toBe(true);

            const res2 = await practiceService.recordAnswer({
                attemptId: attempt.id,
                userId: "student_1",
                questionId: "q_2",
                answer: "99",
            });
            expect(res2.isCorrect).toBe(false);

            // 3. Submit Attempt
            const submitted = await practiceService.submitAttempt(attempt.id, "student_1");
            expect(submitted.status).toBe("submitted");
            expect(submitted.score).toBeDefined();

            // 4. Verify Error Log created for q2
            const errorLog = await errorLogRepo.findByUserAndQuestion("student_1", "q_2");
            expect(errorLog).toBeDefined();
            expect(errorLog?.timesMissed).toBe(1);
            expect(errorLog?.status).toBe("open");
        });
    });

    describe("ErrorLogService", () => {
        it("retrieves error logs and retries mistake questions", async () => {
            const q1 = new MultipleChoiceQuestion({
                id: "q_1",
                testId: "t_1",
                section: "Reading and Writing",
                module: 1,
                questionText: "Word in context",
                choices: ["A", "B", "C", "D"],
                correctAnswer: "B",
                explanation: "Exp",
                difficulty: "medium",
                points: 10,
            });
            await questionRepo.save(q1);

            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
                timesMissed: 1,
                status: "open",
            });
            await errorLogRepo.save(entry);

            const errorLogService = new ErrorLogService(errorLogRepo, questionRepo, testRepo, clock);

            // List logs
            const logs = await errorLogService.getErrorLogs("u_1");
            expect(logs.length).toBe(1);

            // Update classification & note
            const updated = await errorLogService.updateEntry("u_1", "err_1", {
                reason: "Misread question",
                note: "Read second paragraph carefully.",
            });
            expect(updated.reason).toBe("Misread question");
            expect(updated.note).toBe("Read second paragraph carefully.");

            // Retry with correct answer
            const retryRes = await errorLogService.retryQuestion("u_1", "err_1", "B");
            expect(retryRes.isCorrect).toBe(true);
            expect(retryRes.entry.status).toBe("resolved");
        });
    });

    describe("VocabService", () => {
        it("creates decks, cards, and executes Leitner reviews", async () => {
            const vocabService = new VocabService(deckRepo, cardRepo, scheduler, clock);

            const deck = await vocabService.createDeck("u_1", {
                title: "SAT Vocab Deck 1",
                description: "Test Deck",
            });
            expect(deck.id).toBeDefined();

            const card = await vocabService.createCard("u_1", deck.id, {
                word: "Ephemeral",
                partOfSpeech: "adjective",
                definition: "Short-lived",
                exampleSentence: "Ephemeral joy.",
            });
            expect(card.box).toBe(1);

            // Review card with 'good'
            const reviewed = await vocabService.reviewCard("u_1", card.id, "good");
            expect(reviewed.box).toBe(2);
            expect(reviewed.reviewCount).toBe(1);
        });
    });

    describe("AdminService", () => {
        it("returns overview metrics and manages tests, questions, and users", async () => {
            const adminService = new AdminService(
                userRepo,
                testRepo,
                questionRepo,
                attemptRepo,
                deckRepo,
                cardRepo
            );

            // Create test
            const test = await adminService.createTest({
                title: "New Admin Test",
                timeLimit: 134,
                difficulty: "hard",
                sections: [{ name: "Math", module: 1, questionsCount: 0, timeLimit: 35 }],
            });
            expect(test.title).toBe("New Admin Test");

            // Create question
            const q = await adminService.createQuestion({
                testId: test.id,
                section: "Math",
                module: 1,
                questionText: "Solve for x",
                choices: ["1", "2"],
                correctAnswer: "1",
                explanation: "x=1",
                difficulty: "easy",
            });
            expect(q.id).toBeDefined();

            // Check metrics
            const metrics = await adminService.getOverviewMetrics();
            expect(metrics.testsCount).toBe(1);
            expect(metrics.questionsCount).toBe(1);

            // User role change
            const student = new Student({
                id: "student_x",
                email: new Email("student_x@example.com"),
                name: "Student X",
                passwordHash: "hash",
            });
            await userRepo.save(student);

            const updatedUser = await adminService.updateUserRole("student_x", "admin");
            expect(updatedUser.role).toBe("admin");
        });
    });
});
