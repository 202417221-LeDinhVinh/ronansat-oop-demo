import { User, UserProps } from "./User";

export interface StudentProps extends Omit<UserProps, "role"> {
    testsTaken?: string[];
    highestScore?: number;
    lastTestDate?: Date;
    wrongQuestions?: string[];
}

/**
 * Concrete Student entity.
 * Represents a student taking tests, reviewing mistakes, and studying flashcards.
 */
export class Student extends User {
    private _testsTaken: string[];
    private _highestScore: number;
    private _lastTestDate?: Date;
    private _wrongQuestions: string[];

    public constructor(props: StudentProps) {
        super({ ...props, role: "student" });
        this._testsTaken = [...(props.testsTaken ?? [])];
        this._highestScore = props.highestScore ?? 0;
        this._lastTestDate = props.lastTestDate;
        this._wrongQuestions = [...(props.wrongQuestions ?? [])];
    }

    public get testsTaken(): readonly string[] {
        return this._testsTaken;
    }

    public get highestScore(): number {
        return this._highestScore;
    }

    public override get bestScore(): number {
        return this._highestScore;
    }

    public get lastTestDate(): Date | undefined {
        return this._lastTestDate;
    }

    public override get lastAssessmentDate(): Date | undefined {
        return this._lastTestDate;
    }

    public get wrongQuestions(): readonly string[] {
        return this._wrongQuestions;
    }

    public recordTestCompletion(testId: string, score: number, testDate: Date = new Date()): void {
        this._testsTaken.push(testId);
        if (score > this._highestScore) {
            this._highestScore = score;
        }
        this._lastTestDate = testDate;
    }

    public addWrongQuestion(questionId: string): void {
        if (!this._wrongQuestions.includes(questionId)) {
            this._wrongQuestions.push(questionId);
        }
    }

    public override canAccessAdmin(): boolean {
        return false;
    }
}
