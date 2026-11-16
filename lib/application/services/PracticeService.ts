import {
    IAttemptRepository,
    ITestRepository,
    IQuestionRepository,
    IUserRepository,
    IErrorLogRepository,
    Clock,
} from "../ports";
import { Attempt, TestMode } from "../../domain";
import { ScoringStrategyFactory } from "../../domain/scoring";
import { ErrorLogEntry } from "../../domain/errorlog";
import { Student } from "../../domain/user";
import { NotFoundError, ForbiddenError, ValidationError } from "../../domain/shared";

export interface StartAttemptDTO {
    userId: string;
    testId: string;
    mode: TestMode;
    sectionalSubject?: string;
    sectionalModule?: number;
}

export interface RecordAnswerDTO {
    attemptId: string;
    userId: string;
    questionId: string;
    answer: string;
}

/**
 * Service managing test attempts lifecycle: start, record answers, submit, score, and error log creation.
 */
export class PracticeService {
    public constructor(
        private readonly attemptRepo: IAttemptRepository,
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository,
        private readonly userRepo: IUserRepository,
        private readonly errorLogRepo: IErrorLogRepository,
        private readonly clock: Clock
    ) {}

    public async startAttempt(dto: StartAttemptDTO): Promise<Attempt> {
        const test = await this.testRepo.findById(dto.testId);
        if (!test) {
            throw new NotFoundError(`Test with id "${dto.testId}" not found`);
        }

        if (dto.mode === "sectional" && !dto.sectionalSubject) {
            throw new ValidationError("Sectional test requires sectionalSubject");
        }

        const now = this.clock.now();
        const attempt = new Attempt({
            id: "", // Will be assigned on save
            userId: dto.userId,
            testId: dto.testId,
            mode: dto.mode,
            sectionalSubject: dto.sectionalSubject,
            sectionalModule: dto.sectionalModule,
            status: "in_progress",
            answers: [],
            startedAt: now,
        });

        return this.attemptRepo.save(attempt);
    }

    public async recordAnswer(dto: RecordAnswerDTO): Promise<{ isCorrect: boolean; attempt: Attempt }> {
        const attempt = await this.attemptRepo.findById(dto.attemptId);
        if (!attempt) {
            throw new NotFoundError(`Attempt with id "${dto.attemptId}" not found`);
        }
        if (attempt.userId !== dto.userId) {
            throw new ForbiddenError("Cannot modify another user's attempt");
        }

        const question = await this.questionRepo.findById(dto.questionId);
        if (!question) {
            throw new NotFoundError(`Question with id "${dto.questionId}" not found`);
        }

        const isCorrect = question.isCorrect(dto.answer);
        attempt.recordAnswer(dto.questionId, dto.answer, isCorrect, this.clock.now());

        await this.attemptRepo.save(attempt);
        return { isCorrect, attempt };
    }

    public async submitAttempt(attemptId: string, userId: string): Promise<Attempt> {
        const attempt = await this.attemptRepo.findById(attemptId);
        if (!attempt) {
            throw new NotFoundError(`Attempt with id "${attemptId}" not found`);
        }
        if (attempt.userId !== userId) {
            throw new ForbiddenError("Cannot submit another user's attempt");
        }

        // Retrieve relevant questions for scoring
        let questions = await this.questionRepo.findByTestId(attempt.testId);
        if (attempt.mode === "sectional") {
            if (attempt.sectionalSubject && attempt.sectionalModule !== undefined) {
                questions = questions.filter(
                    (q) =>
                        q.section.toLowerCase() === attempt.sectionalSubject?.toLowerCase() &&
                        q.module === attempt.sectionalModule
                );
            } else if (attempt.sectionalSubject) {
                questions = questions.filter(
                    (q) => q.section.toLowerCase() === attempt.sectionalSubject?.toLowerCase()
                );
            }
        }

        const strategy = ScoringStrategyFactory.getStrategy(attempt.mode);
        const now = this.clock.now();
        const score = attempt.submit(strategy, questions, now);

        // Persist submitted attempt
        const savedAttempt = await this.attemptRepo.save(attempt);

        // Update student progress (highestScore, testsTaken, lastTestDate)
        const user = await this.userRepo.findById(userId);
        if (user && user instanceof Student) {
            user.recordTestCompletion(attempt.testId, score.total, now);
            await this.userRepo.save(user);
        }

        // Deduplicated Error Log recording for missed or omitted questions
        const answeredMap = new Map<string, { answer: string; isCorrect: boolean }>();
        for (const ans of attempt.answers) {
            answeredMap.set(ans.questionId, { answer: ans.userAnswer, isCorrect: ans.isCorrect });
        }

        for (const q of questions) {
            const recorded = answeredMap.get(q.id);
            const isIncorrectOrOmitted = !recorded || !recorded.isCorrect;

            if (isIncorrectOrOmitted) {
                if (user && user instanceof Student) {
                    user.addWrongQuestion(q.id);
                }

                const existingErrorLog = await this.errorLogRepo.findByUserAndQuestion(userId, q.id);
                if (existingErrorLog) {
                    existingErrorLog.recordNewMistake(attempt.id, now);
                    await this.errorLogRepo.save(existingErrorLog);
                } else {
                    const newLog = new ErrorLogEntry({
                        id: "",
                        userId,
                        questionId: q.id,
                        latestAttemptId: attempt.id,
                        timesMissed: 1,
                        reason: "Unclassified",
                        status: "open",
                        lastAttemptedAt: now,
                    });
                    await this.errorLogRepo.save(newLog);
                }
            }
        }

        if (user && user instanceof Student) {
            await this.userRepo.save(user);
        }

        return savedAttempt;
    }
}
