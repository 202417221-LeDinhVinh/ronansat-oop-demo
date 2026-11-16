import { NextResponse } from "next/server";
import {
    DomainError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    InvariantViolationError,
} from "../../domain/shared/DomainError";

export interface ApiErrorResponse {
    error: string;
    code: string;
    details?: unknown;
}

/**
 * Maps domain errors to standard HTTP response status codes and bodies.
 * Inverts HTTP concerns away from domain and application layers.
 */
export class HttpErrorMapper {
    public static map(error: unknown): NextResponse<ApiErrorResponse> {
        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, code: "VALIDATION_ERROR" },
                { status: 400 }
            );
        }

        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: error.message, code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        if (error instanceof ForbiddenError) {
            return NextResponse.json(
                { error: error.message, code: "FORBIDDEN" },
                { status: 403 }
            );
        }

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message, code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        if (error instanceof ConflictError) {
            return NextResponse.json(
                { error: error.message, code: "CONFLICT" },
                { status: 409 }
            );
        }

        if (error instanceof InvariantViolationError) {
            return NextResponse.json(
                { error: error.message, code: "INVARIANT_VIOLATION" },
                { status: 422 }
            );
        }

        if (error instanceof DomainError) {
            return NextResponse.json(
                { error: error.message, code: "DOMAIN_ERROR" },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json(
            { error: message, code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
