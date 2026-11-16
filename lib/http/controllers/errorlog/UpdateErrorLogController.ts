import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { ErrorLogService } from "../../../application/services/ErrorLogService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";

const updateErrorLogSchema = z.object({
    reason: z
        .enum(["Careless", "Concept gap", "Misread question", "Time pressure", "Guessed", "Unclassified"])
        .optional(),
    note: z.string().optional(),
    status: z.enum(["open", "resolved"]).optional(),
});

type UpdateErrorLogInput = z.infer<typeof updateErrorLogSchema>;

export class UpdateErrorLogController extends BaseController<UpdateErrorLogInput> {
    protected override schema = updateErrorLogSchema;

    public constructor(private readonly errorLogService: ErrorLogService) {
        super();
    }

    protected async execute(
        input: UpdateErrorLogInput,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<{ message: string; entry: unknown }> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to update error log");
        }

        const entryId = context?.params?.id as string;
        if (!entryId) {
            throw new ValidationError("Error log entry id is required");
        }

        const entry = await this.errorLogService.updateEntry(session.user.id, entryId, {
            reason: input.reason,
            note: input.note,
            status: input.status,
        });

        return {
            message: "Error log entry updated",
            entry: {
                _id: entry.id,
                reason: entry.reason,
                note: entry.note,
                status: entry.status,
                timesMissed: entry.timesMissed,
                resolvedAt: entry.resolvedAt,
            },
        };
    }
}
