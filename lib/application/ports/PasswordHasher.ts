/**
 * Port interface for hashing and comparing passwords.
 * Inverts dependency on third-party hashing libraries (e.g. bcryptjs).
 */
export interface PasswordHasher {
    hash(plain: string): Promise<string>;
    compare(plain: string, hash: string): Promise<boolean>;
}
