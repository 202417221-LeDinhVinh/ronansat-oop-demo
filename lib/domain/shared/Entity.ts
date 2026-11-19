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

/**
 * Ch.9(d): TypeScript analogue of a Java wildcard such as `List<? extends Entity<?>>`.
 *
 * `Entity<unknown>` says "some entity whose id type I do not need to know". The function can
 * accept users, questions, attempts, or any other entity and only reads the common `id` member;
 * it converts the id to a string because every id used by this application is a string.
 */
export function collectEntityIds(entities: readonly Entity<unknown>[]): string[] {
    return entities.map((entity) => String(entity.id));
}
