import { ScoringStrategy } from "./ScoringStrategy";
import { FullLengthScoringStrategy } from "./FullLengthScoringStrategy";
import { SectionalScoringStrategy } from "./SectionalScoringStrategy";
import { TestMode } from "../test/TestMode";

/**
 * Factory for creating appropriate scoring strategies based on test mode.
 * Pattern: Factory Pattern.
 */
export class ScoringStrategyFactory {
    private static readonly fullLengthStrategy = new FullLengthScoringStrategy();
    private static readonly sectionalStrategy = new SectionalScoringStrategy();

    public static getStrategy(mode: TestMode): ScoringStrategy {
        if (mode === "sectional") {
            return this.sectionalStrategy;
        }
        return this.fullLengthStrategy;
    }
}
