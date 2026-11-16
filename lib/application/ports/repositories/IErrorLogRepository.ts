import { IRepository } from "./IRepository";
import { ErrorLogEntry } from "../../../domain/errorlog";

export interface ErrorLogQueryFilters {
    section?: string;
    domain?: string;
    skill?: string;
    reason?: string;
    status?: string;
}

export interface IErrorLogRepository extends IRepository<ErrorLogEntry, string> {
    findByUserAndQuestion(userId: string, questionId: string): Promise<ErrorLogEntry | null>;
    findByUserId(userId: string, filters?: ErrorLogQueryFilters): Promise<ErrorLogEntry[]>;
    countOpenByUserId(userId: string): Promise<number>;
}
