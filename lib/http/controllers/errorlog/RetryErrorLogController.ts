import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { ErrorLogService } from "../../../application/services/ErrorLogService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";

const retrySchema = z.object({
    answer: z.string().optional(),
    userAnswer: z.string().optional(),
});

type RetryInput = z.infer<typeof retrySchema>;

export class RetryErrorLogController extends BaseController<RetryInput> {
    protected override schema = retrySchema;

    public constructor(private readonly errorLogService: ErrorLogService) {
        super();
    }

    protected async execute(
        input: RetryInput,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<{ isCorrect: boolean; status: string; timesMissed: number; retryCount: number; entry: unknown }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to retry question");
        }

        const entryId = context?.params?.id as string;
        if (!entryId) {
            throw new ValidationError("Error log entry id is required");
        }

        const answerText = input.answer ?? input.userAnswer ?? "";
        const result = await this.errorLogService.retryQuestion(
            session.user.id,
            entryId,
            answerText
        );

        return {
            isCorrect: result.isCorrect,
            status: result.entry.status,
            timesMissed: result.entry.timesMissed,
            retryCount: result.entry.timesMissed,
            entry: {
                _id: result.entry.id,
                status: result.entry.status,
                timesMissed: result.entry.timesMissed,
                retryCount: result.entry.timesMissed,
            },
        };
    }
}
