/**
 * Port interface for system time.
 * Inverts dependency on wall-clock time for deterministic testing.
 */
export interface Clock {
    now(): Date;
}
