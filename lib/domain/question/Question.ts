import { Entity } from "../shared/Entity";

export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "spr";

export interface QuestionProps {
    id: string;
    testId: string;
    section: string;
    module: number;
    questionText: string;
    passage?: string;
    explanation: string;
    difficulty: QuestionDifficulty;
    points: number;
    domain?: string;
    skill?: string;
    imageUrl?: string;
}

/**
 * Abstract base class for questions in RonanSAT.
 * Demonstrates Abstraction and Polymorphism.
 * Pattern: Template Method / Polymorphic Entity.
 */
export abstract class Question extends Entity<string> {
    protected readonly _testId: string;
    protected readonly _section: string;
    protected readonly _module: number;
    protected readonly _questionText: string;
    protected readonly _passage?: string;
    protected readonly _explanation: string;
    protected readonly _difficulty: QuestionDifficulty;
    protected readonly _points: number;
    protected readonly _domain?: string;
    protected readonly _skill?: string;
    protected readonly _imageUrl?: string;

    protected constructor(props: QuestionProps) {
        super(props.id);
        this._testId = props.testId;
        this._section = props.section;
        this._module = props.module;
        this._questionText = props.questionText;
        this._passage = props.passage;
        this._explanation = props.explanation;
        this._difficulty = props.difficulty;
        this._points = props.points;
        this._domain = props.domain;
        this._skill = props.skill;
        this._imageUrl = props.imageUrl;
    }

    public get testId(): string {
        return this._testId;
    }

    public get section(): string {
        return this._section;
    }

    public get module(): number {
        return this._module;
    }

    public get questionText(): string {
        return this._questionText;
    }

    public get passage(): string | undefined {
        return this._passage;
    }

    public get explanation(): string {
        return this._explanation;
    }

    public get difficulty(): QuestionDifficulty {
        return this._difficulty;
    }

    public get points(): number {
        return this._points;
    }

    public get domain(): string | undefined {
        return this._domain;
    }

    public get skill(): string | undefined {
        return this._skill;
    }

    public get imageUrl(): string | undefined {
        return this._imageUrl;
    }

    public abstract get questionType(): QuestionType;

    /**
     * Polymorphic correctness evaluation.
     * Evaluated differently for MCQ vs SPR questions.
     */
    public abstract isCorrect(userAnswer: string): boolean;
}
