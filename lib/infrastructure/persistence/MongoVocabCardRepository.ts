import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { IVocabCardRepository } from "../../application/ports/repositories/IVocabCardRepository";
import { VocabCard } from "../../domain/vocab";
import { VocabCardModel, IVocabCardDoc } from "./schemas/VocabCardSchema";

/**
 * Concrete Mongo Repository for Vocabulary Flashcards.
 */
export class MongoVocabCardRepository
    extends MongoRepository<VocabCard, IVocabCardDoc>
    implements IVocabCardRepository
{
    protected readonly model: Model<IVocabCardDoc> = VocabCardModel;

    protected toEntity(doc: IVocabCardDoc): VocabCard {
        return new VocabCard({
            id: doc._id.toString(),
            deckId: doc.deckId.toString(),
            word: doc.word,
            partOfSpeech: doc.partOfSpeech || "",
            definition: doc.definition || "",
            exampleSentence: doc.exampleSentence || "",
            box: doc.box || 1,
            nextReviewDate: doc.nextReviewDate,
            intervalDays: doc.intervalDays || 1,
            reviewCount: doc.reviewCount || 0,
            lastReviewedAt: doc.lastReviewedAt,
            createdAt: doc.createdAt,
        });
    }

    protected toDocument(entity: VocabCard): Record<string, unknown> {
        return {
            deckId: new mongoose.Types.ObjectId(entity.deckId),
            word: entity.word,
            partOfSpeech: entity.partOfSpeech,
            definition: entity.definition,
            exampleSentence: entity.exampleSentence,
            box: entity.box,
            nextReviewDate: entity.nextReviewDate,
            intervalDays: entity.intervalDays,
            reviewCount: entity.reviewCount,
            lastReviewedAt: entity.lastReviewedAt,
        };
    }

    public async findByDeckId(deckId: string): Promise<VocabCard[]> {
        if (!mongoose.Types.ObjectId.isValid(deckId)) return [];
        const docs = await this.model.find({ deckId }).sort({ box: 1, createdAt: 1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async findDueCards(deckIds: string[], now: Date = new Date()): Promise<VocabCard[]> {
        const validDeckIds = deckIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (validDeckIds.length === 0) return [];

        const docs = await this.model
            .find({
                deckId: { $in: validDeckIds },
                nextReviewDate: { $lte: now },
            })
            .sort({ nextReviewDate: 1 });

        return docs.map((d) => this.toEntity(d));
    }

    public async countDueCards(deckIds: string[], now: Date = new Date()): Promise<number> {
        const validDeckIds = deckIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        if (validDeckIds.length === 0) return 0;

        return this.model.countDocuments({
            deckId: { $in: validDeckIds },
            nextReviewDate: { $lte: now },
        });
    }
}
