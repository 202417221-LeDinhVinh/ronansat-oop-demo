import mongoose, { Model } from "mongoose";
import { MongoRepository } from "./MongoRepository";
import { IQuestionRepository } from "../../application/ports/repositories/IQuestionRepository";
import {
    Question,
    QuestionFactory,
    MultipleChoiceQuestion,
    StudentProducedResponseQuestion,
} from "../../domain/question";
import { QuestionModel, IQuestionDoc } from "./schemas/QuestionSchema";

/**
 * Concrete Mongo Repository for Questions.
 * Supports both MultipleChoiceQuestion and StudentProducedResponseQuestion entities.
 */
export class MongoQuestionRepository
    extends MongoRepository<Question, IQuestionDoc>
    implements IQuestionRepository
{
    protected readonly model: Model<IQuestionDoc> = QuestionModel;

    protected toEntity(doc: IQuestionDoc): Question {
        return QuestionFactory.fromPersistence({
            id: doc._id.toString(),
            testId: doc.testId.toString(),
            section: doc.section,
            module: doc.module,
            questionText: doc.questionText,
            passage: doc.passage,
            choices: doc.choices,
            correctAnswer: doc.correctAnswer,
            acceptedAnswers: doc.acceptedAnswers,
            explanation: doc.explanation,
            difficulty: doc.difficulty,
            points: doc.points,
            domain: doc.domain,
            skill: doc.skill,
            imageUrl: doc.imageUrl,
            questionType: doc.questionType,
        });
    }

    protected toDocument(entity: Question): Record<string, unknown> {
        const isMcq = entity instanceof MultipleChoiceQuestion;
        const isSpr = entity instanceof StudentProducedResponseQuestion;

        return {
            testId: new mongoose.Types.ObjectId(entity.testId),
            section: entity.section,
            module: entity.module,
            questionText: entity.questionText,
            passage: entity.passage,
            choices: isMcq ? (entity as MultipleChoiceQuestion).choices : [],
            correctAnswer: isMcq ? (entity as MultipleChoiceQuestion).correctAnswer : undefined,
            acceptedAnswers: isSpr
                ? (entity as StudentProducedResponseQuestion).acceptedAnswers
                : undefined,
            questionType: entity.questionType,
            explanation: entity.explanation,
            difficulty: entity.difficulty,
            points: entity.points,
            domain: entity.domain,
            skill: entity.skill,
            imageUrl: entity.imageUrl,
        };
    }

    public async findByIds(ids: string[]): Promise<Question[]> {
        const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length === 0) return [];
        const docs = await this.model.find({ _id: { $in: validIds } });
        return docs.map((d) => this.toEntity(d));
    }

    public async findByTestId(testId: string): Promise<Question[]> {
        if (!mongoose.Types.ObjectId.isValid(testId)) return [];
        const docs = await this.model.find({ testId }).sort({ module: 1, _id: 1 });
        return docs.map((d) => this.toEntity(d));
    }

    public async findBySectionAndModule(
        testId: string,
        section: string,
        module: number
    ): Promise<Question[]> {
        if (!mongoose.Types.ObjectId.isValid(testId)) return [];
        const docs = await this.model.find({
            testId,
            section: new RegExp(`^${section}$`, "i"),
            module,
        });
        return docs.map((d) => this.toEntity(d));
    }

    public async count(): Promise<number> {
        return this.model.countDocuments();
    }
}
