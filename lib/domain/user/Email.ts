import { ValueObject } from "../shared/ValueObject";
import { ValidationError } from "../shared/DomainError";

interface EmailProps extends Record<string, unknown> {
    value: string;
}

/**
 * Value Object representing an Email address.
 * Enforces email format invariant and case-insensitivity.
 */
export class Email extends ValueObject<EmailProps> {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    public constructor(value: string) {
        const trimmed = (value || "").trim().toLowerCase();
        if (!Email.EMAIL_REGEX.test(trimmed)) {
            throw new ValidationError(`Invalid email format: "${value}"`);
        }
        super({ value: trimmed });
    }

    public get value(): string {
        return this.props.value;
    }

    public toString(): string {
        return this.props.value;
    }
}
