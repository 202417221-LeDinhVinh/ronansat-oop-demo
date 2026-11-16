import { Clock } from "../../application/ports/Clock";

/**
 * Standard system clock using wall-clock time.
 */
export class SystemClock implements Clock {
    public now(): Date {
        return new Date();
    }
}
