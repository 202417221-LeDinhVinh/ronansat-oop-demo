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
import { IRepository } from "../../../application/ports/repositories/IRepository";
import { Entity } from "../../../domain/shared/Entity";
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

/**
 * Ch.9(a): ONE generic in-memory repository.
 *
 * Every test fake used to duplicate the same Map-based CRUD code. This abstract class is
 * parameterized by the entity and id types (`T extends Entity<TId>, TId = string`) and
 * implements `IRepository<T, TId>` once. The small subclasses below only add the extra
 * query methods required by their port interface.
 *
 * Pattern: Repository Pattern + Template Method (subclasses supply the id prefix).
 */
export abstract class InMemoryRepository<
    TEntity extends Entity<TId>,
    TId = string
> implements IRepository<TEntity, TId> {
    protected readonly items = new Map<TId, TEntity>();
    protected abstract readonly idPrefix: string;

    public async findById(id: TId): Promise<TEntity | null> {
        return this.items.get(id) ?? null;
    }

    public async save(entity: TEntity): Promise<TEntity> {
        let id = entity.id;
        if (!id) {
            id = this.generateId();
            Object.defineProperty(entity, "_id", { value: id, writable: false });
        }
        this.items.set(id, entity);
        return entity;
    }

    public async delete(id: TId): Promise<boolean> {
        return this.items.delete(id);
    }

    public async findAll(): Promise<TEntity[]> {
        return this.all();
    }

    public async count(): Promise<number> {
        return this.items.size;
    }

    protected all(): TEntity[] {
        return Array.from(this.items.values());
    }

    protected generateId(): TId {
        return nextId(this.idPrefix) as unknown as TId;
    }
}

/**
 * Thin subclass: only the user-specific queries live here.
 */
export class InMemoryUserRepository
    extends InMemoryRepository<User>
    implements IUserRepository
{
    protected readonly idPrefix: string = "user";

    public async findByEmail(email: string): Promise<User | null> {
        const normalized = email.trim().toLowerCase();
        return this.all().find((user) => user.email.value === normalized) ?? null;
    }

    public async updateRole(id: string, role: Role): Promise<User | null> {
        const user = this.items.get(id);
        if (!user) return null;
        Object.defineProperty(user, "_role", { value: role, writable: false });
        return user;
    }
}

/**
 * Thin subclass: the base class already provides findAll, findById, save, delete, count.
 */
export class InMemoryTestRepository
    extends InMemoryRepository<Test>
    implements ITestRepository
{
    protected readonly idPrefix: string = "test";
}

/**
 * Thin subclass: adds the question lookup queries.
 */
export class InMemoryQuestionRepository
    extends InMemoryRepository<Question>
    implements IQuestionRepository
{
    protected readonly idPrefix: string = "q";

    public async findByIds(ids: string[]): Promise<Question[]> {
        return ids
            .map((id) => this.items.get(id))
            .filter((question): question is Question => !!question);
    }

    public async findByTestId(testId: string): Promise<Question[]> {
        return this.all().filter((question) => question.testId === testId);
    }

    public async findBySectionAndModule(
        testId: string,
        section: string,
        module: number
    ): Promise<Question[]> {
        return this.all().filter(
            (question) =>
                question.testId === testId &&
                question.section.toLowerCase() === section.toLowerCase() &&
                question.module === module
        );
    }
}

/**
 * Thin subclass: adds the per-user attempt queries.
 */
export class InMemoryAttemptRepository
    extends InMemoryRepository<Attempt>
    implements IAttemptRepository
{
    protected readonly idPrefix: string = "attempt";

    public async findByUserId(userId: string): Promise<Attempt[]> {
        return this.all().filter((attempt) => attempt.userId === userId);
    }

    public async countByUserId(userId: string): Promise<number> {
        return (await this.findByUserId(userId)).length;
    }

    public async findRecentByUserId(userId: string, limit: number): Promise<Attempt[]> {
        const attempts = await this.findByUserId(userId);
        return attempts
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, limit);
    }
}

/**
 * Thin subclass: adds the per-user error log queries.
 */
export class InMemoryErrorLogRepository
    extends InMemoryRepository<ErrorLogEntry>
    implements IErrorLogRepository
{
    protected readonly idPrefix: string = "err";

    public async findByUserAndQuestion(
        userId: string,
        questionId: string
    ): Promise<ErrorLogEntry | null> {
        return (
            this.all().find(
                (entry) => entry.userId === userId && entry.questionId === questionId
            ) ?? null
        );
    }

    public async findByUserId(
        userId: string,
        filters?: ErrorLogQueryFilters
    ): Promise<ErrorLogEntry[]> {
        return this.all().filter((entry) => {
            if (entry.userId !== userId) return false;
            if (filters?.status && entry.status !== filters.status) return false;
            if (filters?.reason && entry.reason !== filters.reason) return false;
            return true;
        });
    }

    public async countOpenByUserId(userId: string): Promise<number> {
        return this.all().filter(
            (entry) => entry.userId === userId && entry.status === "open"
        ).length;
    }
}

/**
 * Thin subclass: adds the deck visibility queries.
 */
export class InMemoryVocabDeckRepository
    extends InMemoryRepository<VocabDeck>
    implements IVocabDeckRepository
{
    protected readonly idPrefix: string = "deck";

    public async findAllAvailable(userId?: string): Promise<VocabDeck[]> {
        return this.all().filter(
            (deck) => deck.isSystem || (userId !== undefined && deck.ownerId === userId)
        );
    }

    public async findSystemDecks(): Promise<VocabDeck[]> {
        return this.all().filter((deck) => deck.isSystem);
    }
}

/**
 * Thin subclass: adds the deck and due-date card queries.
 */
export class InMemoryVocabCardRepository
    extends InMemoryRepository<VocabCard>
    implements IVocabCardRepository
{
    protected readonly idPrefix: string = "card";

    public async findByDeckId(deckId: string): Promise<VocabCard[]> {
        return this.all().filter((card) => card.deckId === deckId);
    }

    public async findDueCards(deckIds: string[], now: Date): Promise<VocabCard[]> {
        const deckIdSet = new Set(deckIds);
        return this.all().filter(
            (card) => deckIdSet.has(card.deckId) && card.isDue(now)
        );
    }

    public async countDueCards(deckIds: string[], now: Date): Promise<number> {
        return (await this.findDueCards(deckIds, now)).length;
    }
}
