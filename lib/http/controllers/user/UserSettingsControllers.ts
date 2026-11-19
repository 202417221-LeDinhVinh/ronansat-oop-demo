import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController } from "../../BaseController";
import { IUserRepository, PasswordHasher } from "../../../application/ports";
import { IAttemptRepository } from "../../../application/ports/repositories/IAttemptRepository";
import { IErrorLogRepository } from "../../../application/ports/repositories/IErrorLogRepository";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";

export class UserStatsController extends BaseController {
    public constructor(
        private readonly userRepo: IUserRepository,
        private readonly attemptRepo: IAttemptRepository,
        private readonly errorLogRepo: IErrorLogRepository
    ) {
        super();
    }

    protected async execute(_input: unknown, _req: NextRequest | Request, session: Session | null): Promise<unknown> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to view stats");
        }

        const user = await this.userRepo.findById(session.user.id);
        const attempts = await this.attemptRepo.findByUserId(session.user.id);
        const errorLogsOpen = await this.errorLogRepo.countOpenByUserId(session.user.id);

        const highestScore = user?.bestScore ?? 0;

        return {
            testsTaken: attempts.length,
            highestScore,
            stats: {
                testsTaken: attempts.length,
                highestScore,
                lastTestDate: user?.lastAssessmentDate,
                errorLogsToReview: errorLogsOpen,
                recentResults: attempts.slice(0, 3).map((a) => ({
                    _id: a.id,
                    score: a.score?.total,
                    date: a.startedAt,
                    isSectional: a.mode === "sectional",
                })),
            },
        };
    }
}

const updateSettingsSchema = z.object({
    name: z.string().optional(),
});

export class UserSettingsController extends BaseController<z.infer<typeof updateSettingsSchema>> {
    protected override schema = updateSettingsSchema;

    public constructor(private readonly userRepo: IUserRepository) {
        super();
    }

    protected async execute(
        input: z.infer<typeof updateSettingsSchema>,
        req: NextRequest | Request,
        session: Session | null
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Must be logged in");

        const user = await this.userRepo.findById(session.user.id);
        if (!user) throw new UnauthorizedError("User not found");

        if (req.method?.toUpperCase() === "GET") {
            return {
                user: {
                    name: user.name,
                    email: user.email.value,
                    role: user.role,
                },
            };
        }

        if (input.name) {
            user.updateName(input.name);
            await this.userRepo.save(user);
        }

        return {
            user: {
                name: user.name,
                email: user.email.value,
            },
        };
    }
}

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export class UserPasswordController extends BaseController<z.infer<typeof updatePasswordSchema>> {
    protected override schema = updatePasswordSchema;

    public constructor(
        private readonly userRepo: IUserRepository,
        private readonly passwordHasher: PasswordHasher
    ) {
        super();
    }

    protected async execute(
        input: z.infer<typeof updatePasswordSchema>,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Must be logged in");

        const user = await this.userRepo.findById(session.user.id);
        if (!user) throw new UnauthorizedError("User not found");

        const matches = await this.passwordHasher.compare(input.currentPassword, user.passwordHash);
        if (!matches) {
            throw new ValidationError("Current password does not match");
        }

        const newHash = await this.passwordHasher.hash(input.newPassword);
        user.updatePasswordHash(newHash);
        await this.userRepo.save(user);

        return { message: "Password updated successfully" };
    }
}
