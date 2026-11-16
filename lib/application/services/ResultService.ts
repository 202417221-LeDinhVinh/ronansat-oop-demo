import { IAttemptRepository, ITestRepository, IQuestionRepository } from "../ports";
import { Attempt } from "../../domain/attempt";
import { Test } from "../../domain/test";
import { Question } from "../../domain/question";
import { NotFoundError, ForbiddenError } from "../../domain/shared";

export interface ResultDetailView {
    attempt: Attempt;
    test: Test;
    questions: Question[];
}

export interface UserResultSummary {
    attempt: Attempt;
    testTitle: string;
}

/**
 * Service for retrieving test results and detailed review breakdowns.
 */
export class ResultService {
    public constructor(
        private readonly attemptRepo: IAttemptRepository,
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository
    ) {}

    public async getResultById(attemptId: string, userId: string, isAdmin = false): Promise<ResultDetailView> {
        const attempt = await this.attemptRepo.findById(attemptId);
        if (!attempt) {
            throw new NotFoundError(`Result/Attempt with id "${attemptId}" not found`);
        }
        if (!isAdmin && attempt.userId !== userId) {
            throw new ForbiddenError("Cannot view another user's result");
        }

        const test = await this.testRepo.findById(attempt.testId);
        if (!test) {
            throw new NotFoundError(`Associated test with id "${attempt.testId}" not found`);
        }

        const questions = await this.questionRepo.findByTestId(attempt.testId);

        return {
            attempt,
            test,
            questions,
        };
    }

    public async getUserResults(userId: string): Promise<Attempt[]> {
        const attempts = await this.attemptRepo.findByUserId(userId);
        return attempts.filter((a) => a.isSubmitted());
    }

    public async getUserResultSummaries(userId: string): Promise<UserResultSummary[]> {
        const attempts = await this.attemptRepo.findByUserId(userId);
        const submittedAttempts = attempts.filter((a) => a.isSubmitted());

        const testIds = Array.from(new Set(submittedAttempts.map((a) => a.testId)));
        const tests = await Promise.all(testIds.map((id) => this.testRepo.findById(id)));
        const testMap = new Map<string, string>();
        for (let i = 0; i < testIds.length; i++) {
            if (tests[i]) {
                testMap.set(testIds[i], tests[i]!.title);
            }
        }

        return submittedAttempts.map((attempt) => ({
            attempt,
            testTitle: testMap.get(attempt.testId) || "Official SAT Practice Test",
        }));
    }
}
