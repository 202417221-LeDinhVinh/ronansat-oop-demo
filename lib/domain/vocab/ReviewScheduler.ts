import { ReviewGrade } from "./ReviewGrade";

export interface ReviewScheduleResult {
    nextBox: number;
    nextReviewDate: Date;
    intervalDays: number;
}

/**
 * Strategy interface for flashcard spaced repetition scheduling.
 * Pattern: Strategy Pattern.
 */
export interface ReviewScheduler {
    calculateNextReview(currentBox: number, grade: ReviewGrade, now?: Date): ReviewScheduleResult;
}
