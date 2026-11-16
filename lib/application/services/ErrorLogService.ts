import { IErrorLogRepository, IQuestionRepository, ITestRepository, Clock, ErrorLogQueryFilters } from "../ports";
import { ErrorLogEntry, MistakeReason, ErrorLogStatus } from "../../domain/errorlog";
import { Question } from "../../domain/question";
import { Test } from "../../domain/test";
import { NotFoundError, ForbiddenError } from "../../domain/shared";

export interface ErrorLogItemView {
    entry: ErrorLogEntry;
    question: Question;
    testTitle?: string;
}

export interface UpdateErrorLogDTO {
    reason?: MistakeReason;
    note?: string;
    status?: ErrorLogStatus;
}

/**
 * Service managing student error log, mistake classification, notes, and retries.
 */
export class ErrorLogService {
    public constructor(
        private readonly errorLogRepo: IErrorLogRepository,
        private readonly questionRepo: IQuestionRepository,
        private readonly testRepo: ITestRepository,
        private readonly clock: Clock
    ) {}

    public async getErrorLogs(userId: string, filters?: ErrorLogQueryFilters): Promise<ErrorLogItemView[]> {
        const entries = await this.errorLogRepo.findByUserId(userId, filters);
        if (entries.length === 0) return [];

        const questionIds = entries.map((e) => e.questionId);
        const questions = await this.questionRepo.findByIds(questionIds);
        const questionMap = new Map<string, Question>();
        for (const q of questions) {
            questionMap.set(q.id, q);
        }

        const testIds = Array.from(new Set(questions.map((q) => q.testId)));
        const tests = await Promise.all(testIds.map((id) => this.testRepo.findById(id)));
        const testMap = new Map<string, Test>();
        for (const t of tests) {
            if (t) testMap.set(t.id, t);
        }

        const items: ErrorLogItemView[] = [];
        for (const entry of entries) {
            const question = questionMap.get(entry.questionId);
            if (!question) continue;

            // Apply in-memory filters for question attributes if passed
            if (filters?.section && question.section.toLowerCase() !== filters.section.toLowerCase()) {
                continue;
            }
            if (filters?.domain && question.domain?.toLowerCase() !== filters.domain.toLowerCase()) {
                continue;
            }
            if (filters?.skill && question.skill?.toLowerCase() !== filters.skill.toLowerCase()) {
                continue;
            }

            const test = testMap.get(question.testId);
            items.push({
                entry,
                question,
                testTitle: test?.title,
            });
        }

        return items;
    }

    public async updateEntry(
        userId: string,
        entryId: string,
        dto: UpdateErrorLogDTO
    ): Promise<ErrorLogEntry> {
        const entry = await this.errorLogRepo.findById(entryId);
        if (!entry) {
            throw new NotFoundError(`Error log entry with id "${entryId}" not found`);
        }
        if (entry.userId !== userId) {
            throw new ForbiddenError("Cannot edit another user's error log");
        }

        if (dto.reason) {
            entry.tagReason(dto.reason);
        }
        if (dto.note !== undefined) {
            entry.addNote(dto.note);
        }
        if (dto.status === "resolved") {
            entry.markResolved(this.clock.now());
        } else if (dto.status === "open") {
            entry.reopen();
        }

        return this.errorLogRepo.save(entry);
    }

    public async retryQuestion(
        userId: string,
        entryId: string,
        answer: string
    ): Promise<{ isCorrect: boolean; entry: ErrorLogEntry }> {
        const entry = await this.errorLogRepo.findById(entryId);
        if (!entry) {
            throw new NotFoundError(`Error log entry with id "${entryId}" not found`);
        }
        if (entry.userId !== userId) {
            throw new ForbiddenError("Cannot retry another user's error log question");
        }

        const question = await this.questionRepo.findById(entry.questionId);
        if (!question) {
            throw new NotFoundError(`Question with id "${entry.questionId}" not found`);
        }

        const isCorrect = question.isCorrect(answer);
        entry.retry(isCorrect, this.clock.now());

        const saved = await this.errorLogRepo.save(entry);
        return {
            isCorrect,
            entry: saved,
        };
    }
}
