import { NextRequest } from "next/server";
import { z } from "zod";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { AdminService } from "../../../application/services/AdminService";
import { ValidationError } from "../../../domain/shared/DomainError";
import { Role } from "../../../domain/user/Role";
import { QuestionDifficulty } from "../../../domain/question/Question";
import { MultipleChoiceQuestion } from "../../../domain/question/MultipleChoiceQuestion";
import { StudentProducedResponseQuestion } from "../../../domain/question/StudentProducedResponseQuestion";

// --- Metrics ---
export class AdminMetricsController extends BaseController {
    protected override requiredRole: Role = "admin";

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(): Promise<unknown> {
        const metrics = await this.adminService.getOverviewMetrics();
        return { metrics };
    }
}

// --- Tests CRUD ---
const createTestSchema = z.object({
    title: z.string().min(1, "Title is required"),
    timeLimit: z.number().int().positive().default(134),
    difficulty: z.string().default("medium"),
    mode: z.string().optional(),
    sections: z
        .array(
            z.object({
                name: z.string().optional(),
                title: z.string().optional(),
                module: z.number().int().default(1),
                subject: z.string().optional(),
                questionsCount: z.number().int().default(0),
                timeLimit: z.number().int().default(32),
                timeLimitMinutes: z.number().int().optional(),
            }).transform((s) => ({
                name: s.name || s.title || s.subject || "Section",
                module: s.module,
                questionsCount: s.questionsCount,
                timeLimit: s.timeLimitMinutes || s.timeLimit,
            }))
        )
        .default([]),
});

export class AdminTestsController extends BaseController<z.infer<typeof createTestSchema>> {
    protected override requiredRole: Role = "admin";
    protected override schema = createTestSchema;
    protected override successStatus = 201;

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(input: z.infer<typeof createTestSchema>): Promise<unknown> {
        const test = await this.adminService.createTest(input);
        return {
            test: {
                _id: test.id,
                title: test.title,
                timeLimit: test.timeLimit,
                difficulty: test.difficulty,
                sections: test.sections.map((s) => ({
                    name: s.name,
                    module: s.module,
                    questionsCount: s.questionsCount,
                    timeLimit: s.timeLimit,
                })),
            },
        };
    }
}

export class AdminTestDetailController extends BaseController<z.infer<typeof createTestSchema>> {
    protected override requiredRole: Role = "admin";
    protected override schema = createTestSchema;

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof createTestSchema>,
        req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Test id is required");

        if (req.method?.toUpperCase() === "DELETE") {
            await this.adminService.deleteTest(id);
            return { success: true };
        }

        const updated = await this.adminService.updateTest(id, input);
        return {
            test: {
                _id: updated.id,
                title: updated.title,
                timeLimit: updated.timeLimit,
                difficulty: updated.difficulty,
            },
        };
    }
}

// --- Questions CRUD ---
const createQuestionSchema = z.object({
    testId: z.string().min(1, "testId is required"),
    section: z.string().min(1, "section is required"),
    module: z.number().int().default(1),
    questionText: z.string().min(1, "questionText is required"),
    passage: z.string().optional(),
    choices: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    acceptedAnswers: z.array(z.string()).optional(),
    explanation: z.string().default(""),
    domain: z.string().optional(),
    skill: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    points: z.number().int().default(10),
    imageUrl: z.string().optional(),
});

export class AdminQuestionsController extends BaseController<z.infer<typeof createQuestionSchema>> {
    protected override requiredRole: Role = "admin";
    protected override schema = createQuestionSchema;
    protected override successStatus = 201;

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(input: z.infer<typeof createQuestionSchema>): Promise<unknown> {
        const q = await this.adminService.createQuestion({
            testId: input.testId,
            section: input.section,
            module: input.module,
            questionText: input.questionText,
            passage: input.passage,
            choices: input.choices,
            correctAnswer: input.correctAnswer,
            acceptedAnswers: input.acceptedAnswers,
            explanation: input.explanation,
            domain: input.domain,
            skill: input.skill,
            difficulty: input.difficulty as QuestionDifficulty,
            points: input.points,
            imageUrl: input.imageUrl,
        });

        const isMcq = q instanceof MultipleChoiceQuestion;
        const isSpr = q instanceof StudentProducedResponseQuestion;

        return {
            question: {
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
            },
        };
    }
}

export class AdminQuestionDetailController extends BaseController {
    protected override requiredRole: Role = "admin";

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(
        _input: unknown,
        req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Question id is required");

        if (req.method?.toUpperCase() === "DELETE") {
            await this.adminService.deleteQuestion(id);
            return { success: true };
        }

        const body = await req.json();
        const updated = await this.adminService.updateQuestion(id, body);
        return { question: { _id: updated.id } };
    }
}

// --- Users List & Role Modification ---
export class AdminUsersController extends BaseController {
    protected override requiredRole: Role = "admin";

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(): Promise<unknown> {
        const users = await this.adminService.getAllUsers();
        return {
            users: users.map((u) => ({
                _id: u.id,
                name: u.name,
                email: u.email.value,
                role: u.role,
                createdAt: u.createdAt,
            })),
        };
    }
}

const updateRoleSchema = z.object({
    role: z.enum(["student", "admin"]),
});

export class AdminUserRoleController extends BaseController<z.infer<typeof updateRoleSchema>> {
    protected override requiredRole: Role = "admin";
    protected override schema = updateRoleSchema;

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof updateRoleSchema>,
        _req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("User id is required");

        const updated = await this.adminService.updateUserRole(id, input.role as Role);
        return {
            user: {
                _id: updated.id,
                email: updated.email.value,
                role: updated.role,
            },
        };
    }
}

// --- Vocab System Decks ---
const systemDeckSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().default(""),
    cards: z
        .array(
            z.object({
                word: z.string().min(1),
                partOfSpeech: z.string().default(""),
                definition: z.string().default(""),
                exampleSentence: z.string().default(""),
            })
        )
        .optional(),
});

export class AdminVocabDecksController extends BaseController<z.infer<typeof systemDeckSchema>> {
    protected override requiredRole: Role = "admin";
    protected override schema = systemDeckSchema;
    protected override successStatus = 201;

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(input: z.infer<typeof systemDeckSchema>): Promise<unknown> {
        const deck = await this.adminService.createSystemDeck(input);
        return {
            deck: {
                _id: deck.id,
                title: deck.title,
                description: deck.description,
                isSystem: true,
            },
        };
    }
}

export class AdminVocabDeckDetailController extends BaseController {
    protected override requiredRole: Role = "admin";

    public constructor(private readonly adminService: AdminService) {
        super();
    }

    protected async execute(
        _input: unknown,
        req: NextRequest | Request,
        _session: unknown,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Deck id is required");

        if (req.method?.toUpperCase() === "DELETE") {
            await this.adminService.deleteSystemDeck(id);
            return { success: true };
        }

        const body = await req.json();
        const updated = await this.adminService.updateSystemDeck(id, body);
        return { deck: { _id: updated.id, title: updated.title, description: updated.description } };
    }
}
