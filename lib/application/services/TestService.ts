import { ITestRepository, IQuestionRepository } from "../ports";
import { Test } from "../../domain/test";
import { Question } from "../../domain/question";
import { NotFoundError, Page } from "../../domain/shared";

/**
 * Service managing access to tests and questions for test takers.
 */
export class TestService {
    public constructor(
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository
    ) {}

    public async getAllTests(): Promise<Test[]> {
        // The listing method uses the generic Page<T> container and keeps the public array contract.
        const page = await this.getTestsPage(1, 1000);
        return [...page.items];
    }

    /**
     * Ch.9(c): generic listing result. `Page<Test>` carries the items plus pagination metadata.
     */
    public async getTestsPage(pageNumber: number, pageSize: number): Promise<Page<Test>> {
        const tests = await this.testRepo.findAll();
        return Page.of(tests, pageNumber, pageSize);
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

        const questions =
            options?.section && options?.module !== undefined
                ? await this.questionRepo.findBySectionAndModule(testId, options.section, options.module)
                : await this.questionRepo.findByTestId(testId);

        // Ch.7 / Ch.8: call compareTo through the Comparable capability. The concrete question
        // order is decided by dynamic binding, and the test room receives a stable SAT order.
        return [...questions].sort((a, b) => a.compareTo(b));
    }
}
