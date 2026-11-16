import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { PracticeService } from "../../../application/services/PracticeService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";

const recordAnswerSchema = z.object({
    questionId: z.string().min(1, "questionId is required"),
    answer: z.string().optional(),
    userAnswer: z.string().optional(),
});

type RecordAnswerInput = z.infer<typeof recordAnswerSchema>;

export class RecordAnswerController extends BaseController<RecordAnswerInput> {
    protected override schema = recordAnswerSchema;

    public constructor(private readonly practiceService: PracticeService) {
        super();
    }

    protected async execute(
        input: RecordAnswerInput,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<{ recorded: boolean; isCorrect: boolean; answeredCount: number }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to record an answer");
        }

        const attemptId = context?.params?.id as string;
        if (!attemptId) {
            throw new ValidationError("Attempt id route parameter is required");
        }

        const answerText = input.answer ?? input.userAnswer ?? "";
        const result = await this.practiceService.recordAnswer({
            attemptId,
            userId: session.user.id,
            questionId: input.questionId,
            answer: answerText,
        });

        return {
            recorded: true,
            isCorrect: result.isCorrect,
            answeredCount: result.attempt.answers.length,
        };
    }
}
