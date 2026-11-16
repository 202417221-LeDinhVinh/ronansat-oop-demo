import { describe, it, expect } from "vitest";
import { Attempt } from "@/lib/domain/attempt/Attempt";
import { FullLengthScoringStrategy } from "@/lib/domain/scoring/FullLengthScoringStrategy";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { InvariantViolationError } from "@/lib/domain/shared/DomainError";

describe("Attempt Aggregate Root & Invariants", () => {
    const dummyQuestions = [
        new MultipleChoiceQuestion({
            id: "q_1",
            testId: "test_1",
            section: "Reading and Writing",
            module: 1,
            questionText: "Text 1",
            explanation: "Exp",
            difficulty: "easy",
            points: 10,
            choices: ["A", "B", "C", "D"],
            correctAnswer: "A",
        }),
        new MultipleChoiceQuestion({
            id: "q_2",
            testId: "test_1",
            section: "Math",
            module: 1,
            questionText: "Text 2",
            explanation: "Exp",
            difficulty: "medium",
            points: 10,
            choices: ["A", "B", "C", "D"],
            correctAnswer: "B",
        }),
    ];

    it("initializes in 'in_progress' status with empty answers", () => {
        const attempt = new Attempt({
            id: "att_1",
            userId: "user_1",
            testId: "test_1",
            mode: "full_length",
        });

        expect(attempt.status).toBe("in_progress");
        expect(attempt.isSubmitted()).toBe(false);
        expect(attempt.answers.length).toBe(0);
        expect(attempt.score).toBeUndefined();
    });

    it("records answers and updates answer records correctly", () => {
        const attempt = new Attempt({
            id: "att_1",
            userId: "user_1",
            testId: "test_1",
            mode: "full_length",
        });

        attempt.recordAnswer("q_1", "A", true);
        expect(attempt.answers.length).toBe(1);
        expect(attempt.answers[0].questionId).toBe("q_1");
        expect(attempt.answers[0].userAnswer).toBe("A");
        expect(attempt.answers[0].isCorrect).toBe(true);

        // Change answer to "B" (incorrect)
        attempt.recordAnswer("q_1", "B", false);
        expect(attempt.answers.length).toBe(1); // deduplicated
        expect(attempt.answers[0].userAnswer).toBe("B");
        expect(attempt.answers[0].isCorrect).toBe(false);
    });

    it("submits attempt, transitions status to submitted, and sets score", () => {
        const attempt = new Attempt({
            id: "att_1",
            userId: "user_1",
            testId: "test_1",
            mode: "full_length",
        });

        attempt.recordAnswer("q_1", "A", true);
        attempt.recordAnswer("q_2", "B", true);

        const strategy = new FullLengthScoringStrategy();
        const score = attempt.submit(strategy, dummyQuestions);

        expect(attempt.status).toBe("submitted");
        expect(attempt.isSubmitted()).toBe(true);
        expect(attempt.submittedAt).toBeDefined();
        expect(attempt.score).toBeDefined();
        expect(score.total).toBeGreaterThanOrEqual(400);
    });

    it("enforces invariant: cannot record answer on a submitted attempt", () => {
        const attempt = new Attempt({
            id: "att_1",
            userId: "user_1",
            testId: "test_1",
            mode: "full_length",
        });

        const strategy = new FullLengthScoringStrategy();
        attempt.submit(strategy, dummyQuestions);

        expect(() => {
            attempt.recordAnswer("q_1", "A", true);
        }).toThrow(InvariantViolationError);
    });

    it("enforces invariant: cannot submit an already submitted attempt", () => {
        const attempt = new Attempt({
            id: "att_1",
            userId: "user_1",
            testId: "test_1",
            mode: "full_length",
        });

        const strategy = new FullLengthScoringStrategy();
        attempt.submit(strategy, dummyQuestions);

        expect(() => {
            attempt.submit(strategy, dummyQuestions);
        }).toThrow(InvariantViolationError);
    });
});
