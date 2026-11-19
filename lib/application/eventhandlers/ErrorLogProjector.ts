import { AttemptSubmittedEvent, EventHandler } from "../../domain/events";
import { ErrorLogEntry } from "../../domain/errorlog";
import { IErrorLogRepository } from "../ports";
import { findMissedQuestions } from "./missedQuestions";

/**
 * Ch.11 Observer subscriber: projects an AttemptSubmitted event into the error log.
 * The projection is deduplicated per user and question, exactly like the old inline code.
 */
export class ErrorLogProjector implements EventHandler<AttemptSubmittedEvent> {
    public constructor(private readonly errorLogRepo: IErrorLogRepository) {}

    public async handle(event: AttemptSubmittedEvent): Promise<void> {
        const { attempt, occurredAt } = event;

        for (const question of findMissedQuestions(attempt, event.questions)) {
            const existing = await this.errorLogRepo.findByUserAndQuestion(
                attempt.userId,
                question.id
            );

            if (existing) {
                existing.recordNewMistake(attempt.id, occurredAt);
                await this.errorLogRepo.save(existing);
            } else {
                const entry = new ErrorLogEntry({
                    id: "",
                    userId: attempt.userId,
                    questionId: question.id,
                    latestAttemptId: attempt.id,
                    timesMissed: 1,
                    reason: "Unclassified",
                    status: "open",
                    lastAttemptedAt: occurredAt,
                });
                await this.errorLogRepo.save(entry);
            }
        }
    }
}
