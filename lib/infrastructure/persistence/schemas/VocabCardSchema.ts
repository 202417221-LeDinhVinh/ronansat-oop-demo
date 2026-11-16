import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVocabCardDoc extends Document {
    _id: mongoose.Types.ObjectId;
    deckId: mongoose.Types.ObjectId;
    word: string;
    partOfSpeech: string;
    definition: string;
    exampleSentence: string;
    box: number;
    nextReviewDate: Date;
    intervalDays: number;
    reviewCount: number;
    lastReviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VocabCardSchema = new Schema<IVocabCardDoc>(
    {
        deckId: { type: Schema.Types.ObjectId, ref: "VocabDeck", required: true, index: true },
        word: { type: String, required: true, trim: true },
        partOfSpeech: { type: String, default: "" },
        definition: { type: String, default: "" },
        exampleSentence: { type: String, default: "" },
        box: { type: Number, default: 1, min: 1, max: 5 },
        nextReviewDate: { type: Date, default: Date.now, index: true },
        intervalDays: { type: Number, default: 1 },
        reviewCount: { type: Number, default: 0 },
        lastReviewedAt: { type: Date },
    },
    { timestamps: true }
);

VocabCardSchema.index({ deckId: 1, nextReviewDate: 1 });

export const VocabCardModel: Model<IVocabCardDoc> =
    mongoose.models.VocabCard || mongoose.model<IVocabCardDoc>("VocabCard", VocabCardSchema);
