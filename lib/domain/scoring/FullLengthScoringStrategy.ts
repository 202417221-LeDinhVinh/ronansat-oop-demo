import { ScoringStrategy } from "./ScoringStrategy";
import { ScaledScore } from "./ScaledScore";
import { Question } from "../question/Question";
import type { Attempt } from "../attempt/Attempt";

/**
 * Strategy for scoring Full-Length SAT Tests.
 * Converts raw correct answers in Reading & Writing (200-800) and Math (200-800)
 * into a composite SAT score (400-1600).
 * Formula: scaled = 200 + Math.round((600 * correct) / total / 10) * 10
 * Pattern: Strategy Pattern.
 */
export class FullLengthScoringStrategy implements ScoringStrategy {
    public score(attempt: Attempt, questions: Question[]): ScaledScore {
        const answersMap = new Map<string, boolean>();
        for (const ans of attempt.answers) {
            answersMap.set(ans.questionId, ans.isCorrect);
        }

        let rwTotal = 0;
        let rwCorrect = 0;
        let mathTotal = 0;
        let mathCorrect = 0;

        for (const q of questions) {
            const isRw = q.section.toLowerCase().includes("reading") || q.section.toLowerCase().includes("verbal");
            const isMath = q.section.toLowerCase().includes("math");
            const correct = answersMap.get(q.id) === true;

            if (isRw) {
                rwTotal++;
                if (correct) rwCorrect++;
            } else if (isMath) {
                mathTotal++;
                if (correct) mathCorrect++;
            }
        }

        const rwScaled = this.calculateSectionScore(rwCorrect, rwTotal);
        const mathScaled = this.calculateSectionScore(mathCorrect, mathTotal);

        // Uses the section-scores constructor overload: the total is rwScaled + mathScaled.
        return new ScaledScore(
            {
                readingAndWriting: rwScaled,
                math: mathScaled,
            },
            {
                readingAndWriting: rwCorrect,
                math: mathCorrect,
                total: rwCorrect + mathCorrect,
            },
            questions.length
        );
    }

    private calculateSectionScore(correct: number, total: number): number {
        if (total <= 0) return 200;
        const rawScaled = 200 + Math.round((600 * (correct / total)) / 10) * 10;
        return Math.min(800, Math.max(200, rawScaled));
    }
}
