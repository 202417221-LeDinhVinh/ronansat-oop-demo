import { IUserRepository, PasswordHasher } from "../ports";
import { Student, User, Email } from "../../domain/user";
import { ConflictError, UnauthorizedError, ValidationError } from "../../domain/shared";

export interface RegisterDTO {
    name: string;
    email: string;
    password: string;
}

/**
 * Service orchestrating user registration and credential validation.
 * Pattern: Domain-Driven Application Service.
 */
export class AuthService {
    public constructor(
        private readonly userRepo: IUserRepository,
        private readonly passwordHasher: PasswordHasher
    ) {}

    public async register(dto: RegisterDTO): Promise<User> {
        if (!dto.email || !dto.password) {
            throw new ValidationError("Email and password are required");
        }
        if (dto.password.length < 6) {
            throw new ValidationError("Password must be at least 6 characters long");
        }

        const emailVO = new Email(dto.email);
        const existing = await this.userRepo.findByEmail(emailVO.value);
        if (existing) {
            throw new ConflictError("User with this email already exists");
        }

        const passwordHash = await this.passwordHasher.hash(dto.password);
        const student = new Student({
            id: "", // Will be assigned by repository or random id
            email: emailVO,
            name: dto.name || emailVO.value.split("@")[0],
            passwordHash,
            createdAt: new Date(),
        });

        return this.userRepo.save(student);
    }

    public async validateCredentials(email: string, password: string): Promise<User> {
        if (!email || !password) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const emailVO = new Email(email);
        const user = await this.userRepo.findByEmail(emailVO.value);
        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const isValid = await this.passwordHasher.compare(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        return user;
    }
}
