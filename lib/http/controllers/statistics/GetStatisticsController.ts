import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { BaseController } from "../../BaseController";
import { StatisticsService } from "../../../application/services/StatisticsService";
import { UnauthorizedError } from "../../../domain/shared/DomainError";

export class GetStatisticsController extends BaseController {
    public constructor(private readonly statisticsService: StatisticsService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<unknown> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to view statistics");
        }

        const stats = await this.statisticsService.getStatistics(session.user.id);
        return {
            statistics: stats,
        };
    }
}
