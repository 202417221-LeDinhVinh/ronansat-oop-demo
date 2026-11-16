import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDoc extends Document {
    _id: mongoose.Types.ObjectId;
    name?: string;
    email: string;
    password?: string;
    role: "student" | "admin" | "user";
    testsTaken: mongoose.Types.ObjectId[];
    highestScore: number;
    lastTestDate?: Date;
    wrongQuestions: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
    {
        name: { type: String, required: false },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: false },
        role: { type: String, enum: ["student", "admin", "user"], default: "student" },
        testsTaken: [{ type: Schema.Types.ObjectId, ref: "Test" }],
        highestScore: { type: Number, default: 0 },
        lastTestDate: { type: Date },
        wrongQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    },
    { timestamps: true }
);

export const UserModel: Model<IUserDoc> =
    mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
