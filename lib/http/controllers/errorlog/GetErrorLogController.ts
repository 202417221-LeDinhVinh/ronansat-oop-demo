import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { BaseController } from "../../BaseController";
import { ErrorLogService } from "../../../application/services/ErrorLogService";
import { UnauthorizedError } from "../../../domain/shared/DomainError";
import { MultipleChoiceQuestion } from "../../../domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "../../../domain/question/StudentProducedResponseQuestion";

export class GetErrorLogController extends BaseController {
    public constructor(private readonly errorLogService: ErrorLogService) {
        super();
    }

    protected async execute(
        _input: unknown,
        req: NextRequest | Request,
        session: Session | null
    ): Promise<{ entries: unknown[]; totalCount: number }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to access error log");
        }

        const url = new URL(req.url);
        const filters = {
            section: url.searchParams.get("section") || undefined,
            domain: url.searchParams.get("domain") || undefined,
            skill: url.searchParams.get("skill") || undefined,
            reason: url.searchParams.get("reason") || undefined,
            status: url.searchParams.get("status") || undefined,
        };

        const items = await this.errorLogService.getErrorLogs(session.user.id, filters);

        const mapped = items.map((item) => {
            const isMcq = item.question instanceof MultipleChoiceQuestion;
            const isSpr = item.question instanceof StudentProducedResponseQuestion;

            return {
                _id: item.entry.id,
                userId: item.entry.userId,
                latestAttemptId: item.entry.latestAttemptId,
                timesMissed: item.entry.timesMissed,
                reason: item.entry.reason,
                note: item.entry.note,
                status: item.entry.status,
                lastAttemptedAt: item.entry.lastAttemptedAt,
                resolvedAt: item.entry.resolvedAt,
                testTitle: item.testTitle,
                question: {
                    _id: item.question.id,
                    testId: item.question.testId,
                    section: item.question.section,
                    module: item.question.module,
                    questionText: item.question.questionText,
                    passage: item.question.passage,
                    choices: isMcq ? (item.question as MultipleChoiceQuestion).choices : [],
                    correctAnswer: isMcq ? (item.question as MultipleChoiceQuestion).correctAnswer : undefined,
                    acceptedAnswers: isSpr ? (item.question as StudentProducedResponseQuestion).acceptedAnswers : undefined,
                    questionType: item.question.questionType,
                    explanation: item.question.explanation,
                    domain: item.question.domain,
                    skill: item.question.skill,
                    difficulty: item.question.difficulty,
                    imageUrl: item.question.imageUrl,
                },
            };
        });

        return {
            entries: mapped,
            totalCount: mapped.length,
        };
    }
}
