import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController } from "../../BaseController";
import { PracticeService } from "../../../application/services/PracticeService";
import { UnauthorizedError } from "../../../domain/shared/DomainError";

const createResultSchema = z.object({
    testId: z.string().min(1, "testId is required"),
    isSectional: z.boolean().default(false),
    sectionalSubject: z.string().optional(),
    sectionalModule: z.number().int().optional(),
    answers: z
        .array(
            z.object({
                questionId: z.string(),
                userAnswer: z.string(),
            })
        )
        .default([]),
});

type CreateResultInput = z.infer<typeof createResultSchema>;

export class CreateResultController extends BaseController<CreateResultInput> {
    protected override schema = createResultSchema;
    protected override successStatus = 201;

    public constructor(private readonly practiceService: PracticeService) {
        super();
    }

    protected async execute(
        input: CreateResultInput,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<unknown> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to submit results");
        }

        const mode = input.isSectional ? "sectional" : "full_length";
        const attempt = await this.practiceService.startAttempt({
            userId: session.user.id,
            testId: input.testId,
            mode,
            sectionalSubject: input.sectionalSubject,
            sectionalModule: input.sectionalModule,
        });

        // Record all submitted answers
        for (const ans of input.answers) {
            await this.practiceService.recordAnswer({
                attemptId: attempt.id,
                userId: session.user.id,
                questionId: ans.questionId,
                answer: ans.userAnswer,
            });
        }

        const submitted = await this.practiceService.submitAttempt(attempt.id, session.user.id);

        return {
            result: {
                _id: submitted.id,
                testId: submitted.testId,
                userId: submitted.userId,
                score: submitted.score?.total,
                sectionBreakdown: submitted.score?.sectionScores,
            },
        };
    }
}
