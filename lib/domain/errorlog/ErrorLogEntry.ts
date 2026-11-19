import { Entity } from "../shared/Entity";
import { MistakeReason } from "./MistakeReason";
import { ErrorLogStatus } from "./ErrorLogStatus";

export interface ErrorLogEntryProps {
    id: string;
    userId: string;
    questionId: string;
    latestAttemptId: string;
    timesMissed?: number;
    reason?: MistakeReason;
    note?: string;
    status?: ErrorLogStatus;
    lastAttemptedAt?: Date;
    resolvedAt?: Date;
}

/**
 * Entity representing an entry in a student's error log.
 * Deduplicated per user and question.
 * Tracks mistakes, classification reasons, notes, and retry attempts.
 */
export class ErrorLogEntry extends Entity<string> {
    private readonly _userId: string;
    private readonly _questionId: string;
    /** Aggregation: the entry points at attempts and questions by id; those entities have their own lifecycle. */
    private _latestAttemptId: string;
    private _timesMissed: number;
    private _reason: MistakeReason;
    private _note?: string;
    private _status: ErrorLogStatus;
    private _lastAttemptedAt: Date;
    private _resolvedAt?: Date;

    public constructor(props: ErrorLogEntryProps) {
        super(props.id);
        this._userId = props.userId;
        this._questionId = props.questionId;
        this._latestAttemptId = props.latestAttemptId;
        this._timesMissed = props.timesMissed ?? 1;
        this._reason = props.reason ?? "Unclassified";
        this._note = props.note;
        this._status = props.status ?? "open";
        this._lastAttemptedAt = props.lastAttemptedAt ?? new Date();
        this._resolvedAt = props.resolvedAt;
    }

    public get userId(): string {
        return this._userId;
    }

    public get questionId(): string {
        return this._questionId;
    }

    public get latestAttemptId(): string {
        return this._latestAttemptId;
    }

    public get timesMissed(): number {
        return this._timesMissed;
    }

    public get reason(): MistakeReason {
        return this._reason;
    }

    public get note(): string | undefined {
        return this._note;
    }

    public get status(): ErrorLogStatus {
        return this._status;
    }

    public get lastAttemptedAt(): Date {
        return this._lastAttemptedAt;
    }

    public get resolvedAt(): Date | undefined {
        return this._resolvedAt;
    }

    public isResolved(): boolean {
        return this._status === "resolved";
    }

    public tagReason(reason: MistakeReason): void {
        this._reason = reason;
    }

    public addNote(note: string): void {
        this._note = note.trim();
    }

    public markResolved(resolvedAt: Date = new Date()): void {
        this._status = "resolved";
        this._resolvedAt = resolvedAt;
    }

    public reopen(): void {
        this._status = "open";
        this._resolvedAt = undefined;
    }

    public recordNewMistake(attemptId: string, timestamp: Date = new Date()): void {
        this._latestAttemptId = attemptId;
        this._timesMissed++;
        this._lastAttemptedAt = timestamp;
        this._status = "open";
        this._resolvedAt = undefined;
    }

    /**
     * Retries the mistake question inline.
     * Correct retry automatically marks it resolved.
     * Incorrect retry increments timesMissed.
     */
    public retry(isCorrect: boolean, timestamp: Date = new Date()): boolean {
        this._lastAttemptedAt = timestamp;
        if (isCorrect) {
            this.markResolved(timestamp);
            return true;
        } else {
            this._timesMissed++;
            this._status = "open";
            this._resolvedAt = undefined;
            return false;
        }
    }
}
