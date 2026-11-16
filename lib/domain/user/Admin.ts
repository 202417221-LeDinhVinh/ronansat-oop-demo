import { User, UserProps } from "./User";

export type AdminProps = Omit<UserProps, "role">;

/**
 * Concrete Admin entity.
 * Represents an administrator with full access to test, question, and user management.
 */
export class Admin extends User {
    public constructor(props: AdminProps) {
        super({ ...props, role: "admin" });
    }

    public override canAccessAdmin(): boolean {
        return true;
    }
}
