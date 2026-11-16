import { ReviewScheduler, ReviewScheduleResult } from "./ReviewScheduler";
import { ReviewGrade } from "./ReviewGrade";

/**
 * Concrete Leitner spaced repetition scheduler.
 * 5 boxes with progressively increasing intervals:
 * Box 1: 1 day
 * Box 2: 3 days
 * Box 3: 7 days
 * Box 4: 14 days
 * Box 5: 30 days
 *
 * Pattern: Strategy Pattern.
 */
export class LeitnerScheduler implements ReviewScheduler {
    private static readonly BOX_INTERVALS: Record<number, number> = {
        1: 1,
        2: 3,
        3: 7,
        4: 14,
        5: 30,
    };

    public calculateNextReview(
        currentBox: number,
        grade: ReviewGrade,
        now: Date = new Date()
    ): ReviewScheduleResult {
        const clampedBox = Math.max(1, Math.min(5, currentBox));
        let nextBox = clampedBox;

        switch (grade) {
            case "again":
                // Failed card: reset to Box 1
                nextBox = 1;
                break;
            case "hard":
                // Difficult: retain in current box (or minimum 1)
                nextBox = Math.max(1, clampedBox);
                break;
            case "good":
                // Normal recall: advance 1 box (max 5)
                nextBox = Math.min(5, clampedBox + 1);
                break;
            case "easy":
                // Instant recall: advance 2 boxes (max 5)
                nextBox = Math.min(5, clampedBox + 2);
                break;
        }

        const intervalDays = LeitnerScheduler.BOX_INTERVALS[nextBox] || 1;
        const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

        return {
            nextBox,
            nextReviewDate,
            intervalDays,
        };
    }
}
