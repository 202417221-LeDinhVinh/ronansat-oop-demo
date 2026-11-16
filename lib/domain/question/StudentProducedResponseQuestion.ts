import { Question, QuestionProps, QuestionType } from "./Question";

export interface StudentProducedResponseQuestionProps extends QuestionProps {
    acceptedAnswers: string[];
}

/**
 * Concrete Student Produced Response (SPR) Question.
 * Checks free-form student text inputs against accepted answers.
 * Implements sophisticated equivalence logic for fractions, decimals, and leading zeros.
 * Pattern: Polymorphic Strategy / Subclass.
 */
export class StudentProducedResponseQuestion extends Question {
    private readonly _acceptedAnswers: string[];

    public constructor(props: StudentProducedResponseQuestionProps) {
        super(props);
        this._acceptedAnswers = props.acceptedAnswers.map((a) => a.trim());
    }

    public get acceptedAnswers(): readonly string[] {
        return this._acceptedAnswers;
    }

    public override get questionType(): QuestionType {
        return "spr";
    }

    /**
     * Parses numeric strings including integers, decimals (with or without leading zero),
     * and fractions (e.g. "5/2", "1/3").
     */
    private parseNumeric(input: string): number | null {
        const clean = input.trim().replace(/\s+/g, "");
        if (!clean) return null;

        // Check fraction format "a/b"
        if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(clean)) {
            const parts = clean.split("/");
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (den === 0 || isNaN(num) || isNaN(den)) return null;
            return num / den;
        }

        // Check standard decimal/integer format (e.g. ".5", "-0.75", "28")
        if (/^-?(\d+(\.\d+)?|\.\d+)$/.test(clean)) {
            const val = parseFloat(clean);
            return isNaN(val) ? null : val;
        }

        return null;
    }

    /**
     * Polymorphic verification:
     * 1. Exact string match (ignoring whitespace and case).
     * 2. Numeric equivalence (comparing float values with precision tolerance).
     */
    public override isCorrect(userAnswer: string): boolean {
        if (!userAnswer) return false;
        const trimmed = userAnswer.trim();
        if (!trimmed) return false;

        // 1. Exact or case-insensitive string match
        const lower = trimmed.toLowerCase();
        for (const accepted of this._acceptedAnswers) {
            if (lower === accepted.toLowerCase()) {
                return true;
            }
        }

        // 2. Numeric equivalence
        const userVal = this.parseNumeric(trimmed);
        if (userVal !== null) {
            for (const accepted of this._acceptedAnswers) {
                const acceptedVal = this.parseNumeric(accepted);
                if (acceptedVal !== null) {
                    // Check close match with small tolerance (e.g. 1.647 vs 1.65 vs 28/17)
                    if (Math.abs(userVal - acceptedVal) < 0.005) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
