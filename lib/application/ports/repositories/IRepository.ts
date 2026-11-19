import { Entity } from "../../../domain/shared/Entity";

/**
 * Generic repository interface defining standard CRUD operations.
 * Ch.9(b): bounded type parameter - only domain entities may be stored, so `save` can rely on
 * the identity and equality behaviour inherited from `Entity<TId>`.
 * Pattern: Repository Pattern.
 */
export interface IRepository<TEntity extends Entity<TId>, TId = string> {
    findById(id: TId): Promise<TEntity | null>;
    save(entity: TEntity): Promise<TEntity>;
    delete(id: TId): Promise<boolean>;
}
