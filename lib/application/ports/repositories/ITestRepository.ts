import { IRepository } from "./IRepository";
import { Test } from "../../../domain/test";

export interface ITestRepository extends IRepository<Test, string> {
    findAll(): Promise<Test[]>;
    count(): Promise<number>;
}
