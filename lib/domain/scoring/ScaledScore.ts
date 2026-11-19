import { ValueObject } from "../shared/ValueObject";
import { InvariantViolationError } from "../shared/DomainError";

export interface ScaledSectionScores {
    readingAndWriting?: number;
    math?: number;
}

export interface ScaledRawCorrectCounts {
    readingAndWriting?: number;
    math?: number;
    total: number;
}

export interface ScaledScoreProps extends Record<string, unknown> {
    total: number;
    sectionScores: ScaledSectionScores;
    rawCorrectCounts: ScaledRawCorrectCounts;
    totalQuestions: number;
    isSectional: boolean;
}

export interface CompleteSectionScores {
    readingAndWriting: number;
    math: number;
}

export interface CompleteRawCorrectCounts {
    readingAndWriting: number;
    math: number;
    total: number;
}

/**
 * Value Object representing the scaled SAT score (400-1600 for full test, 200-800 for sectional).
 * Invariant: Score must be within valid SAT bounds.
 *
 * Ch.4 constructor overloading: a full-length score can be built either from a complete props
 * object (used when rehydrating from persistence) or directly from the two section scores
 * (used by `FullLengthScoringStrategy`, where adding the sections is the natural computation).
 */
export class ScaledScore extends ValueObject<ScaledScoreProps> {
    public constructor(props: ScaledScoreProps);
    public constructor(
        sectionScores: CompleteSectionScores,
        rawCorrectCounts: CompleteRawCorrectCounts,
        totalQuestions: number
    );
    public constructor(
        propsOrSectionScores: ScaledScoreProps | CompleteSectionScores,
        rawCorrectCounts?: CompleteRawCorrectCounts,
        totalQuestions?: number
    ) {
        const props = ScaledScore.toProps(propsOrSectionScores, rawCorrectCounts, totalQuestions);
        ScaledScore.validate(props);
        super(props);
    }

    private static isProps(
        value: ScaledScoreProps | CompleteSectionScores
    ): value is ScaledScoreProps {
        return "total" in value && "isSectional" in value;
    }

    private static toProps(
        value: ScaledScoreProps | CompleteSectionScores,
        rawCorrectCounts?: CompleteRawCorrectCounts,
        totalQuestions?: number
    ): ScaledScoreProps {
        if (ScaledScore.isProps(value)) {
            return value;
        }

        if (!rawCorrectCounts || totalQuestions === undefined) {
            throw new InvariantViolationError(
                "Building a ScaledScore from section scores requires raw counts and total questions"
            );
        }

        return {
            total: value.readingAndWriting + value.math,
            sectionScores: value,
            rawCorrectCounts,
            totalQuestions,
            isSectional: false,
        };
    }

    private static validate(props: ScaledScoreProps): void {
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
