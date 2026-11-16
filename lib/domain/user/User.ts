import { Entity } from "../shared/Entity";
import { Email } from "./Email";
import { Role } from "./Role";

export interface UserProps {
    id: string;
    email: Email;
    name: string;
    passwordHash: string;
    role: Role;
    createdAt?: Date;
}

/**
 * Abstract Base Class for Users in RonanSAT.
 * Encapsulates core user identity, credentials hash, and role.
 * Subclasses provide polymorphic authorization logic.
 */
export abstract class User extends Entity<string> {
    protected readonly _email: Email;
    protected _name: string;
    protected _passwordHash: string;
    protected readonly _role: Role;
    protected readonly _createdAt: Date;

    protected constructor(props: UserProps) {
        super(props.id);
        this._email = props.email;
        this._name = props.name;
        this._passwordHash = props.passwordHash;
        this._role = props.role;
        this._createdAt = props.createdAt ?? new Date();
    }

    public get email(): Email {
        return this._email;
    }

    public get name(): string {
        return this._name;
    }

    public get passwordHash(): string {
        return this._passwordHash;
    }

    public get role(): Role {
        return this._role;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public updateName(newName: string): void {
        this._name = newName.trim();
    }

    public updatePasswordHash(newHash: string): void {
        this._passwordHash = newHash;
    }

    /**
     * Polymorphic method determining administrative privileges.
     */
    public abstract canAccessAdmin(): boolean;
}
