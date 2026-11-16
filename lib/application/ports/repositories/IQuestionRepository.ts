import { IRepository } from "./IRepository";
import { Question } from "../../../domain/question";

export interface IQuestionRepository extends IRepository<Question, string> {
    findByIds(ids: string[]): Promise<Question[]>;
    findByTestId(testId: string): Promise<Question[]>;
    findBySectionAndModule(testId: string, section: string, module: number): Promise<Question[]>;
    count(): Promise<number>;
}
