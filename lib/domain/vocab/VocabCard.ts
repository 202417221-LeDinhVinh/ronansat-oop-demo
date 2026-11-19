import { Entity } from "../shared/Entity";
import { ReviewGrade } from "./ReviewGrade";
import { ReviewScheduler } from "./ReviewScheduler";
import { LeitnerScheduler } from "./LeitnerScheduler";

export interface VocabCardProps {
    id: string;
    deckId: string;
    word: string;
    partOfSpeech: string;
    definition: string;
    exampleSentence: string;
    box?: number;
    nextReviewDate?: Date;
    intervalDays?: number;
    reviewCount?: number;
    lastReviewedAt?: Date;
    createdAt?: Date;
}

/**
 * Entity representing an SAT vocabulary flashcard.
 * Encapsulates card contents and Leitner spaced repetition study state.
 */
export class VocabCard extends Entity<string> {
    /**
     * Ch.5 static member: one class-level constant shared by every card.
     * It is not copied into each object; it belongs to the `VocabCard` class itself.
     */
    public static readonly MAX_BOX = 5;

    /**
     * Class-level default collaborator used by the short `review(grade)` overload.
     * It is stateless, so a single shared instance is safe.
     */
    private static readonly DEFAULT_SCHEDULER: ReviewScheduler = new LeitnerScheduler();

    private readonly _deckId: string;
    private _word: string;
    private _partOfSpeech: string;
    private _definition: string;
    private _exampleSentence: string;
    private _box: number;
    private _nextReviewDate: Date;
    private _intervalDays: number;
    private _reviewCount: number;
    private _lastReviewedAt?: Date;
    private readonly _createdAt: Date;

    public constructor(props: VocabCardProps) {
        super(props.id);
        this._deckId = props.deckId;
        this._word = props.word.trim();
        this._partOfSpeech = props.partOfSpeech.trim();
        this._definition = props.definition.trim();
        this._exampleSentence = props.exampleSentence.trim();
        this._box = Math.max(1, Math.min(VocabCard.MAX_BOX, props.box ?? 1));
        this._nextReviewDate = props.nextReviewDate ?? new Date();
        this._intervalDays = props.intervalDays ?? 1;
        this._reviewCount = props.reviewCount ?? 0;
        this._lastReviewedAt = props.lastReviewedAt;
        this._createdAt = props.createdAt ?? new Date();
    }

    public get deckId(): string {
        return this._deckId;
    }

    public get word(): string {
        return this._word;
    }

    public get partOfSpeech(): string {
        return this._partOfSpeech;
    }

    public get definition(): string {
        return this._definition;
    }

    public get exampleSentence(): string {
        return this._exampleSentence;
    }

    /**
     * Ch.5 instance member: every card has its own box value.
     * Compare with the static `MAX_BOX` constant above: `card.box` differs per object.
     */
    public get box(): number {
        return this._box;
    }

    public get nextReviewDate(): Date {
        return this._nextReviewDate;
    }

    public get intervalDays(): number {
        return this._intervalDays;
    }

    public get reviewCount(): number {
        return this._reviewCount;
    }

    public get lastReviewedAt(): Date | undefined {
        return this._lastReviewedAt;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public isDue(now: Date = new Date()): boolean {
        return this._nextReviewDate.getTime() <= now.getTime();
    }

    public updateContent(
        word: string,
        partOfSpeech: string,
        definition: string,
        exampleSentence: string
    ): void {
        this._word = word.trim();
        this._partOfSpeech = partOfSpeech.trim();
        this._definition = definition.trim();
        this._exampleSentence = exampleSentence.trim();
    }

    /**
     * Ch.5 method overloading.
     * Short form for callers that just want the default Leitner scheduler,
     * and full form for the application service, which injects its scheduler and clock.
     */
    public review(grade: ReviewGrade): void;
    public review(grade: ReviewGrade, scheduler: ReviewScheduler, now?: Date): void;
    public review(
        grade: ReviewGrade,
        scheduler: ReviewScheduler = VocabCard.DEFAULT_SCHEDULER,
        now: Date = new Date()
    ): void {
        const result = scheduler.calculateNextReview(this._box, grade, now);
        this._box = Math.max(1, Math.min(VocabCard.MAX_BOX, result.nextBox));
        this._nextReviewDate = result.nextReviewDate;
        this._intervalDays = result.intervalDays;
        this._reviewCount++;
        this._lastReviewedAt = now;
    }
}
