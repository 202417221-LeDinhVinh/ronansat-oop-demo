import {
    IAttemptRepository,
    ITestRepository,
    IQuestionRepository,
    Clock,
} from "../ports";
import { Attempt, TestMode } from "../../domain";
import { ScoringStrategyFactory } from "../../domain/scoring";
import { DomainEventBus, DomainEvents } from "../../domain/events";
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
 * Service managing test attempts lifecycle: start, record answers, submit, and score.
 * Ch.11: after a submission it publishes `AttemptSubmitted`; the side effects (student progress
 * and error-log projection) live in Observer subscribers instead of this workflow method.
 */
export class PracticeService {
    public constructor(
        private readonly attemptRepo: IAttemptRepository,
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository,
        private readonly clock: Clock,
        private readonly eventBus: DomainEventBus<DomainEvents>
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
        attempt.submit(strategy, questions, now);

        // Persist submitted attempt
        const savedAttempt = await this.attemptRepo.save(attempt);

        // Ch.11: Observer pattern. Subscribers run synchronously (awaited) before the response,
        // so the API behaves exactly like the old inline side effects.
        await this.eventBus.publish("AttemptSubmitted", {
            attempt: savedAttempt,
            questions,
            occurredAt: now,
        });

        return savedAttempt;
    }
}
