/**
 * Base and specialized Domain Error hierarchy.
 * Represents domain rule and invariant violations without leaking infrastructure details.
 */
export abstract class DomainError extends Error {
    public constructor(message: string) {
        super(message);
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
