import { NextRequest } from "next/server";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { IQuestionRepository } from "../../../application/ports/repositories/IQuestionRepository";
import { NotFoundError, ValidationError } from "../../../domain/shared/DomainError";

export class GetQuestionExplanationController extends BaseController {
    public constructor(private readonly questionRepo: IQuestionRepository) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<{ explanation: string; correctAnswer?: string }> {
        const id = context?.params?.id as string;
        if (!id) {
            throw new ValidationError("Question id parameter is required");
        }

        const question = await this.questionRepo.findById(id);
        if (!question) {
            throw new NotFoundError(`Question with id "${id}" not found`);
        }

        return {
            explanation: question.explanation,
        };
    }
}
