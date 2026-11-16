import bcrypt from "bcryptjs";
import { PasswordHasher } from "../../application/ports/PasswordHasher";

/**
 * Bcrypt implementation of the PasswordHasher port.
 */
export class BcryptPasswordHasher implements PasswordHasher {
    private readonly saltRounds: number;

    public constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }

    public async hash(plain: string): Promise<string> {
        return bcrypt.hash(plain, this.saltRounds);
    }

    public async compare(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }
}
