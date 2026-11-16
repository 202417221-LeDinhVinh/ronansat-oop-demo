import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { PracticeService } from "../../../application/services/PracticeService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";

export class SubmitAttemptController extends BaseController {
    public constructor(private readonly practiceService: PracticeService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<{ message: string; attemptId: string; score: unknown; attempt?: unknown }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to submit an attempt");
        }

        const attemptId = context?.params?.id as string;
        if (!attemptId) {
            throw new ValidationError("Attempt id route parameter is required");
        }

        const attempt = await this.practiceService.submitAttempt(attemptId, session.user.id);

        const scoreObj = attempt.score
            ? {
                  total: attempt.score.total,
                  sectionScores: attempt.score.sectionScores,
                  rawCorrectCounts: attempt.score.rawCorrectCounts,
                  totalQuestions: attempt.score.totalQuestions,
                  isSectional: attempt.score.isSectional,
                  readingAndWriting: attempt.score.sectionScores.readingAndWriting,
                  math: attempt.score.sectionScores.math,
              }
            : null;

        return {
            message: "Attempt submitted successfully",
            attemptId: attempt.id,
            score: scoreObj,
            attempt: {
                id: attempt.id,
                _id: attempt.id,
                status: attempt.status,
                score: scoreObj,
            },
        };
    }
}
