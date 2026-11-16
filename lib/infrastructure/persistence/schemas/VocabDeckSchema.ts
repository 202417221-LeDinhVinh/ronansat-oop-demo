import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVocabDeckDoc extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    isSystem: boolean;
    ownerId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const VocabDeckSchema = new Schema<IVocabDeckDoc>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        isSystem: { type: Boolean, default: false },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    },
    { timestamps: true }
);

export const VocabDeckModel: Model<IVocabDeckDoc> =
    mongoose.models.VocabDeck || mongoose.model<IVocabDeckDoc>("VocabDeck", VocabDeckSchema);
