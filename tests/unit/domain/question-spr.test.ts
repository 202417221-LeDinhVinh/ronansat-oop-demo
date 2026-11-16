import { describe, it, expect } from "vitest";
import { StudentProducedResponseQuestion } from "@/lib/domain/question/StudentProducedResponseQuestion";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { QuestionFactory } from "@/lib/domain/question/QuestionFactory";

describe("Question Polymorphism & SPR Answer Equivalence", () => {
    describe("StudentProducedResponseQuestion (SPR)", () => {
        const sprInteger = new StudentProducedResponseQuestion({
            id: "spr_1",
            testId: "test_1",
            section: "Math",
            module: 1,
            questionText: "What is the value of k?",
            explanation: "k = 28",
            difficulty: "easy",
            points: 10,
            acceptedAnswers: ["28"],
        });

        it("matches exact integer strings", () => {
            expect(sprInteger.isCorrect("28")).toBe(true);
        });

        it("trims surrounding whitespace", () => {
            expect(sprInteger.isCorrect("   28  ")).toBe(true);
        });

        it("rejects wrong numeric values", () => {
            expect(sprInteger.isCorrect("29")).toBe(false);
            expect(sprInteger.isCorrect("-28")).toBe(false);
            expect(sprInteger.isCorrect("")).toBe(false);
        });

        const sprFractionAndDecimal = new StudentProducedResponseQuestion({
            id: "spr_2",
            testId: "test_1",
            section: "Math",
            module: 1,
            questionText: "Find the slope",
            explanation: "5/2 or 2.5",
            difficulty: "medium",
            points: 10,
            acceptedAnswers: ["5/2", "2.5"],
        });

        it("accepts fraction 5/2 when accepted answers include 5/2 and 2.5", () => {
            expect(sprFractionAndDecimal.isCorrect("5/2")).toBe(true);
        });

        it("accepts decimal 2.5 equivalent to 5/2", () => {
            expect(sprFractionAndDecimal.isCorrect("2.5")).toBe(true);
        });

        it("accepts decimal with trailing zeros e.g. 2.50", () => {
            expect(sprFractionAndDecimal.isCorrect("2.50")).toBe(true);
        });

        const sprHalf = new StudentProducedResponseQuestion({
            id: "spr_3",
            testId: "test_1",
            section: "Math",
            module: 2,
            questionText: "What is the probability?",
            explanation: "1/2 or 0.5",
            difficulty: "easy",
            points: 10,
            acceptedAnswers: ["1/2", "0.5"],
        });

        it("accepts .5 without leading zero for 0.5", () => {
            expect(sprHalf.isCorrect(".5")).toBe(true);
            expect(sprHalf.isCorrect("0.5")).toBe(true);
            expect(sprHalf.isCorrect("1/2")).toBe(true);
        });

        const sprNegative = new StudentProducedResponseQuestion({
            id: "spr_4",
            testId: "test_1",
            section: "Math",
            module: 1,
            questionText: "Solve for x",
            explanation: "x = -6",
            difficulty: "medium",
            points: 10,
            acceptedAnswers: ["-6"],
        });

        it("handles negative numbers", () => {
            expect(sprNegative.isCorrect("-6")).toBe(true);
            expect(sprNegative.isCorrect("6")).toBe(false);
        });

        const sprMultiAccepted = new StudentProducedResponseQuestion({
            id: "spr_5",
            testId: "test_1",
            section: "Math",
            module: 2,
            questionText: "Find the ratio",
            explanation: "28/17",
            difficulty: "hard",
            points: 10,
            acceptedAnswers: ["28/17", "1.647", "1.65"],
        });

        it("accepts all College Board accepted variants for repeating fractions", () => {
            expect(sprMultiAccepted.isCorrect("28/17")).toBe(true);
            expect(sprMultiAccepted.isCorrect("1.647")).toBe(true);
            expect(sprMultiAccepted.isCorrect("1.65")).toBe(true);
        });
    });

    describe("MultipleChoiceQuestion (MCQ)", () => {
        const mcq = new MultipleChoiceQuestion({
            id: "mcq_1",
            testId: "test_1",
            section: "Reading and Writing",
            module: 1,
            questionText: "Which choice best summarizes the passage?",
            explanation: "Option B is correct because...",
            difficulty: "medium",
            points: 10,
            choices: [
                "It describes a historical phenomenon.",
                "It contrasts two competing scientific theories.",
                "It defends an outdated philosophical system.",
                "It proposes a novel economic model.",
            ],
            correctAnswer: "It contrasts two competing scientific theories.",
        });

        it("returns true for exact text match", () => {
            expect(mcq.isCorrect("It contrasts two competing scientific theories.")).toBe(true);
        });

        it("returns true for letter match 'B'", () => {
            expect(mcq.isCorrect("B")).toBe(true);
            expect(mcq.isCorrect("b")).toBe(true);
        });

        it("returns false for incorrect choices", () => {
            expect(mcq.isCorrect("A")).toBe(false);
            expect(mcq.isCorrect("C")).toBe(false);
            expect(mcq.isCorrect("It describes a historical phenomenon.")).toBe(false);
        });
    });

    describe("QuestionFactory", () => {
        it("creates MultipleChoiceQuestion when questionType is multiple_choice", () => {
            const q = QuestionFactory.fromPersistence({
                id: "q_1",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "Sample MCQ",
                choices: ["A", "B", "C", "D"],
                correctAnswer: "A",
                questionType: "multiple_choice",
            });
            expect(q).toBeInstanceOf(MultipleChoiceQuestion);
            expect(q.questionType).toBe("multiple_choice");
        });

        it("creates StudentProducedResponseQuestion when questionType is spr", () => {
            const q = QuestionFactory.fromPersistence({
                id: "q_2",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "Sample SPR",
                acceptedAnswers: ["42"],
                questionType: "spr",
            });
            expect(q).toBeInstanceOf(StudentProducedResponseQuestion);
            expect(q.questionType).toBe("spr");
        });

        it("infers StudentProducedResponseQuestion if choices array is empty", () => {
            const q = QuestionFactory.fromPersistence({
                id: "q_3",
                testId: "t_1",
                section: "Math",
                module: 1,
                questionText: "Sample SPR inferred",
                correctAnswer: "12",
            });
            expect(q).toBeInstanceOf(StudentProducedResponseQuestion);
        });
    });
});
