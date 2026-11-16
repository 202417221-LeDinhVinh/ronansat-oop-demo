import { Question, QuestionProps, QuestionType } from "./Question";

export interface MultipleChoiceQuestionProps extends QuestionProps {
    choices: string[];
    correctAnswer: string;
}

/**
 * Concrete Multiple Choice Question (MCQ).
 * Holds 4 options (A, B, C, D) and checks correctness against the exact correct answer.
 */
export class MultipleChoiceQuestion extends Question {
    private readonly _choices: string[];
    private readonly _correctAnswer: string;

    public constructor(props: MultipleChoiceQuestionProps) {
        super(props);
        this._choices = [...props.choices];
        this._correctAnswer = props.correctAnswer.trim();
    }

    public get choices(): readonly string[] {
        return this._choices;
    }

    public get correctAnswer(): string {
        return this._correctAnswer;
    }

    public override get questionType(): QuestionType {
        return "multiple_choice";
    }

    /**
     * Checks if the user's choice matches the correct answer.
     * Matches either the direct option text or choice index/letter.
     */
    public override isCorrect(userAnswer: string): boolean {
        if (!userAnswer) return false;
        const trimmed = userAnswer.trim();
        if (trimmed.toLowerCase() === this._correctAnswer.toLowerCase()) {
            return true;
        }

        // Check if user answered option letter A/B/C/D
        const letters = ["A", "B", "C", "D"];
        const correctIndex = this._choices.findIndex(
            (c) => c.trim().toLowerCase() === this._correctAnswer.toLowerCase()
        );
        if (correctIndex !== -1 && trimmed.toUpperCase() === letters[correctIndex]) {
            return true;
        }

        return false;
    }
}
