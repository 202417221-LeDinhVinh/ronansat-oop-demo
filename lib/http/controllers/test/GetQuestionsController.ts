import { NextRequest } from "next/server";
import { BaseController } from "../../BaseController";
import { TestService } from "../../../application/services/TestService";
import { ValidationError } from "../../../domain/shared/DomainError";
import { MultipleChoiceQuestion } from "../../../domain/question/MultipleChoiceQuestion";

export class GetQuestionsController extends BaseController {
    public constructor(private readonly testService: TestService) {
        super();
    }

    protected async execute(_input: unknown, req: NextRequest | Request): Promise<{ questions: unknown[] }> {
        const url = new URL(req.url);
        const testId = url.searchParams.get("testId");
        if (!testId) {
            throw new ValidationError("Query parameter testId is required");
        }

        const section = url.searchParams.get("section") || undefined;
        const moduleStr = url.searchParams.get("module");
        const moduleNum = moduleStr ? parseInt(moduleStr, 10) : undefined;

        const questions = await this.testService.getQuestionsByTestId(testId, {
            section,
            module: moduleNum,
        });

        return {
            questions: questions.map((q) => {
                const isMcq = q instanceof MultipleChoiceQuestion;
                return {
                    _id: q.id,
                    testId: q.testId,
                    section: q.section,
                    module: q.module,
                    questionText: q.questionText,
                    passage: q.passage,
                    choices: isMcq ? (q as MultipleChoiceQuestion).choices : [],
                    questionType: q.questionType,
                    difficulty: q.difficulty,
                    points: q.points,
                    domain: q.domain,
                    skill: q.skill,
                    imageUrl: q.imageUrl,
                };
            }),
        };
    }
}
