import { ScaledScore } from "./ScaledScore";
import { Question } from "../question/Question";
import type { Attempt } from "../attempt/Attempt";

/**
 * Strategy interface for scoring SAT attempts.
 * Polymorphic strategies score full-length vs sectional exams.
 * Pattern: Strategy Pattern.
 */
export interface ScoringStrategy {
    score(attempt: Attempt, questions: Question[]): ScaledScore;
}
