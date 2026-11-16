import { Question, QuestionDifficulty } from "./Question";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "./StudentProducedResponseQuestion";

export interface RawQuestionData {
    id: string;
    testId: string;
    section: string;
    module: number;
    questionText: string;
    passage?: string;
    explanation?: string;
    difficulty?: string;
    points?: number;
    domain?: string;
    skill?: string;
    imageUrl?: string;
    questionType?: "multiple_choice" | "spr";
    choices?: string[];
    correctAnswer?: string;
    acceptedAnswers?: string[];
}

/**
 * Factory for creating Question entities.
 * Encapsulates the instantiation logic for polymorphic Question subclasses.
 * Pattern: Factory Method.
 */
export class QuestionFactory {
    public static fromPersistence(raw: RawQuestionData): Question {
        const difficulty = (raw.difficulty as QuestionDifficulty) || "medium";
        const points = raw.points ?? 10;
        const explanation = raw.explanation ?? "";

        const isSpr =
            raw.questionType === "spr" ||
            (Array.isArray(raw.acceptedAnswers) && raw.acceptedAnswers.length > 0) ||
            (!raw.choices || raw.choices.length === 0);

        if (isSpr) {
            const accepted = raw.acceptedAnswers && raw.acceptedAnswers.length > 0
                ? raw.acceptedAnswers
                : raw.correctAnswer
                ? [raw.correctAnswer]
                : [];

            return new StudentProducedResponseQuestion({
                id: raw.id,
                testId: raw.testId,
                section: raw.section,
                module: raw.module,
                questionText: raw.questionText,
                passage: raw.passage,
                explanation,
                difficulty,
                points,
                domain: raw.domain,
                skill: raw.skill,
                imageUrl: raw.imageUrl,
                acceptedAnswers: accepted,
            });
        }

        return new MultipleChoiceQuestion({
            id: raw.id,
            testId: raw.testId,
            section: raw.section,
            module: raw.module,
            questionText: raw.questionText,
            passage: raw.passage,
            explanation,
            difficulty,
            points,
            domain: raw.domain,
            skill: raw.skill,
            imageUrl: raw.imageUrl,
            choices: raw.choices ?? [],
            correctAnswer: raw.correctAnswer ?? "",
        });
    }
}
