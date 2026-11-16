import { IRepository } from "./IRepository";
import { Attempt } from "../../../domain/attempt";

export interface IAttemptRepository extends IRepository<Attempt, string> {
    findByUserId(userId: string): Promise<Attempt[]>;
    countByUserId(userId: string): Promise<number>;
    findRecentByUserId(userId: string, limit: number): Promise<Attempt[]>;
    count(): Promise<number>;
}
