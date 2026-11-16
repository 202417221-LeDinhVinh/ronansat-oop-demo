import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { IVocabDeckRepository } from "../../application/ports/repositories/IVocabDeckRepository";
import { VocabDeck } from "../../domain/vocab";
import { VocabDeckModel, IVocabDeckDoc } from "./schemas/VocabDeckSchema";

/**
 * Concrete Mongo Repository for Vocabulary Decks.
 */
export class MongoVocabDeckRepository
    extends MongoRepository<VocabDeck, IVocabDeckDoc>
    implements IVocabDeckRepository
{
    protected readonly model: Model<IVocabDeckDoc> = VocabDeckModel;

    protected toEntity(doc: IVocabDeckDoc): VocabDeck {
        return new VocabDeck({
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description || "",
            isSystem: doc.isSystem ?? false,
            ownerId: doc.ownerId ? doc.ownerId.toString() : undefined,
            cards: [],
            createdAt: doc.createdAt,
        });
    }

    protected toDocument(entity: VocabDeck): Record<string, unknown> {
        return {
            title: entity.title,
            description: entity.description,
            isSystem: entity.isSystem,
            ownerId: entity.ownerId ? new mongoose.Types.ObjectId(entity.ownerId) : undefined,
        };
    }

    public async findAllAvailable(userId?: string): Promise<VocabDeck[]> {
        const query: Record<string, unknown> = {
            $or: [{ isSystem: true }],
        };
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            (query.$or as unknown[]).push({ ownerId: new mongoose.Types.ObjectId(userId) });
        }

        const docs = await this.model.find(query).sort({ isSystem: -1, createdAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async findSystemDecks(): Promise<VocabDeck[]> {
        const docs = await this.model.find({ isSystem: true }).sort({ createdAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async count(): Promise<number> {
        return this.model.countDocuments();
    }
}
