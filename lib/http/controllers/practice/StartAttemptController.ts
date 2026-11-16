import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController } from "../../BaseController";
import { PracticeService } from "../../../application/services/PracticeService";
import { UnauthorizedError } from "../../../domain/shared/DomainError";

const startAttemptSchema = z.object({
    testId: z.string().min(1, "testId is required"),
    mode: z.enum(["full_length", "sectional"]).default("full_length"),
    sectionalSubject: z.string().optional(),
    sectionalModule: z.number().int().optional(),
});

type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export class StartAttemptController extends BaseController<StartAttemptInput> {
    protected override schema = startAttemptSchema;
    protected override successStatus = 201;

    public constructor(private readonly practiceService: PracticeService) {
        super();
    }

    protected async execute(
        input: StartAttemptInput,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<{ attemptId: string; attempt: unknown }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to start an attempt");
        }

        const attempt = await this.practiceService.startAttempt({
            userId: session.user.id,
            testId: input.testId,
            mode: input.mode,
            sectionalSubject: input.sectionalSubject,
            sectionalModule: input.sectionalModule,
        });

        return {
            attemptId: attempt.id,
            attempt: {
                _id: attempt.id,
                userId: attempt.userId,
                testId: attempt.testId,
                mode: attempt.mode,
                sectionalSubject: attempt.sectionalSubject,
                sectionalModule: attempt.sectionalModule,
                status: attempt.status,
                startedAt: attempt.startedAt,
            },
        };
    }
}
