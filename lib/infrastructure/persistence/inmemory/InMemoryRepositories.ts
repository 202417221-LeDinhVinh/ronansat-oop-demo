import {
    IUserRepository,
    ITestRepository,
    IQuestionRepository,
    IAttemptRepository,
    IErrorLogRepository,
    IVocabDeckRepository,
    IVocabCardRepository,
    ErrorLogQueryFilters,
} from "../../../application/ports/repositories";
import { User, Role } from "../../../domain/user";
import { Test } from "../../../domain/test";
import { Question } from "../../../domain/question";
import { Attempt } from "../../../domain/attempt";
import { ErrorLogEntry } from "../../../domain/errorlog";
import { VocabDeck, VocabCard } from "../../../domain/vocab";

let idCounter = 1;
function nextId(prefix = "id"): string {
    return `${prefix}_${Date.now()}_${idCounter++}`;
}

export class InMemoryUserRepository implements IUserRepository {
    private users = new Map<string, User>();

    public async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    public async save(entity: User): Promise<User> {
        let id = entity.id;
        if (!id) {
            id = nextId("user");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.users.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.users.delete(id);
    }

    public async findByEmail(email: string): Promise<User | null> {
        const norm = email.trim().toLowerCase();
        for (const user of this.users.values()) {
            if (user.email.value === norm) {
                return user;
            }
        }
        return null;
    }

    public async findAll(): Promise<User[]> {
        return Array.from(this.users.values());
    }

    public async updateRole(id: string, role: Role): Promise<User | null> {
        const user = this.users.get(id);
        if (!user) return null;
        Object.defineProperty(user, "_role", { value: role, writable: false });
        return user;
    }

    public async count(): Promise<number> {
        return this.users.size;
    }
}

export class InMemoryTestRepository implements ITestRepository {
    private tests = new Map<string, Test>();

    public async findById(id: string): Promise<Test | null> {
        return this.tests.get(id) || null;
    }

    public async save(entity: Test): Promise<Test> {
        let id = entity.id;
        if (!id) {
            id = nextId("test");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.tests.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.tests.delete(id);
    }

    public async findAll(): Promise<Test[]> {
        return Array.from(this.tests.values());
    }

    public async count(): Promise<number> {
        return this.tests.size;
    }
}

export class InMemoryQuestionRepository implements IQuestionRepository {
    private questions = new Map<string, Question>();

    public async findById(id: string): Promise<Question | null> {
        return this.questions.get(id) || null;
    }

    public async save(entity: Question): Promise<Question> {
        let id = entity.id;
        if (!id) {
            id = nextId("q");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.questions.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.questions.delete(id);
    }

    public async findByIds(ids: string[]): Promise<Question[]> {
        return ids.map((id) => this.questions.get(id)).filter((q): q is Question => !!q);
    }

    public async findByTestId(testId: string): Promise<Question[]> {
        return Array.from(this.questions.values()).filter((q) => q.testId === testId);
    }

    public async findBySectionAndModule(
        testId: string,
        section: string,
        module: number
    ): Promise<Question[]> {
        return Array.from(this.questions.values()).filter(
            (q) =>
                q.testId === testId &&
                q.section.toLowerCase() === section.toLowerCase() &&
                q.module === module
        );
    }

    public async count(): Promise<number> {
        return this.questions.size;
    }
}

export class InMemoryAttemptRepository implements IAttemptRepository {
    private attempts = new Map<string, Attempt>();

    public async findById(id: string): Promise<Attempt | null> {
        return this.attempts.get(id) || null;
    }

    public async save(entity: Attempt): Promise<Attempt> {
        let id = entity.id;
        if (!id) {
            id = nextId("attempt");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.attempts.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.attempts.delete(id);
    }

    public async findByUserId(userId: string): Promise<Attempt[]> {
        return Array.from(this.attempts.values()).filter((a) => a.userId === userId);
    }

    public async countByUserId(userId: string): Promise<number> {
        return (await this.findByUserId(userId)).length;
    }

    public async findRecentByUserId(userId: string, limit: number): Promise<Attempt[]> {
        const userAttempts = await this.findByUserId(userId);
        return userAttempts
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, limit);
    }

    public async count(): Promise<number> {
        return this.attempts.size;
    }
}

export class InMemoryErrorLogRepository implements IErrorLogRepository {
    private entries = new Map<string, ErrorLogEntry>();

    public async findById(id: string): Promise<ErrorLogEntry | null> {
        return this.entries.get(id) || null;
    }

    public async save(entity: ErrorLogEntry): Promise<ErrorLogEntry> {
        let id = entity.id;
        if (!id) {
            id = nextId("err");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.entries.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.entries.delete(id);
    }

    public async findByUserAndQuestion(
        userId: string,
        questionId: string
    ): Promise<ErrorLogEntry | null> {
        for (const entry of this.entries.values()) {
            if (entry.userId === userId && entry.questionId === questionId) {
                return entry;
            }
        }
        return null;
    }

    public async findByUserId(
        userId: string,
        filters?: ErrorLogQueryFilters
    ): Promise<ErrorLogEntry[]> {
        return Array.from(this.entries.values()).filter((e) => {
            if (e.userId !== userId) return false;
            if (filters?.status && e.status !== filters.status) return false;
            if (filters?.reason && e.reason !== filters.reason) return false;
            return true;
        });
    }

    public async countOpenByUserId(userId: string): Promise<number> {
        return Array.from(this.entries.values()).filter(
            (e) => e.userId === userId && e.status === "open"
        ).length;
    }
}

export class InMemoryVocabDeckRepository implements IVocabDeckRepository {
    private decks = new Map<string, VocabDeck>();

    public async findById(id: string): Promise<VocabDeck | null> {
        return this.decks.get(id) || null;
    }

    public async save(entity: VocabDeck): Promise<VocabDeck> {
        let id = entity.id;
        if (!id) {
            id = nextId("deck");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.decks.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.decks.delete(id);
    }

    public async findAllAvailable(userId?: string): Promise<VocabDeck[]> {
        return Array.from(this.decks.values()).filter(
            (d) => d.isSystem || (userId && d.ownerId === userId)
        );
    }

    public async findSystemDecks(): Promise<VocabDeck[]> {
        return Array.from(this.decks.values()).filter((d) => d.isSystem);
    }

    public async count(): Promise<number> {
        return this.decks.size;
    }
}

export class InMemoryVocabCardRepository implements IVocabCardRepository {
    private cards = new Map<string, VocabCard>();

    public async findById(id: string): Promise<VocabCard | null> {
        return this.cards.get(id) || null;
    }

    public async save(entity: VocabCard): Promise<VocabCard> {
        let id = entity.id;
        if (!id) {
            id = nextId("card");
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.cards.set(id, entity);
        return entity;
    }

    public async delete(id: string): Promise<boolean> {
        return this.cards.delete(id);
    }

    public async findByDeckId(deckId: string): Promise<VocabCard[]> {
        return Array.from(this.cards.values()).filter((c) => c.deckId === deckId);
    }

    public async findDueCards(deckIds: string[], now: Date): Promise<VocabCard[]> {
        const set = new Set(deckIds);
        return Array.from(this.cards.values()).filter(
            (c) => set.has(c.deckId) && c.isDue(now)
        );
    }

    public async countDueCards(deckIds: string[], now: Date): Promise<number> {
        return (await this.findDueCards(deckIds, now)).length;
    }
}
