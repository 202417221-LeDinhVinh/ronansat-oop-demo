import { Entity } from "../shared/Entity";
import { Section } from "./Section";

export interface TestProps {
    id: string;
    title: string;
    timeLimit: number; // total minutes
    difficulty: string;
    sections: Section[];
    questionIds?: string[];
    createdAt?: Date;
}

/**
 * Test aggregate root.
 * Represents an SAT exam containing sections and questions.
 * Pattern: DDD Aggregate Root / Entity.
 */
export class Test extends Entity<string> {
    private _title: string;
    private _timeLimit: number;
    private _difficulty: string;
    private _sections: Section[];
    private _questionIds: string[];
    private readonly _createdAt: Date;

    public constructor(props: TestProps) {
        super(props.id);
        this._title = props.title;
        this._timeLimit = props.timeLimit;
        this._difficulty = props.difficulty;
        this._sections = [...props.sections];
        this._questionIds = [...(props.questionIds ?? [])];
        this._createdAt = props.createdAt ?? new Date();
    }

    public get title(): string {
        return this._title;
    }

    public get timeLimit(): number {
        return this._timeLimit;
    }

    public get difficulty(): string {
        return this._difficulty;
    }

    public get sections(): readonly Section[] {
        return this._sections;
    }

    public get questionIds(): readonly string[] {
        return this._questionIds;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public addQuestionId(questionId: string): void {
        if (!this._questionIds.includes(questionId)) {
            this._questionIds.push(questionId);
        }
    }

    public updateDetails(title: string, timeLimit: number, difficulty: string): void {
        this._title = title.trim();
        this._timeLimit = timeLimit;
        this._difficulty = difficulty;
    }

    public updateSections(sections: Section[]): void {
        this._sections = [...sections];
    }
}
