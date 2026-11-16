/**
 * Abstract base class for all domain entities.
 * Encapsulates unique identity and identity-based equality.
 * Pattern: Domain-Driven Design Entity.
 */
export abstract class Entity<TId> {
    protected readonly _id: TId;

    protected constructor(id: TId) {
        this._id = id;
    }

    public get id(): TId {
        return this._id;
    }

    public equals(other?: Entity<TId> | null): boolean {
        if (!other) return false;
        if (this === other) return true;
        return this._id === other._id;
    }
}
