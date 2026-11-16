import { Entity } from "../shared/Entity";
import { TestMode } from "../test/TestMode";
import { AttemptStatus } from "./AttemptStatus";
import { AnswerRecord } from "./AnswerRecord";
import { ScaledScore } from "../scoring/ScaledScore";
import { ScoringStrategy } from "../scoring/ScoringStrategy";
import { Question } from "../question/Question";
import { InvariantViolationError } from "../shared/DomainError";

export interface AttemptProps {
    id: string;
    userId: string;
    testId: string;
    mode: TestMode;
    sectionalSubject?: string;
    sectionalModule?: number;
    status?: AttemptStatus;
    answers?: AnswerRecord[];
    score?: ScaledScore;
    startedAt?: Date;
    submittedAt?: Date;
}

/**
 * Attempt Aggregate Root.
 * Encapsulates the state of a test sitting, answers recorded, and completion status.
 * Pattern: DDD Aggregate Root / State Pattern.
 */
export class Attempt extends Entity<string> {
    private readonly _userId: string;
    private readonly _testId: string;
    private readonly _mode: TestMode;
    private readonly _sectionalSubject?: string;
    private readonly _sectionalModule?: number;
    private _status: AttemptStatus;
    private _answers: AnswerRecord[];
    private _score?: ScaledScore;
    private readonly _startedAt: Date;
    private _submittedAt?: Date;

    public constructor(props: AttemptProps) {
        super(props.id);
        this._userId = props.userId;
        this._testId = props.testId;
        this._mode = props.mode;
        this._sectionalSubject = props.sectionalSubject;
        this._sectionalModule = props.sectionalModule;
        this._status = props.status ?? "in_progress";
        this._answers = [...(props.answers ?? [])];
        this._score = props.score;
        this._startedAt = props.startedAt ?? new Date();
        this._submittedAt = props.submittedAt;
    }

    public get userId(): string {
        return this._userId;
    }

    public get testId(): string {
        return this._testId;
    }

    public get mode(): TestMode {
        return this._mode;
    }

    public get sectionalSubject(): string | undefined {
        return this._sectionalSubject;
    }

    public get sectionalModule(): number | undefined {
        return this._sectionalModule;
    }

    public get status(): AttemptStatus {
        return this._status;
    }

    public get answers(): readonly AnswerRecord[] {
        return this._answers;
    }

    public get score(): ScaledScore | undefined {
        return this._score;
    }

    public get startedAt(): Date {
        return this._startedAt;
    }

    public get submittedAt(): Date | undefined {
        return this._submittedAt;
    }

    public isSubmitted(): boolean {
        return this._status === "submitted";
    }

    /**
     * Records an answer for a question in this attempt.
     * Enforces the invariant: answers cannot be modified after submission.
     */
    public recordAnswer(
        questionId: string,
        userAnswer: string,
        isCorrect: boolean,
        answeredAt: Date = new Date()
    ): void {
        if (this._status === "submitted") {
            throw new InvariantViolationError("Cannot record answer on a submitted attempt");
        }

        const existingIndex = this._answers.findIndex((a) => a.questionId === questionId);
        const record = new AnswerRecord(questionId, userAnswer, isCorrect, answeredAt);

        if (existingIndex >= 0) {
            this._answers[existingIndex] = record;
        } else {
            this._answers.push(record);
        }
    }

    /**
     * Submits the attempt using the provided scoring strategy.
     * Enforces the invariant: an attempt cannot be submitted more than once.
     */
    public submit(strategy: ScoringStrategy, questions: Question[], submittedAt: Date = new Date()): ScaledScore {
        if (this._status === "submitted") {
            throw new InvariantViolationError("Attempt is already submitted");
        }

        const calculatedScore = strategy.score(this, questions);
        this._score = calculatedScore;
        this._status = "submitted";
        this._submittedAt = submittedAt;

        return calculatedScore;
    }

    /**
     * Internal/mapper hydration to attach a precalculated score.
     */
    public attachScore(score: ScaledScore): void {
        this._score = score;
    }
}
