import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { BaseController } from "../../BaseController";
import { ResultService } from "../../../application/services/ResultService";
import { UnauthorizedError } from "../../../domain/shared/DomainError";

export class GetResultsController extends BaseController {
    public constructor(private readonly resultService: ResultService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<{ results: unknown[] }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to view results");
        }

        const summaries = await this.resultService.getUserResultSummaries(session.user.id);

        return {
            results: summaries.map(({ attempt: a, testTitle }) => {
                const isSectional = a.mode === "sectional";
                const fallbackScore = isSectional ? 200 : 400;
                const score = a.score?.total !== undefined ? a.score.total : fallbackScore;

                return {
                    _id: a.id,
                    testId: {
                        _id: a.testId,
                        title: testTitle,
                    },
                    testTitle,
                    userId: a.userId,
                    mode: a.mode,
                    isSectional,
                    sectionalSubject: a.sectionalSubject,
                    sectionalModule: a.sectionalModule,
                    status: a.status,
                    score,
                    sectionBreakdown: a.score?.sectionScores,
                    rawCorrectCounts: a.score?.rawCorrectCounts,
                    totalQuestions: a.score?.totalQuestions,
                    answersCount: a.answers.length,
                    date: a.submittedAt || a.startedAt,
                    createdAt: a.startedAt,
                };
            }),
        };
    }
}
