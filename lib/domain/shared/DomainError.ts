/**
 * Base and specialized Domain Error hierarchy.
 * Represents domain rule and invariant violations without leaking infrastructure details.
 *
 * Ch.10: the optional `cause` mirrors Java exception chaining. An outer error keeps a
 * reference to the lower-level error so debugging information is never lost, while the
 * message shown to HTTP clients stays clean.
 */
export abstract class DomainError extends Error {
    public constructor(message: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends DomainError {
    public constructor(message: string) {
        super(message);
    }
}

export class NotFoundError extends DomainError {
    public constructor(message: string) {
        super(message);
    }
}

export class UnauthorizedError extends DomainError {
    public constructor(message = "Authentication required") {
        super(message);
    }
}

export class ForbiddenError extends DomainError {
    public constructor(message = "Access forbidden") {
        super(message);
    }
}

export class ConflictError extends DomainError {
    public constructor(message: string) {
        super(message);
    }
}

export class InvariantViolationError extends DomainError {
    public constructor(message: string) {
        super(message);
    }
}

/**
 * Infrastructure failure translated into a domain error.
 * Ch.10: `cause` carries the original driver/database error (exception chaining).
 * Controllers map this error to a generic HTTP 500 response so internal details never leak.
 */
export class PersistenceError extends DomainError {
    public constructor(message = "Persistence operation failed", cause?: unknown) {
        super(message, { cause });
    }

    /**
     * Wraps any lower-level error while preserving it as the chain cause.
     */
    public static wrap(operation: string, cause: unknown): PersistenceError {
        return new PersistenceError(`Persistence operation failed during ${operation}`, cause);
    }
}
