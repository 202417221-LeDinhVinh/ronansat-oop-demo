import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "../authOptions";
import { HttpErrorMapper } from "./errors/HttpErrorMapper";
import {
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
} from "../domain/shared/DomainError";
import { Role } from "../domain/user/Role";
import dbConnect from "../mongodb";

export interface RequestContext {
    params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]>;
}

export interface ResolvedRequestContext {
    params?: Record<string, string | string[]>;
}

/**
 * Abstract Base Controller implementing the Template Method pattern.
 * Pipeline:
 * 1. authenticate()
 * 2. authorize(requiredRole)
 * 3. parseAndValidate(schema)
 * 4. execute() -> implemented by concrete subclasses
 * 5. mapResultOrErrors()
 *
 * Patterns: Template Method Pattern, Layer Supertype Pattern.
 */
export abstract class BaseController<TInput = unknown, TOutput = unknown> {
    protected requiredRole?: Role;
    protected schema?: z.ZodType<TInput>;
    protected successStatus = 200;

    /**
     * Concrete Template Method orchestrating the request handling lifecycle.
     */
    public async handle(
        req: NextRequest | Request,
        context?: RequestContext
    ): Promise<NextResponse> {
        try {
            await dbConnect();

            // 1. Authenticate
            const session = await this.authenticate();

            // 2. Authorize
            this.authorize(session);

            // 3. Resolve context params if promise
            let resolvedParams: Record<string, string | string[]> | undefined = undefined;
            if (context?.params) {
                resolvedParams =
                    typeof (context.params as Promise<unknown>).then === "function"
                        ? await (context.params as Promise<Record<string, string | string[]>>)
                        : (context.params as Record<string, string | string[]>);
            }

            // 4. Validate payload
            const input = await this.parseAndValidate(req, resolvedParams);

            // 5. Execute use-case (Template hook)
            const result = await this.execute(input, req, session, {
                params: resolvedParams,
            });

            if (result instanceof NextResponse) {
                return result;
            }

            return NextResponse.json(result, { status: this.successStatus });
        } catch (error) {
            // Ch.10: DomainError subclasses become 4xx; PersistenceError is mapped to an
            // opaque 500 so internal causes never leak into the HTTP response.
            return HttpErrorMapper.map(error);
        }
    }

    protected async authenticate(): Promise<Session | null> {
        return getServerSession(authOptions);
    }

    protected authorize(session: Session | null): void {
        if (!this.requiredRole) {
            return;
        }

        if (!session || !session.user) {
            throw new UnauthorizedError("Authentication required to access this resource");
        }

        const userRole = session.user.role as Role;
        if (this.requiredRole === "admin" && userRole !== "admin") {
            throw new ForbiddenError("Administrative privileges required");
        }
    }

    protected async parseAndValidate(
        req: NextRequest | Request,
        resolvedParams?: Record<string, string | string[]>
    ): Promise<TInput> {
        if (!this.schema) {
            return {} as TInput;
        }

        let rawData: unknown = {};
        const method = req.method?.toUpperCase();

        if (method === "DELETE") {
            return {} as TInput;
        }

        if (method === "POST" || method === "PUT" || method === "PATCH") {
            try {
                rawData = await req.json();
            } catch {
                rawData = {};
            }
        } else {
            // For GET and DELETE, combine query search params and route params
            const url = new URL(req.url);
            const queryParams: Record<string, string> = {};
            url.searchParams.forEach((val, key) => {
                queryParams[key] = val;
            });
            rawData = { ...queryParams, ...(resolvedParams || {}) };
        }

        const parseResult = this.schema.safeParse(rawData);
        if (!parseResult.success) {
            const issues = parseResult.error.issues
                .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
                .join(", ");
            throw new ValidationError(`Validation failed: ${issues}`);
        }

        return parseResult.data;
    }

    /**
     * Abstract hook method containing use-case specific controller logic.
     */
    protected abstract execute(
        input: TInput,
        req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<TOutput | NextResponse>;
}
