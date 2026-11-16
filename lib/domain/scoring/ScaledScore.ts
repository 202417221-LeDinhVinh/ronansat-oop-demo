import { ValueObject } from "../shared/ValueObject";
import { InvariantViolationError } from "../shared/DomainError";

export interface ScaledScoreProps extends Record<string, unknown> {
    total: number;
    sectionScores: {
        readingAndWriting?: number;
        math?: number;
    };
    rawCorrectCounts: {
        readingAndWriting?: number;
        math?: number;
        total: number;
    };
    totalQuestions: number;
    isSectional: boolean;
}

/**
 * Value Object representing the scaled SAT score (400-1600 for full test, 200-800 for sectional).
 * Invariant: Score must be within valid SAT bounds.
 */
export class ScaledScore extends ValueObject<ScaledScoreProps> {
    public constructor(props: ScaledScoreProps) {
        if (props.isSectional) {
            if (props.total < 200 || props.total > 800) {
                throw new InvariantViolationError(
                    `Sectional scaled score must be between 200 and 800, got ${props.total}`
                );
            }
        } else {
            if (props.total < 400 || props.total > 1600) {
                throw new InvariantViolationError(
                    `Full-length scaled score must be between 400 and 1600, got ${props.total}`
                );
            }
        }
        super(props);
    }

    public get total(): number {
        return this.props.total;
    }

    public get sectionScores(): { readingAndWriting?: number; math?: number } {
        return this.props.sectionScores;
    }

    public get rawCorrectCounts(): { readingAndWriting?: number; math?: number; total: number } {
        return this.props.rawCorrectCounts;
    }

    public get totalQuestions(): number {
        return this.props.totalQuestions;
    }

    public get isSectional(): boolean {
        return this.props.isSectional;
    }
}
