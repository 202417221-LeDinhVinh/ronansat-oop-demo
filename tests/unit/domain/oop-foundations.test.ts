import { describe, it, expect } from "vitest";
import { ScaledScore } from "@/lib/domain/scoring/ScaledScore";
import { FullLengthScoringStrategy } from "@/lib/domain/scoring/FullLengthScoringStrategy";
import { Attempt } from "@/lib/domain/attempt/Attempt";
import { VocabCard } from "@/lib/domain/vocab/VocabCard";
import { LeitnerScheduler } from "@/lib/domain/vocab/LeitnerScheduler";
import { Section, Test } from "@/lib/domain/test";
import { MultipleChoiceQuestion } from "@/lib/domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "@/lib/domain/question/StudentProducedResponseQuestion";
import { Question, Gradable, Describable, Comparable } from "@/lib/domain/question";
import { Page } from "@/lib/domain/shared/Page";
import { Entity, collectEntityIds } from "@/lib/domain/shared/Entity";
import { TestService } from "@/lib/application/services/TestService";
import {
    InMemoryQuestionRepository,
    InMemoryTestRepository,
} from "@/lib/infrastructure/persistence/inmemory/InMemoryRepositories";

function createCard(overrides: Partial<ConstructorParameters<typeof VocabCard>[0]> = {}): VocabCard {
    return new VocabCard({
        id: "card_1",
        deckId: "deck_1",
        word: "Ephemeral",
        partOfSpeech: "adjective",
        definition: "Short-lived",
        exampleSentence: "Ephemeral joy.",
        ...overrides,
    });
}

function createMcq(id = "q_mcq"): MultipleChoiceQuestion {
    return new MultipleChoiceQuestion({
        id,
        testId: "test_1",
        section: "Math",
        module: 1,
        questionText: "What is 2 + 2?",
        explanation: "4",
        difficulty: "easy",
        points: 10,
        choices: ["2", "3", "4", "5"],
        correctAnswer: "4",
    });
}

function createSpr(id = "q_spr"): StudentProducedResponseQuestion {
    return new StudentProducedResponseQuestion({
        id,
        testId: "test_1",
        section: "Math",
        module: 2,
        questionText: "Find the slope",
        explanation: "5/2",
        difficulty: "medium",
        points: 10,
        acceptedAnswers: ["5/2", "2.5"],
    });
}

describe("Ch.4 Constructors and Object Comparison", () => {
    it("builds a ScaledScore from section scores via the overloaded constructor", () => {
        const score = new ScaledScore(
            { readingAndWriting: 700, math: 750 },
            { readingAndWriting: 40, math: 42, total: 82 },
            98
        );

        expect(score.total).toBe(1450);
        expect(score.sectionScores.readingAndWriting).toBe(700);
        expect(score.sectionScores.math).toBe(750);
        expect(score.isSectional).toBe(false);

        const strategy = new FullLengthScoringStrategy();
        const attempt = new Attempt({
            id: "att_full",
            userId: "u_1",
            testId: "test_1",
            mode: "full_length",
        });
        for (let i = 0; i < 54; i++) {
            attempt.recordAnswer(`rw_${i}`, "A", true);
        }
        const questions = Array.from({ length: 54 }, (_, i) =>
            new MultipleChoiceQuestion({
                id: `rw_${i}`,
                testId: "test_1",
                section: "Reading and Writing",
                module: 1,
                questionText: "RW",
                explanation: "Exp",
                difficulty: "easy",
                points: 10,
                choices: ["A"],
                correctAnswer: "A",
            })
        );
        expect(strategy.score(attempt, questions).total).toBe(800 + 200);
    });

    it("compares value objects by value and entities by identity", () => {
        const scoreA = new ScaledScore({
            total: 1500,
            sectionScores: { readingAndWriting: 750, math: 750 },
            rawCorrectCounts: { readingAndWriting: 50, math: 40, total: 90 },
            totalQuestions: 98,
            isSectional: false,
        });
        const scoreB = new ScaledScore({
            total: 1500,
            sectionScores: { readingAndWriting: 750, math: 750 },
            rawCorrectCounts: { readingAndWriting: 50, math: 40, total: 90 },
            totalQuestions: 98,
            isSectional: false,
        });

        expect(scoreA === scoreB).toBe(false);
        expect(scoreA.equals(scoreB)).toBe(true);

        const attemptA = new Attempt({ id: "same", userId: "u_1", testId: "t_1", mode: "full_length" });
        const attemptB = new Attempt({ id: "same", userId: "u_1", testId: "t_1", mode: "full_length" });
        const attemptC = new Attempt({ id: "other", userId: "u_1", testId: "t_1", mode: "full_length" });

        expect(attemptA === attemptB).toBe(false);
        expect(attemptA.equals(attemptB)).toBe(true);
        expect(attemptA.equals(attemptC)).toBe(false);
    });
});

describe("Ch.5 Overloading and Static vs Instance Members", () => {
    it("reviews a VocabCard with both overloaded review signatures", () => {
        const card = createCard();
        card.review("good");
        expect(card.box).toBe(2);
        expect(card.reviewCount).toBe(1);
        expect(card.lastReviewedAt).toBeDefined();

        const scheduler = new LeitnerScheduler();
        const now = new Date("2026-11-01T12:00:00Z");
        const secondCard = createCard({ id: "card_2", box: 4 });
        secondCard.review("again", scheduler, now);

        expect(secondCard.box).toBe(1);
        expect(secondCard.reviewCount).toBe(1);
        expect(secondCard.lastReviewedAt).toEqual(now);
    });

    it("exposes a static MAX_BOX constant beside the instance box value", () => {
        expect(VocabCard.MAX_BOX).toBe(5);

        const clamped = createCard({ box: 9 });
        const untouched = createCard({ id: "card_2", box: 1 });

        expect(clamped.box).toBe(VocabCard.MAX_BOX);
        expect(untouched.box).toBe(1);
        expect(clamped.box).not.toBe(untouched.box);
    });
});

describe("Ch.6 Composition and Aggregation", () => {
    it("exposes composed sections and aggregated question ids on Test", () => {
        const section = new Section({
            name: "Math",
            module: 1,
            questionsCount: 1,
            timeLimit: 35,
        });
        const test = new Test({
            id: "test_1",
            title: "Practice",
            timeLimit: 35,
            difficulty: "medium",
            sections: [section],
            questionIds: ["q_1"],
        });

        expect(test.sections[0]).toBe(section);
        expect(test.questionIds).toContain("q_1");
    });
});

describe("Ch.7 Abstract Classes, Interfaces, and Multiple Interfaces", () => {
    it("describes and orders questions through Gradable, Describable, and Comparable capabilities", () => {
        const mathQuestion = createMcq();
        const readingQuestion = new MultipleChoiceQuestion({
            id: "q_rw",
            testId: "test_1",
            section: "Reading and Writing",
            module: 1,
            questionText: "Word in context",
            explanation: "Exp",
            difficulty: "medium",
            points: 10,
            choices: ["A", "B"],
            correctAnswer: "A",
        });

        const gradable: Gradable = mathQuestion;
        const describable: Describable = mathQuestion;
        const comparable: Comparable<Question> = mathQuestion;

        expect(gradable.isCorrect("4")).toBe(true);
        expect(describable.describe()).toContain("choices");
        expect(comparable.compareTo(readingQuestion)).toBeGreaterThan(0);
        expect(mathQuestion.compareTo(readingQuestion)).toBeGreaterThan(0);
        expect(readingQuestion.compareTo(mathQuestion)).toBeLessThan(0);
    });

    it("orders questions through compareTo inside TestService", async () => {
        const testRepo = new InMemoryTestRepository();
        const questionRepo = new InMemoryQuestionRepository();
        await testRepo.save(
            new Test({
                id: "test_1",
                title: "Ordering",
                timeLimit: 35,
                difficulty: "medium",
                sections: [],
                questionIds: [],
            })
        );
        await questionRepo.save(createMcq());
        await questionRepo.save(
            new MultipleChoiceQuestion({
                id: "q_rw",
                testId: "test_1",
                section: "Reading and Writing",
                module: 1,
                questionText: "Reading first",
                explanation: "Exp",
                difficulty: "medium",
                points: 10,
                choices: ["A", "B"],
                correctAnswer: "A",
            })
        );

        const service = new TestService(testRepo, questionRepo);
        const ordered = await service.getQuestionsByTestId("test_1");

        expect(ordered[0].section).toBe("Reading and Writing");
        expect(ordered[1].section).toBe("Math");
    });
});

describe("Ch.8 Upcasting and Dynamic Binding", () => {
    it("dispatches isCorrect polymorphically through a Question array", () => {
        const questions: Question[] = [createMcq(), createSpr()];

        expect(questions[0].isCorrect("4")).toBe(true);
        expect(questions[0].isCorrect("2.5")).toBe(false);
        expect(questions[1].isCorrect("2.5")).toBe(true);
        expect(questions[1].isCorrect("5")).toBe(false);

        expect(questions[0].describe()).toContain("choices");
        expect(questions[1].describe()).toContain("student-produced");
    });
});

describe("Ch.9 Generics", () => {
    it("pages and maps items with the generic Page type", () => {
        const page = Page.of([1, 2, 3, 4, 5], 2, 2);

        expect(page.items).toEqual([3, 4]);
        expect(page.total).toBe(5);
        expect(page.page).toBe(2);
        expect(page.pageSize).toBe(2);
        expect(page.totalPages).toBe(3);

        const labels = page.map((value) => `#${value}`);
        expect(labels.items).toEqual(["#3", "#4"]);
        expect(labels.total).toBe(5);
        expect(labels.page).toBe(2);
    });

    it("collects ids from entities using the Entity<unknown> wildcard helper", () => {
        const entities: Entity<unknown>[] = [createMcq(), createSpr()];

        expect(collectEntityIds(entities)).toEqual(["q_mcq", "q_spr"]);
    });

    it("returns a generic Page from the test listing service", async () => {
        const testRepo = new InMemoryTestRepository();
        await testRepo.save(
            new Test({
                id: "t_1",
                title: "First",
                timeLimit: 35,
                difficulty: "medium",
                sections: [],
            })
        );
        await testRepo.save(
            new Test({
                id: "t_2",
                title: "Second",
                timeLimit: 35,
                difficulty: "medium",
                sections: [],
            })
        );

        const service = new TestService(testRepo, new InMemoryQuestionRepository());
        const page = await service.getTestsPage(1, 1);

        expect(page.total).toBe(2);
        expect(page.items).toHaveLength(1);
        expect(page.totalPages).toBe(2);
    });
});
