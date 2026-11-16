/**
 * Generic repository interface defining standard CRUD operations.
 * Pattern: Repository Pattern.
 */
export interface IRepository<TEntity, TId> {
    findById(id: TId): Promise<TEntity | null>;
    save(entity: TEntity): Promise<TEntity>;
    delete(id: TId): Promise<boolean>;
}
