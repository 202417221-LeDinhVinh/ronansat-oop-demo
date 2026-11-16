import { ScoringStrategy } from "./ScoringStrategy";
import { ScaledScore } from "./ScaledScore";
import { Question } from "../question/Question";
import type { Attempt } from "../attempt/Attempt";

/**
 * Strategy for scoring Sectional SAT Tests (a single section or module).
 * Reports a scaled score strictly on the 200-800 scale.
 * Formula: scaled = 200 + Math.round((600 * correct) / total / 10) * 10
 * Pattern: Strategy Pattern.
 */
export class SectionalScoringStrategy implements ScoringStrategy {
    public score(attempt: Attempt, questions: Question[]): ScaledScore {
        const answersMap = new Map<string, boolean>();
        for (const ans of attempt.answers) {
            answersMap.set(ans.questionId, ans.isCorrect);
        }

        let correctCount = 0;
        const total = questions.length;

        for (const q of questions) {
            if (answersMap.get(q.id) === true) {
                correctCount++;
            }
        }

        const rawScaled = (total > 0 && !isNaN(correctCount))
            ? 200 + Math.round((600 * (correctCount / total)) / 10) * 10
            : 200;
        const boundedRaw = isNaN(rawScaled) ? 200 : rawScaled;
        const scaled = Math.min(800, Math.max(200, boundedRaw));

        const isMath =
            attempt.sectionalSubject?.toLowerCase().includes("math") ||
            (questions.length > 0 && questions[0].section.toLowerCase().includes("math"));

        return new ScaledScore({
            total: scaled,
            sectionScores: {
                readingAndWriting: isMath ? undefined : scaled,
                math: isMath ? scaled : undefined,
            },
            rawCorrectCounts: {
                readingAndWriting: isMath ? 0 : correctCount,
                math: isMath ? correctCount : 0,
                total: correctCount,
            },
            totalQuestions: total,
            isSectional: true,
        });
    }
}
