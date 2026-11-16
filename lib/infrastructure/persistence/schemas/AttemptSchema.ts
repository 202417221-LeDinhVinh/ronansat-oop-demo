import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnswerDoc {
    questionId: mongoose.Types.ObjectId;
    userAnswer: string;
    isCorrect: boolean;
    answeredAt: Date;
}

export interface IAttemptDoc extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    testId: mongoose.Types.ObjectId;
    mode: "full_length" | "sectional";
    sectionalSubject?: string;
    sectionalModule?: number;
    status: "in_progress" | "submitted";
    answers: IAnswerDoc[];
    score?: {
        total: number;
        sectionScores: {
            readingAndWriting?: number;
            math?: number;
        };
        rawCorrectCounts: {
            readingAndWriting?: number;
            math?: number;
            total: number;
        };
        totalQuestions: number;
        isSectional: boolean;
    };
    startedAt: Date;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerDocSchema = new Schema<IAnswerDoc>(
    {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        userAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        answeredAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const AttemptSchema = new Schema<IAttemptDoc>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
        mode: { type: String, enum: ["full_length", "sectional"], default: "full_length" },
        sectionalSubject: { type: String },
        sectionalModule: { type: Number },
        status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
        answers: [AnswerDocSchema],
        score: {
            total: { type: Number },
            sectionScores: {
                readingAndWriting: { type: Number },
                math: { type: Number },
            },
            rawCorrectCounts: {
                readingAndWriting: { type: Number },
                math: { type: Number },
                total: { type: Number },
            },
            totalQuestions: { type: Number },
            isSectional: { type: Boolean },
        },
        startedAt: { type: Date, default: Date.now },
        submittedAt: { type: Date },
    },
    { timestamps: true }
);

AttemptSchema.index({ userId: 1, createdAt: -1 });

export const AttemptModel: Model<IAttemptDoc> =
    mongoose.models.Attempt || mongoose.model<IAttemptDoc>("Attempt", AttemptSchema);
