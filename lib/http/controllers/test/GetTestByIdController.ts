import { NextRequest } from "next/server";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { TestService } from "../../../application/services/TestService";
import { ValidationError } from "../../../domain/shared/DomainError";

export class GetTestByIdController extends BaseController {
    public constructor(private readonly testService: TestService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<{ test: unknown }> {
        const id = context?.params?.id as string;
        if (!id) {
            throw new ValidationError("Test id parameter is required");
        }

        const t = await this.testService.getTestById(id);
        return {
            test: {
                _id: t.id,
                title: t.title,
                timeLimit: t.timeLimit,
                difficulty: t.difficulty,
                sections: t.sections.map((s) => ({
                    name: s.name,
                    module: s.module,
                    questionsCount: s.questionsCount,
                    timeLimit: s.timeLimit,
                })),
                questions: t.questionIds,
                createdAt: t.createdAt,
            },
        };
    }
}
