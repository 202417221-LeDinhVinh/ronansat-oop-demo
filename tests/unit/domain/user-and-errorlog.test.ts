import { describe, it, expect } from "vitest";
import { Email } from "@/lib/domain/user/Email";
import { Student } from "@/lib/domain/user/Student";
import { Admin } from "@/lib/domain/user/Admin";
import { ErrorLogEntry } from "@/lib/domain/errorlog/ErrorLogEntry";
import { ValidationError } from "@/lib/domain/shared/DomainError";

describe("User & ErrorLog Domain Entities", () => {
    describe("Email Value Object", () => {
        it("accepts valid email and normalizes to lowercase and trimmed", () => {
            const email = new Email("  STUDENT@RonanSat.Com  ");
            expect(email.value).toBe("student@ronansat.com");
            expect(email.toString()).toBe("student@ronansat.com");
        });

        it("throws ValidationError for invalid email formats", () => {
            expect(() => new Email("not-an-email")).toThrow(ValidationError);
            expect(() => new Email("missing-domain@")).toThrow(ValidationError);
            expect(() => new Email("@missing-user.com")).toThrow(ValidationError);
            expect(() => new Email("")).toThrow(ValidationError);
        });

        it("compares equality with other Email value objects", () => {
            const email1 = new Email("test@example.com");
            const email2 = new Email("TEST@example.com");
            const email3 = new Email("other@example.com");

            expect(email1.equals(email2)).toBe(true);
            expect(email1.equals(email3)).toBe(false);
        });
    });

    describe("User Hierarchy & Polymorphism", () => {
        it("Student canAccessAdmin returns false", () => {
            const student = new Student({
                id: "s_1",
                email: new Email("student@ronansat.com"),
                name: "Demo Student",
                passwordHash: "hash123",
            });

            expect(student.role).toBe("student");
            expect(student.canAccessAdmin()).toBe(false);
        });

        it("Admin canAccessAdmin returns true", () => {
            const admin = new Admin({
                id: "a_1",
                email: new Email("admin@ronansat.com"),
                name: "Demo Admin",
                passwordHash: "hash456",
            });

            expect(admin.role).toBe("admin");
            expect(admin.canAccessAdmin()).toBe(true);
        });

        it("Student recordTestCompletion updates highest score when improved", () => {
            const student = new Student({
                id: "s_1",
                email: new Email("student@ronansat.com"),
                name: "Demo Student",
                passwordHash: "hash123",
                highestScore: 1400,
            });

            student.recordTestCompletion("t_1", 1450);
            expect(student.highestScore).toBe(1450);
            expect(student.testsTaken.length).toBe(1);

            student.recordTestCompletion("t_2", 1420);
            expect(student.highestScore).toBe(1450); // Kept 1450
            expect(student.testsTaken.length).toBe(2);
        });
    });

    describe("ErrorLogEntry Entity", () => {
        it("initializes with default open status and 1 times missed", () => {
            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
            });

            expect(entry.timesMissed).toBe(1);
            expect(entry.status).toBe("open");
            expect(entry.reason).toBe("Unclassified");
            expect(entry.isResolved()).toBe(false);
        });

        it("tagReason and addNote updates classification metadata", () => {
            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
            });

            entry.tagReason("Careless");
            entry.addNote("Did not see the negative sign in the question.");

            expect(entry.reason).toBe("Careless");
            expect(entry.note).toBe("Did not see the negative sign in the question.");
        });

        it("recordNewMistake increments timesMissed and reopens resolved entry", () => {
            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
                status: "resolved",
                timesMissed: 1,
            });

            entry.recordNewMistake("att_2");
            expect(entry.timesMissed).toBe(2);
            expect(entry.latestAttemptId).toBe("att_2");
            expect(entry.status).toBe("open");
            expect(entry.isResolved()).toBe(false);
        });

        it("retry() correctly marks resolved when answer is correct", () => {
            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
                status: "open",
                timesMissed: 2,
            });

            const success = entry.retry(true);
            expect(success).toBe(true);
            expect(entry.status).toBe("resolved");
            expect(entry.isResolved()).toBe(true);
            expect(entry.resolvedAt).toBeDefined();
        });

        it("retry() increments timesMissed and keeps status open when incorrect", () => {
            const entry = new ErrorLogEntry({
                id: "err_1",
                userId: "u_1",
                questionId: "q_1",
                latestAttemptId: "att_1",
                status: "open",
                timesMissed: 2,
            });

            const success = entry.retry(false);
            expect(success).toBe(false);
            expect(entry.status).toBe("open");
            expect(entry.timesMissed).toBe(3);
        });
    });
});
