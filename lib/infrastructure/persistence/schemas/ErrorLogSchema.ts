import mongoose, { Schema, Document, Model } from "mongoose";

export interface IErrorLogDoc extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    latestAttemptId: mongoose.Types.ObjectId;
    timesMissed: number;
    reason: string;
    note?: string;
    status: "open" | "resolved";
    lastAttemptedAt: Date;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ErrorLogSchema = new Schema<IErrorLogDoc>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
        latestAttemptId: { type: Schema.Types.ObjectId, ref: "Attempt", required: true },
        timesMissed: { type: Number, default: 1 },
        reason: {
            type: String,
            enum: ["Careless", "Concept gap", "Misread question", "Time pressure", "Guessed", "Unclassified"],
            default: "Unclassified",
        },
        note: { type: String },
        status: { type: String, enum: ["open", "resolved"], default: "open" },
        lastAttemptedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

ErrorLogSchema.index({ userId: 1, questionId: 1 }, { unique: true });
ErrorLogSchema.index({ userId: 1, status: 1 });

export const ErrorLogModel: Model<IErrorLogDoc> =
    mongoose.models.ErrorLog || mongoose.model<IErrorLogDoc>("ErrorLog", ErrorLogSchema);
