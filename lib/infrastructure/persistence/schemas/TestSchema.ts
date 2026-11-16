import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISectionDoc {
    name: string;
    module: number;
    questionsCount: number;
    timeLimit: number;
}

export interface ITestDoc extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    timeLimit: number;
    difficulty: string;
    sections: ISectionDoc[];
    questions: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const SectionSubSchema = new Schema<ISectionDoc>(
    {
        name: { type: String, required: true },
        module: { type: Number, required: true, default: 1 },
        questionsCount: { type: Number, required: true, default: 0 },
        timeLimit: { type: Number, required: true, default: 32 },
    },
    { _id: false }
);

const TestSchema = new Schema<ITestDoc>(
    {
        title: { type: String, required: true, trim: true },
        timeLimit: { type: Number, required: true, default: 134 },
        difficulty: { type: String, required: true, default: "medium" },
        sections: [SectionSubSchema],
        questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    },
    { timestamps: true }
);

export const TestModel: Model<ITestDoc> =
    mongoose.models.Test || mongoose.model<ITestDoc>("Test", TestSchema);
