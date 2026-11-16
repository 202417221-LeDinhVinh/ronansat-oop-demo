import { IRepository } from "./IRepository";
import { User, Role } from "../../../domain/user";

export interface IUserRepository extends IRepository<User, string> {
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    updateRole(id: string, role: Role): Promise<User | null>;
    count(): Promise<number>;
}
