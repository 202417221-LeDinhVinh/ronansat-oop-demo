import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { ResultService } from "../../../application/services/ResultService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";
import { MultipleChoiceQuestion } from "../../../domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "../../../domain/question/StudentProducedResponseQuestion";

export class GetResultDetailController extends BaseController {
    public constructor(private readonly resultService: ResultService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to view result details");
        }

        const attemptId = context?.params?.id as string;
        if (!attemptId) {
            throw new ValidationError("Attempt id route parameter is required");
        }

        const isAdmin = session.user.role === "admin";
        const detail = await this.resultService.getResultById(attemptId, session.user.id, isAdmin);

        const questionMap = new Map<string, unknown>();
        for (const q of detail.questions) {
            const isMcq = q instanceof MultipleChoiceQuestion;
            const isSpr = q instanceof StudentProducedResponseQuestion;
            questionMap.set(q.id, {
                _id: q.id,
                testId: q.testId,
                section: q.section,
                module: q.module,
                questionText: q.questionText,
                passage: q.passage,
                choices: isMcq ? (q as MultipleChoiceQuestion).choices : [],
                correctAnswer: isMcq ? (q as MultipleChoiceQuestion).correctAnswer : undefined,
                acceptedAnswers: isSpr ? (q as StudentProducedResponseQuestion).acceptedAnswers : undefined,
                questionType: q.questionType,
                explanation: q.explanation,
                domain: q.domain,
                skill: q.skill,
                difficulty: q.difficulty,
                points: q.points,
                imageUrl: q.imageUrl,
            });
        }

        const enrichedAnswers = detail.attempt.answers.map((a) => ({
            questionId: questionMap.get(a.questionId) || a.questionId,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
            answeredAt: a.answeredAt,
        }));

        return {
            result: {
                _id: detail.attempt.id,
                testId: {
                    _id: detail.test.id,
                    title: detail.test.title,
                },
                userId: detail.attempt.userId,
                mode: detail.attempt.mode,
                isSectional: detail.attempt.mode === "sectional",
                sectionalSubject: detail.attempt.sectionalSubject,
                sectionalModule: detail.attempt.sectionalModule,
                status: detail.attempt.status,
                score: detail.attempt.score?.total,
                sectionBreakdown: detail.attempt.score?.sectionScores,
                rawCorrectCounts: detail.attempt.score?.rawCorrectCounts,
                totalQuestions: detail.attempt.score?.totalQuestions,
                answers: enrichedAnswers,
                date: detail.attempt.submittedAt || detail.attempt.startedAt,
                createdAt: detail.attempt.startedAt,
            },
        };
    }
}
