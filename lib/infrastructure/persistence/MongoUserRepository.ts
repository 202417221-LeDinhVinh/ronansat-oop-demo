import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { IUserRepository } from "../../application/ports/repositories/IUserRepository";
import { User, Student, Admin, Email, Role } from "../../domain/user";
import { UserModel, IUserDoc } from "./schemas/UserSchema";

/**
 * Concrete Mongo Repository for Users.
 * Maps between Mongoose IUserDoc and User/Student/Admin polymorphic entities.
 */
export class MongoUserRepository
    extends MongoRepository<User, IUserDoc>
    implements IUserRepository
{
    protected readonly model: Model<IUserDoc> = UserModel;

    protected toEntity(doc: IUserDoc): User {
        const emailVO = new Email(doc.email);
        const role = doc.role === "admin" ? "admin" : "student";

        if (role === "admin") {
            return new Admin({
                id: doc._id.toString(),
                email: emailVO,
                name: doc.name || doc.email.split("@")[0],
                passwordHash: doc.password || "",
                createdAt: doc.createdAt,
            });
        }

        return new Student({
            id: doc._id.toString(),
            email: emailVO,
            name: doc.name || doc.email.split("@")[0],
            passwordHash: doc.password || "",
            testsTaken: (doc.testsTaken || []).map((t) => t.toString()),
            highestScore: doc.highestScore ?? 0,
            lastTestDate: doc.lastTestDate,
            wrongQuestions: (doc.wrongQuestions || []).map((q) => q.toString()),
            createdAt: doc.createdAt,
        });
    }

    protected toDocument(entity: User): Record<string, unknown> {
        const isStudent = entity instanceof Student;
        const doc: Record<string, unknown> = {
            email: entity.email.value,
            name: entity.name,
            role: entity.role,
            testsTaken: isStudent
                ? (entity as Student).testsTaken.map((id) => new mongoose.Types.ObjectId(id))
                : [],
            highestScore: isStudent ? (entity as Student).highestScore : 0,
            lastTestDate: isStudent ? (entity as Student).lastTestDate : undefined,
            wrongQuestions: isStudent
                ? (entity as Student).wrongQuestions.map((id) => new mongoose.Types.ObjectId(id))
                : [],
        };
        if (entity.passwordHash) {
            doc.password = entity.passwordHash;
        }
        return doc;
    }

    public override async findById(id: string): Promise<User | null> {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        const doc = await this.model.findById(id).select("+password");
        if (!doc) {
            return null;
        }
        return this.toEntity(doc as IUserDoc);
    }

    public async findByEmail(email: string): Promise<User | null> {
        if (!email) return null;
        const normalized = email.trim().toLowerCase();
        const doc = await this.model.findOne({ email: normalized }).select("+password");
        if (!doc) return null;
        return this.toEntity(doc);
    }

    public async findAll(): Promise<User[]> {
        const docs = await this.model.find().sort({ createdAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async updateRole(id: string, role: Role): Promise<User | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        const updated = await this.model.findByIdAndUpdate(
            id,
            { $set: { role } },
            { new: true }
        );
        if (!updated) return null;
        return this.toEntity(updated);
    }

    public async count(): Promise<number> {
        return this.model.countDocuments();
    }
}
