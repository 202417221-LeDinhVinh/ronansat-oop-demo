/**
 * Ch.7 capability interfaces.
 *
 * Interfaces describe what an object can DO, while the abstract `Question` class holds shared
 * state and template behaviour. A question is gradable, describable, and comparable at the same
 * time, so it implements all three capabilities.
 */
export interface Gradable {
    isCorrect(userAnswer: string): boolean;
}

export interface Describable {
    describe(): string;
}

export interface Comparable<T> {
    compareTo(other: T): number;
}
