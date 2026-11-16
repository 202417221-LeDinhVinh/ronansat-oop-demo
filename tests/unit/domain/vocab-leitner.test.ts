import { describe, it, expect } from "vitest";
import { LeitnerScheduler } from "@/lib/domain/vocab/LeitnerScheduler";
import { VocabCard } from "@/lib/domain/vocab/VocabCard";
import { VocabDeck } from "@/lib/domain/vocab/VocabDeck";

describe("Leitner Spaced Repetition Scheduling & Vocab", () => {
    const scheduler = new LeitnerScheduler();
    const fixedNow = new Date("2026-11-01T12:00:00Z");

    describe("LeitnerScheduler", () => {
        it("grade 'again' resets any box back to Box 1 with 1 day interval", () => {
            const resBox3 = scheduler.calculateNextReview(3, "again", fixedNow);
            expect(resBox3.nextBox).toBe(1);
            expect(resBox3.intervalDays).toBe(1);
            expect(resBox3.nextReviewDate.getTime()).toBe(
                fixedNow.getTime() + 1 * 24 * 60 * 60 * 1000
            );

            const resBox5 = scheduler.calculateNextReview(5, "again", fixedNow);
            expect(resBox5.nextBox).toBe(1);
            expect(resBox5.intervalDays).toBe(1);
        });

        it("grade 'hard' stays in current box with current box interval", () => {
            const res = scheduler.calculateNextReview(3, "hard", fixedNow);
            expect(res.nextBox).toBe(3);
            expect(res.intervalDays).toBe(7); // Box 3 interval = 7 days
        });

        it("grade 'good' advances 1 box up to maximum Box 5", () => {
            const res1 = scheduler.calculateNextReview(1, "good", fixedNow);
            expect(res1.nextBox).toBe(2);
            expect(res1.intervalDays).toBe(3);

            const res2 = scheduler.calculateNextReview(2, "good", fixedNow);
            expect(res2.nextBox).toBe(3);
            expect(res2.intervalDays).toBe(7);

            const res3 = scheduler.calculateNextReview(3, "good", fixedNow);
            expect(res3.nextBox).toBe(4);
            expect(res3.intervalDays).toBe(14);

            const res4 = scheduler.calculateNextReview(4, "good", fixedNow);
            expect(res4.nextBox).toBe(5);
            expect(res4.intervalDays).toBe(30);

            // Clamped at Box 5
            const res5 = scheduler.calculateNextReview(5, "good", fixedNow);
            expect(res5.nextBox).toBe(5);
            expect(res5.intervalDays).toBe(30);
        });

        it("grade 'easy' advances 2 boxes up to maximum Box 5", () => {
            const res1 = scheduler.calculateNextReview(1, "easy", fixedNow);
            expect(res1.nextBox).toBe(3);
            expect(res1.intervalDays).toBe(7);

            const res3 = scheduler.calculateNextReview(3, "easy", fixedNow);
            expect(res3.nextBox).toBe(5);
            expect(res3.intervalDays).toBe(30);

            const res4 = scheduler.calculateNextReview(4, "easy", fixedNow);
            expect(res4.nextBox).toBe(5);
            expect(res4.intervalDays).toBe(30);
        });
    });

    describe("VocabCard Entity", () => {
        it("initializes with default Box 1 and 0 reviews", () => {
            const card = new VocabCard({
                id: "c_1",
                deckId: "d_1",
                word: "Ephemeral",
                partOfSpeech: "adjective",
                definition: "Lasting a short time",
                exampleSentence: "Ephemeral beauty.",
            });

            expect(card.word).toBe("Ephemeral");
            expect(card.box).toBe(1);
            expect(card.reviewCount).toBe(0);
            expect(card.lastReviewedAt).toBeUndefined();
        });

        it("review() updates box, review count, and next review date", () => {
            const card = new VocabCard({
                id: "c_1",
                deckId: "d_1",
                word: "Ephemeral",
                partOfSpeech: "adjective",
                definition: "Lasting a short time",
                exampleSentence: "Ephemeral beauty.",
            });

            card.review("good", scheduler, fixedNow);
            expect(card.box).toBe(2);
            expect(card.reviewCount).toBe(1);
            expect(card.intervalDays).toBe(3);
            expect(card.lastReviewedAt).toEqual(fixedNow);
        });

        it("correctly identifies if card is due today", () => {
            const dueCard = new VocabCard({
                id: "c_due",
                deckId: "d_1",
                word: "Anachronism",
                partOfSpeech: "noun",
                definition: "Something misplaced in time",
                exampleSentence: "Anachronism.",
                nextReviewDate: new Date("2026-10-31T00:00:00Z"),
            });

            const notDueCard = new VocabCard({
                id: "c_future",
                deckId: "d_1",
                word: "Ubiquitous",
                partOfSpeech: "adjective",
                definition: "Found everywhere",
                exampleSentence: "Ubiquitous phones.",
                nextReviewDate: new Date("2026-11-15T00:00:00Z"),
            });

            expect(dueCard.isDue(fixedNow)).toBe(true);
            expect(notDueCard.isDue(fixedNow)).toBe(false);
        });
    });

    describe("VocabDeck Aggregate Root", () => {
        it("manages cards and counts due cards accurately", () => {
            const deck = new VocabDeck({
                id: "d_1",
                title: "Test Deck",
                description: "Description",
                isSystem: true,
            });

            const card1 = new VocabCard({
                id: "c_1",
                deckId: "d_1",
                word: "Word 1",
                partOfSpeech: "n",
                definition: "Def 1",
                exampleSentence: "Ex 1",
                nextReviewDate: new Date("2026-10-30T00:00:00Z"), // due
            });

            const card2 = new VocabCard({
                id: "c_2",
                deckId: "d_1",
                word: "Word 2",
                partOfSpeech: "v",
                definition: "Def 2",
                exampleSentence: "Ex 2",
                nextReviewDate: new Date("2026-11-20T00:00:00Z"), // not due
            });

            deck.addCard(card1);
            deck.addCard(card2);

            expect(deck.cards.length).toBe(2);
            expect(deck.countDueCards(fixedNow)).toBe(1);

            deck.removeCard("c_1");
            expect(deck.cards.length).toBe(1);
            expect(deck.countDueCards(fixedNow)).toBe(0);
        });
    });
});
