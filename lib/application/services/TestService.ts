import { ITestRepository, IQuestionRepository } from "../ports";
import { Test } from "../../domain/test";
import { Question } from "../../domain/question";
import { NotFoundError } from "../../domain/shared";

/**
 * Service managing access to tests and questions for test takers.
 */
export class TestService {
    public constructor(
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository
    ) {}

    public async getAllTests(): Promise<Test[]> {
        return this.testRepo.findAll();
    }

    public async getTestById(id: string): Promise<Test> {
        const test = await this.testRepo.findById(id);
        if (!test) {
            throw new NotFoundError(`Test with id "${id}" not found`);
        }
        return test;
    }

    public async getQuestionsByTestId(
        testId: string,
        options?: { section?: string; module?: number }
    ): Promise<Question[]> {
        await this.getTestById(testId);

        if (options?.section && options?.module !== undefined) {
            return this.questionRepo.findBySectionAndModule(testId, options.section, options.module);
        }

        return this.questionRepo.findByTestId(testId);
    }
}
