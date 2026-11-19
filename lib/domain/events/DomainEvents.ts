import type { Attempt } from "../attempt/Attempt";
import type { Question } from "../question/Question";
import type { VocabCard } from "../vocab/VocabCard";
import type { ReviewGrade } from "../vocab/ReviewGrade";

/**
 * Ch.11 event definitions.
 * Each entry in the map is the payload carried by one named domain event.
 */
export interface AttemptSubmittedEvent {
    readonly attempt: Attempt;
    readonly questions: readonly Question[];
    readonly occurredAt: Date;
}

export interface VocabCardReviewedEvent {
    readonly card: VocabCard;
    readonly grade: ReviewGrade;
    readonly reviewedAt: Date;
}

export interface DomainEvents {
    AttemptSubmitted: AttemptSubmittedEvent;
    VocabCardReviewed: VocabCardReviewedEvent;
}

export type DomainEventName = keyof DomainEvents;

export type EventHandler<TEvent> = {
    handle(event: TEvent): void | Promise<void>;
};
