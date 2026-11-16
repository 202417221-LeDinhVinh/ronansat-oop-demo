import { ValueObject } from "../shared/ValueObject";

export interface SectionProps extends Record<string, unknown> {
    name: string; // "Reading and Writing" | "Math"
    module: number; // 1 or 2
    questionsCount: number;
    timeLimit: number; // in minutes
}

/**
 * Value Object representing a single section module within a SAT Test.
 */
export class Section extends ValueObject<SectionProps> {
    public constructor(props: SectionProps) {
        super(props);
    }

    public get name(): string {
        return this.props.name;
    }

    public get module(): number {
        return this.props.module;
    }

    public get questionsCount(): number {
        return this.props.questionsCount;
    }

    public get timeLimit(): number {
        return this.props.timeLimit;
    }
}
