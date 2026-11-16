import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import {
    IErrorLogRepository,
    ErrorLogQueryFilters,
} from "../../application/ports/repositories/IErrorLogRepository";
import { ErrorLogEntry, MistakeReason, ErrorLogStatus } from "../../domain/errorlog";
import { ErrorLogModel, IErrorLogDoc } from "./schemas/ErrorLogSchema";

/**
 * Concrete Mongo Repository for Student Error Log entries.
 */
export class MongoErrorLogRepository
    extends MongoRepository<ErrorLogEntry, IErrorLogDoc>
    implements IErrorLogRepository
{
    protected readonly model: Model<IErrorLogDoc> = ErrorLogModel;

    protected toEntity(doc: IErrorLogDoc): ErrorLogEntry {
        return new ErrorLogEntry({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            questionId: doc.questionId.toString(),
            latestAttemptId: doc.latestAttemptId.toString(),
            timesMissed: doc.timesMissed,
            reason: doc.reason as MistakeReason,
            note: doc.note,
            status: doc.status as ErrorLogStatus,
            lastAttemptedAt: doc.lastAttemptedAt,
            resolvedAt: doc.resolvedAt,
        });
    }

    protected toDocument(entity: ErrorLogEntry): Record<string, unknown> {
        return {
            userId: new mongoose.Types.ObjectId(entity.userId),
            questionId: new mongoose.Types.ObjectId(entity.questionId),
            latestAttemptId: new mongoose.Types.ObjectId(entity.latestAttemptId),
            timesMissed: entity.timesMissed,
            reason: entity.reason,
            note: entity.note,
            status: entity.status,
            lastAttemptedAt: entity.lastAttemptedAt,
            resolvedAt: entity.resolvedAt,
        };
    }

    public async findByUserAndQuestion(
        userId: string,
        questionId: string
    ): Promise<ErrorLogEntry | null> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(questionId)) {
            return null;
        }
        const doc = await this.model.findOne({ userId, questionId });
        if (!doc) return null;
        return this.toEntity(doc);
    }

    public async findByUserId(
        userId: string,
        filters?: ErrorLogQueryFilters
    ): Promise<ErrorLogEntry[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];

        const query: Record<string, unknown> = { userId };
        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.reason) {
            query.reason = filters.reason;
        }

        const docs = await this.model.find(query).sort({ lastAttemptedAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async countOpenByUserId(userId: string): Promise<number> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return 0;
        return this.model.countDocuments({ userId, status: "open" });
    }
}
