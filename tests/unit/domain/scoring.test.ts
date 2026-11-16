import { describe, it, expect } from "vitest";
import { FullLengthScoringStrategy } from "@/lib/domain/scoring/FullLengthScoringStrategy";
import { SectionalScoringStrategy } from "@/lib/domain/scoring/SectionalScoringStrategy";
import { ScoringStrategyFactory } from "@/lib/domain/scoring/ScoringStrategyFactory";
import { ScaledScore } from "@/lib/domain/scoring/ScaledScore";
import { Attempt } from "@/lib/domain/attempt/Attempt";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { InvariantViolationError } from "@/lib/domain/shared/DomainError";

function createDummyQuestion(id: string, section: string, module = 1): MultipleChoiceQuestion {
    return new MultipleChoiceQuestion({
        id,
        testId: "test_1",
        section,
        module,
        questionText: `Question ${id}`,
        explanation: "Exp",
        difficulty: "medium",
        points: 10,
        choices: ["A", "B", "C", "D"],
        correctAnswer: "A",
    });
}

describe("Scoring Strategies & ScaledScore", () => {
    describe("ScaledScore Value Object", () => {
        it("creates valid full-length score within 400-1600 bounds", () => {
            const score = new ScaledScore({
                total: 1540,
                sectionScores: { readingAndWriting: 770, math: 770 },
                rawCorrectCounts: { readingAndWriting: 52, math: 43, total: 95 },
                totalQuestions: 98,
                isSectional: false,
            });

            expect(score.total).toBe(1540);
            expect(score.sectionScores.readingAndWriting).toBe(770);
            expect(score.sectionScores.math).toBe(770);
            expect(score.isSectional).toBe(false);
        });

        it("throws InvariantViolationError when full-length score is below 400", () => {
            expect(() => {
                new ScaledScore({
                    total: 350,
                    sectionScores: {},
                    rawCorrectCounts: { total: 0 },
                    totalQuestions: 98,
                    isSectional: false,
                });
            }).toThrow(InvariantViolationError);
        });

        it("throws InvariantViolationError when full-length score is above 1600", () => {
            expect(() => {
                new ScaledScore({
                    total: 1610,
                    sectionScores: {},
                    rawCorrectCounts: { total: 98 },
                    totalQuestions: 98,
                    isSectional: false,
                });
            }).toThrow(InvariantViolationError);
        });

        it("creates valid sectional score within 200-800 bounds", () => {
            const score = new ScaledScore({
                total: 750,
                sectionScores: { math: 750 },
                rawCorrectCounts: { math: 20, total: 20 },
                totalQuestions: 22,
                isSectional: true,
            });

            expect(score.total).toBe(750);
            expect(score.isSectional).toBe(true);
        });

        it("throws InvariantViolationError when sectional score is below 200", () => {
            expect(() => {
                new ScaledScore({
                    total: 150,
                    sectionScores: {},
                    rawCorrectCounts: { total: 0 },
                    totalQuestions: 27,
                    isSectional: true,
                });
            }).toThrow(InvariantViolationError);
        });

        it("throws InvariantViolationError when sectional score is above 800", () => {
            expect(() => {
                new ScaledScore({
                    total: 820,
                    sectionScores: {},
                    rawCorrectCounts: { total: 27 },
                    totalQuestions: 27,
                    isSectional: true,
                });
            }).toThrow(InvariantViolationError);
        });
    });

    describe("FullLengthScoringStrategy", () => {
        const strategy = new FullLengthScoringStrategy();

        it("computes 1600 perfect score when all questions answered correctly", () => {
            const rwQuestions = Array.from({ length: 54 }, (_, i) =>
                createDummyQuestion(`rw_${i}`, "Reading and Writing")
            );
            const mathQuestions = Array.from({ length: 44 }, (_, i) =>
                createDummyQuestion(`m_${i}`, "Math")
            );
            const allQuestions = [...rwQuestions, ...mathQuestions];

            const attempt = new Attempt({
                id: "att_1",
                userId: "user_1",
                testId: "test_1",
                mode: "full_length",
            });

            for (const q of allQuestions) {
                attempt.recordAnswer(q.id, "A", true);
            }

            const scaled = strategy.score(attempt, allQuestions);
            expect(scaled.total).toBe(1600);
            expect(scaled.sectionScores.readingAndWriting).toBe(800);
            expect(scaled.sectionScores.math).toBe(800);
            expect(scaled.rawCorrectCounts.total).toBe(98);
        });

        it("computes 400 minimum score when all questions are incorrect or omitted", () => {
            const rwQuestions = Array.from({ length: 54 }, (_, i) =>
                createDummyQuestion(`rw_${i}`, "Reading and Writing")
            );
            const mathQuestions = Array.from({ length: 44 }, (_, i) =>
                createDummyQuestion(`m_${i}`, "Math")
            );
            const allQuestions = [...rwQuestions, ...mathQuestions];

            const attempt = new Attempt({
                id: "att_2",
                userId: "user_1",
                testId: "test_1",
                mode: "full_length",
            });

            // No correct answers recorded
            const scaled = strategy.score(attempt, allQuestions);
            expect(scaled.total).toBe(400);
            expect(scaled.sectionScores.readingAndWriting).toBe(200);
            expect(scaled.sectionScores.math).toBe(200);
            expect(scaled.rawCorrectCounts.total).toBe(0);
        });

        it("correctly converts partial raw scores using rounded linear scale", () => {
            const rwQuestions = Array.from({ length: 54 }, (_, i) =>
                createDummyQuestion(`rw_${i}`, "Reading and Writing")
            );
            const mathQuestions = Array.from({ length: 44 }, (_, i) =>
                createDummyQuestion(`m_${i}`, "Math")
            );
            const allQuestions = [...rwQuestions, ...mathQuestions];

            const attempt = new Attempt({
                id: "att_3",
                userId: "user_1",
                testId: "test_1",
                mode: "full_length",
            });

            // 50 / 54 in RW -> scaled = 200 + round(600 * 50 / 54 / 10) * 10 = 200 + round(55.55) * 10 = 760
            for (let i = 0; i < 50; i++) {
                attempt.recordAnswer(rwQuestions[i].id, "A", true);
            }
            // 40 / 44 in Math -> scaled = 200 + round(600 * 40 / 44 / 10) * 10 = 200 + round(54.54) * 10 = 750
            for (let i = 0; i < 40; i++) {
                attempt.recordAnswer(mathQuestions[i].id, "A", true);
            }

            const scaled = strategy.score(attempt, allQuestions);
            expect(scaled.sectionScores.readingAndWriting).toBe(760);
            expect(scaled.sectionScores.math).toBe(750);
            expect(scaled.total).toBe(1510);
        });
    });

    describe("SectionalScoringStrategy", () => {
        const strategy = new SectionalScoringStrategy();

        it("scores single sectional test on 200-800 scale", () => {
            const mathQuestions = Array.from({ length: 22 }, (_, i) =>
                createDummyQuestion(`m_m1_${i}`, "Math")
            );

            const attempt = new Attempt({
                id: "att_sec_1",
                userId: "user_1",
                testId: "test_1",
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
            });

            // Answer 20 out of 22 correctly
            for (let i = 0; i < 20; i++) {
                attempt.recordAnswer(mathQuestions[i].id, "A", true);
            }

            const score = strategy.score(attempt, mathQuestions);
            // 200 + round(600 * (20/22) / 10) * 10 = 200 + round(54.54) * 10 = 750
            expect(score.total).toBe(750);
            expect(score.isSectional).toBe(true);
            expect(score.sectionScores.math).toBe(750);
            expect(score.rawCorrectCounts.total).toBe(20);
        });

        it("never scores below 200 even when 0 questions are answered correctly", () => {
            const rwQuestions = Array.from({ length: 27 }, (_, i) =>
                createDummyQuestion(`rw_m1_${i}`, "Reading and Writing")
            );

            const attempt = new Attempt({
                id: "att_sec_zero",
                userId: "user_1",
                testId: "test_1",
                mode: "sectional",
                sectionalSubject: "Reading and Writing",
                sectionalModule: 1,
            });

            // All questions incorrect
            for (const q of rwQuestions) {
                attempt.recordAnswer(q.id, "Z", false);
            }

            const score = strategy.score(attempt, rwQuestions);
            expect(score.total).toBe(200);
            expect(score.total).toBeGreaterThanOrEqual(200);
            expect(score.sectionScores.readingAndWriting).toBe(200);
            expect(score.rawCorrectCounts.total).toBe(0);
        });

        it("never scores below 200 when no answers are provided (all omitted)", () => {
            const mathQuestions = Array.from({ length: 22 }, (_, i) =>
                createDummyQuestion(`m_m2_${i}`, "Math")
            );

            const attempt = new Attempt({
                id: "att_sec_omitted",
                userId: "user_1",
                testId: "test_1",
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 2,
            });

            const score = strategy.score(attempt, mathQuestions);
            expect(score.total).toBe(200);
            expect(score.total).toBeGreaterThanOrEqual(200);
            expect(score.sectionScores.math).toBe(200);
            expect(score.rawCorrectCounts.total).toBe(0);
        });

        it("never scores below 200 when questions array is empty", () => {
            const attempt = new Attempt({
                id: "att_sec_empty",
                userId: "user_1",
                testId: "test_1",
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
            });

            const score = strategy.score(attempt, []);
            expect(score.total).toBe(200);
            expect(score.total).toBeGreaterThanOrEqual(200);
        });

        it("scores maximum 800 when all questions are correct", () => {
            const mathQuestions = Array.from({ length: 22 }, (_, i) =>
                createDummyQuestion(`m_m1_perf_${i}`, "Math")
            );

            const attempt = new Attempt({
                id: "att_sec_perf",
                userId: "user_1",
                testId: "test_1",
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
            });

            for (const q of mathQuestions) {
                attempt.recordAnswer(q.id, "A", true);
            }

            const score = strategy.score(attempt, mathQuestions);
            expect(score.total).toBe(800);
            expect(score.sectionScores.math).toBe(800);
            expect(score.rawCorrectCounts.total).toBe(22);
        });
    });

    describe("ScoringStrategyFactory", () => {
        it("returns SectionalScoringStrategy when mode is sectional", () => {
            const strategy = ScoringStrategyFactory.getStrategy("sectional");
            expect(strategy).toBeInstanceOf(SectionalScoringStrategy);
        });

        it("returns FullLengthScoringStrategy when mode is full_length", () => {
            const strategy = ScoringStrategyFactory.getStrategy("full_length");
            expect(strategy).toBeInstanceOf(FullLengthScoringStrategy);
        });
    });
});
