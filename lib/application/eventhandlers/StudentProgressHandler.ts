import { AttemptSubmittedEvent, EventHandler } from "../../domain/events";
import { Student } from "../../domain/user";
import { IUserRepository } from "../ports";
import { findMissedQuestions } from "./missedQuestions";

/**
 * Ch.11 Observer subscriber: updates the student's progress after an attempt is submitted.
 *
 * Ch.8 downcast: `user` is declared as the base `User`, and only the `instanceof Student`
 * type guard narrows it to `Student`. This is the ONE explicit, justified downcast in the
 * application code: only a Student has progress fields (`recordTestCompletion`,
 * `addWrongQuestion`). Admins have no study history, so the handler simply returns.
 */
export class StudentProgressHandler implements EventHandler<AttemptSubmittedEvent> {
    public constructor(private readonly userRepo: IUserRepository) {}

    public async handle(event: AttemptSubmittedEvent): Promise<void> {
        const user = await this.userRepo.findById(event.attempt.userId);
        if (!(user instanceof Student)) {
            return;
        }

        const student: Student = user;
        const score = event.attempt.score?.total ?? 0;

        student.recordTestCompletion(event.attempt.testId, score, event.occurredAt);
        for (const question of findMissedQuestions(event.attempt, event.questions)) {
            student.addWrongQuestion(question.id);
        }

        await this.userRepo.save(student);
    }
}
