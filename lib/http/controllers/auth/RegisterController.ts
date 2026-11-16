import { z } from "zod";
import { BaseController } from "../../BaseController";
import { AuthService } from "../../../application/services/AuthService";

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export class RegisterController extends BaseController<RegisterInput> {
    protected override schema = registerSchema;
    protected override successStatus = 201;

    public constructor(private readonly authService: AuthService) {
        super();
    }

    protected async execute(input: RegisterInput): Promise<{ message: string; userId: string }> {
        const user = await this.authService.register({
            name: input.name,
            email: input.email,
            password: input.password,
        });

        return {
            message: "User registered successfully",
            userId: user.id,
        };
    }
}
