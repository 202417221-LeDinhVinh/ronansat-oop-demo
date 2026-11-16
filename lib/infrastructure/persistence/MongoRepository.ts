import mongoose, { Document, Model } from "mongoose";
import { IRepository } from "../../application/ports/repositories/IRepository";
import { Entity } from "../../domain/shared/Entity";

/**
 * Generic abstract base class for Mongoose repositories.
 * Implements standard CRUD operations using the Template Method pattern.
 * Subclasses provide concrete toEntity() and toDocument() mappings.
 *
 * Patterns: Repository Pattern, Template Method Pattern.
 */
export abstract class MongoRepository<
    TEntity extends Entity<string>,
    TDoc extends Document
> implements IRepository<TEntity, string> {
    protected abstract readonly model: Model<TDoc>;

    /**
     * Template Method: Converts raw Mongoose document to domain entity.
     */
    protected abstract toEntity(doc: TDoc): TEntity;

    /**
     * Template Method: Converts domain entity to Mongoose document representation.
     */
    protected abstract toDocument(entity: TEntity): Record<string, unknown>;

    public async findById(id: string): Promise<TEntity | null> {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        const doc = await this.model.findById(id);
        if (!doc) {
            return null;
        }
        return this.toEntity(doc as TDoc);
    }

    public async save(entity: TEntity): Promise<TEntity> {
        const data = this.toDocument(entity);

        if (entity.id && mongoose.Types.ObjectId.isValid(entity.id)) {
            const updated = await this.model.findByIdAndUpdate(
                entity.id,
                { $set: data },
                { new: true, upsert: true }
            );
            return this.toEntity(updated as TDoc);
        }

        // New entity: create document
        const docInstance = new this.model(data);
        const created = await docInstance.save();
        return this.toEntity(created as unknown as TDoc);
    }

    public async delete(id: string): Promise<boolean> {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return false;
        }
        const res = await this.model.findByIdAndDelete(id);
        return !!res;
    }
}
