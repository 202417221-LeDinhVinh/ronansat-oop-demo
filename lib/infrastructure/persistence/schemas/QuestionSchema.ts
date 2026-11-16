import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionDoc extends Document {
    _id: mongoose.Types.ObjectId;
    testId: mongoose.Types.ObjectId;
    section: string;
    module: number;
    questionText: string;
    passage?: string;
    choices: string[];
    correctAnswer?: string;
    acceptedAnswers?: string[];
    questionType: "multiple_choice" | "spr";
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    points: number;
    domain?: string;
    skill?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDoc>(
    {
        testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
        section: { type: String, required: true },
        module: { type: Number, required: true },
        questionText: { type: String, required: true },
        passage: { type: String, required: false },
        choices: [{ type: String }],
        correctAnswer: { type: String, required: false },
        acceptedAnswers: [{ type: String }],
        questionType: { type: String, enum: ["multiple_choice", "spr"], default: "multiple_choice" },
        explanation: { type: String, default: "" },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
        points: { type: Number, default: 10 },
        domain: { type: String },
        skill: { type: String },
        imageUrl: { type: String },
    },
    { timestamps: true }
);

QuestionSchema.index({ testId: 1, section: 1, module: 1 });

export const QuestionModel: Model<IQuestionDoc> =
    mongoose.models.Question || mongoose.model<IQuestionDoc>("Question", QuestionSchema);
