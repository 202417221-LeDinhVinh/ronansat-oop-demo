import { BaseController } from "../../BaseController";
import { TestService } from "../../../application/services/TestService";

export class GetTestsController extends BaseController {
    public constructor(private readonly testService: TestService) {
        super();
    }

    protected async execute(): Promise<{ tests: unknown[] }> {
        const tests = await this.testService.getAllTests();
        return {
            tests: tests.map((t) => ({
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
                questionsCount: t.questionIds.length,
                createdAt: t.createdAt,
            })),
        };
    }
}
