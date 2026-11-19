import type { Attempt } from "../../domain/attempt/Attempt";
import type { Question } from "../../domain/question/Question";

/**
 * Returns questions that were answered incorrectly or omitted.
 * Shared by both AttemptSubmitted handlers so the rule lives in one place.
 */
export function findMissedQuestions(
    attempt: Attempt,
    questions: readonly Question[]
): Question[] {
    const correctByQuestion = new Map<string, boolean>();
    for (const answer of attempt.answers) {
        correctByQuestion.set(answer.questionId, answer.isCorrect);
    }

    return questions.filter((question) => correctByQuestion.get(question.id) !== true);
}
