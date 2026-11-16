/**
 * Abstract base class for domain Value Objects.
 * Value objects are immutable and compared by structural equality rather than identity.
 * Pattern: Domain-Driven Design Value Object.
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
    protected readonly props: Readonly<TProps>;

    protected constructor(props: TProps) {
        this.props = Object.freeze({ ...props });
    }

    public equals(other?: ValueObject<TProps> | null): boolean {
        if (!other) return false;
        if (this === other) return true;
        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}
