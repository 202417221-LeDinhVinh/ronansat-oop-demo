import { ValueObject } from "../shared/ValueObject";

export interface AnswerRecordProps extends Record<string, unknown> {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    answeredAt: string; // ISO string for immutability
}

/**
 * Value Object capturing an answer given by a student to a specific question.
 */
export class AnswerRecord extends ValueObject<AnswerRecordProps> {
    public constructor(questionId: string, userAnswer: string, isCorrect: boolean, answeredAt: Date = new Date()) {
        super({
            questionId,
            userAnswer,
            isCorrect,
            answeredAt: answeredAt.toISOString(),
        });
    }

    public get questionId(): string {
        return this.props.questionId;
    }

    public get userAnswer(): string {
        return this.props.userAnswer;
    }

    public get isCorrect(): boolean {
        return this.props.isCorrect;
    }

    public get answeredAt(): Date {
        return new Date(this.props.answeredAt);
    }
}
