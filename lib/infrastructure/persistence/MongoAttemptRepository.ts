import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { IAttemptRepository } from "../../application/ports/repositories/IAttemptRepository";
import { Attempt, AnswerRecord } from "../../domain/attempt";
import { ScaledScore } from "../../domain/scoring";
import { AttemptModel, IAttemptDoc } from "./schemas/AttemptSchema";

/**
 * Concrete Mongo Repository for Attempts (Exam sittings and scores).
 */
export class MongoAttemptRepository
    extends MongoRepository<Attempt, IAttemptDoc>
    implements IAttemptRepository
{
    protected readonly model: Model<IAttemptDoc> = AttemptModel;

    protected toEntity(doc: IAttemptDoc): Attempt {
        const answers = (doc.answers || []).map(
            (a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)
        );

        let scaledScore: ScaledScore | undefined = undefined;
        if (doc.score && doc.score.total !== undefined) {
            scaledScore = new ScaledScore({
                total: doc.score.total,
                sectionScores: doc.score.sectionScores || {},
                rawCorrectCounts: doc.score.rawCorrectCounts || { total: 0 },
                totalQuestions: doc.score.totalQuestions || 0,
                isSectional: doc.score.isSectional ?? doc.mode === "sectional",
            });
        }

        return new Attempt({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            testId: doc.testId.toString(),
            mode: doc.mode,
            sectionalSubject: doc.sectionalSubject,
            sectionalModule: doc.sectionalModule,
            status: doc.status,
            answers,
            score: scaledScore,
            startedAt: doc.startedAt,
            submittedAt: doc.submittedAt,
        });
    }

    protected toDocument(entity: Attempt): Record<string, unknown> {
        return {
            userId: new mongoose.Types.ObjectId(entity.userId),
            testId: new mongoose.Types.ObjectId(entity.testId),
            mode: entity.mode,
            sectionalSubject: entity.sectionalSubject,
            sectionalModule: entity.sectionalModule,
            status: entity.status,
            answers: entity.answers.map((a) => ({
                questionId: new mongoose.Types.ObjectId(a.questionId),
                userAnswer: a.userAnswer,
                isCorrect: a.isCorrect,
                answeredAt: a.answeredAt,
            })),
            score: entity.score
                ? {
                      total: entity.score.total,
                      sectionScores: entity.score.sectionScores,
                      rawCorrectCounts: entity.score.rawCorrectCounts,
                      totalQuestions: entity.score.totalQuestions,
                      isSectional: entity.score.isSectional,
                  }
                : undefined,
            startedAt: entity.startedAt,
            submittedAt: entity.submittedAt,
        };
    }

    public async findByUserId(userId: string): Promise<Attempt[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];
        const docs = await this.model.find({ userId }).sort({ createdAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async countByUserId(userId: string): Promise<number> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return 0;
        return this.model.countDocuments({ userId });
    }

    public async findRecentByUserId(userId: string, limit: number): Promise<Attempt[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];
        const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit);
        return docs.map((d) => this.toEntity(d));
    }

    public async count(): Promise<number> {
        return this.model.countDocuments();
    }
}
