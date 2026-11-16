import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { ITestRepository } from "../../application/ports/repositories/ITestRepository";
import { Test, Section } from "../../domain/test";
import { TestModel, ITestDoc } from "./schemas/TestSchema";

/**
 * Concrete Mongo Repository for Tests.
 */
export class MongoTestRepository
    extends MongoRepository<Test, ITestDoc>
    implements ITestRepository
{
    protected readonly model: Model<ITestDoc> = TestModel;

    protected toEntity(doc: ITestDoc): Test {
        const sections = (doc.sections || []).map(
            (s) =>
                new Section({
                    name: s.name,
                    module: s.module,
                    questionsCount: s.questionsCount,
                    timeLimit: s.timeLimit,
                })
        );

        return new Test({
            id: doc._id.toString(),
            title: doc.title,
            timeLimit: doc.timeLimit,
            difficulty: doc.difficulty,
            sections,
            questionIds: (doc.questions || []).map((q) => q.toString()),
            createdAt: doc.createdAt,
        });
    }

    protected toDocument(entity: Test): Record<string, unknown> {
        return {
            title: entity.title,
            timeLimit: entity.timeLimit,
            difficulty: entity.difficulty,
            sections: entity.sections.map((s) => ({
                name: s.name,
                module: s.module,
                questionsCount: s.questionsCount,
                timeLimit: s.timeLimit,
            })),
            questions: entity.questionIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
    }

    public async findAll(): Promise<Test[]> {
        const docs = await this.model.find().sort({ createdAt: -1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async count(): Promise<number> {
        return this.model.countDocuments();
    }
}
