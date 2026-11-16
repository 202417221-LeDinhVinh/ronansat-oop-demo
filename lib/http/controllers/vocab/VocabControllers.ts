import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { BaseController, ResolvedRequestContext } from "../../BaseController";
import { VocabService } from "../../../application/services/VocabService";
import { UnauthorizedError, ValidationError } from "../../../domain/shared/DomainError";
import { ReviewGrade } from "../../../domain/vocab/ReviewGrade";

// --- Decks ---
export class GetVocabDecksController extends BaseController {
    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(_input: unknown, _req: NextRequest | Request, session: Session | null): Promise<unknown> {
        const decks = await this.vocabService.getDecks(session?.user?.id);
        const dueCount = await this.vocabService.getDueCount(session?.user?.id);

        return {
            decks: decks.map((d) => ({
                _id: d.id,
                title: d.title,
                description: d.description,
                isSystem: d.isSystem,
                ownerId: d.ownerId,
                totalCards: d.cards.length,
                dueCount: d.countDueCards(),
                createdAt: d.createdAt,
            })),
            totalDueToday: dueCount,
        };
    }
}

const createDeckSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().default(""),
});

export class CreateVocabDeckController extends BaseController<z.infer<typeof createDeckSchema>> {
    protected override schema = createDeckSchema;
    protected override successStatus = 201;

    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof createDeckSchema>,
        _req: NextRequest | Request,
        session: Session | null
    ): Promise<unknown> {
        if (!session?.user?.id) {
            throw new UnauthorizedError("Must be logged in to create a vocabulary deck");
        }

        const deck = await this.vocabService.createDeck(session.user.id, input);
        return {
            deck: {
                _id: deck.id,
                title: deck.title,
                description: deck.description,
                isSystem: deck.isSystem,
                createdAt: deck.createdAt,
            },
        };
    }
}

export class GetVocabDeckDetailController extends BaseController {
    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Deck id is required");

        const detail = await this.vocabService.getDeck(id, session?.user?.id);

        return {
            deck: {
                _id: detail.deck.id,
                title: detail.deck.title,
                description: detail.deck.description,
                isSystem: detail.deck.isSystem,
                dueCount: detail.dueCount,
                createdAt: detail.deck.createdAt,
            },
            cards: detail.cards.map((c) => ({
                _id: c.id,
                deckId: c.deckId,
                word: c.word,
                partOfSpeech: c.partOfSpeech,
                definition: c.definition,
                exampleSentence: c.exampleSentence,
                box: c.box,
                nextReviewDate: c.nextReviewDate,
                intervalDays: c.intervalDays,
                reviewCount: c.reviewCount,
                isDue: c.isDue(),
            })),
        };
    }
}

export class UpdateVocabDeckController extends BaseController<z.infer<typeof createDeckSchema>> {
    protected override schema = createDeckSchema;

    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof createDeckSchema>,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Authentication required");
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Deck id is required");

        const isAdmin = session.user.role === "admin";
        const deck = await this.vocabService.updateDeck(id, session.user.id, input, isAdmin);

        return {
            deck: {
                _id: deck.id,
                title: deck.title,
                description: deck.description,
            },
        };
    }
}

export class DeleteVocabDeckController extends BaseController {
    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Authentication required");
        const id = context?.params?.id as string;
        if (!id) throw new ValidationError("Deck id is required");

        const isAdmin = session.user.role === "admin";
        await this.vocabService.deleteDeck(id, session.user.id, isAdmin);

        return { success: true };
    }
}

// --- Cards & Spaced Repetition ---
const cardSchema = z.object({
    word: z.string().min(1, "Word is required"),
    partOfSpeech: z.string().default(""),
    definition: z.string().default(""),
    exampleSentence: z.string().default(""),
});

export class CreateVocabCardController extends BaseController<z.infer<typeof cardSchema>> {
    protected override schema = cardSchema;
    protected override successStatus = 201;

    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof cardSchema>,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Authentication required");
        const deckId = context?.params?.id as string;
        if (!deckId) throw new ValidationError("Deck id is required");

        const isAdmin = session.user.role === "admin";
        const card = await this.vocabService.createCard(session.user.id, deckId, input, isAdmin);

        return {
            card: {
                _id: card.id,
                deckId: card.deckId,
                word: card.word,
                partOfSpeech: card.partOfSpeech,
                definition: card.definition,
                exampleSentence: card.exampleSentence,
                box: card.box,
            },
        };
    }
}

export class UpdateVocabCardController extends BaseController<z.infer<typeof cardSchema>> {
    protected override schema = cardSchema;

    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof cardSchema>,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Authentication required");
        const cardId = context?.params?.id as string;
        if (!cardId) throw new ValidationError("Card id is required");

        const isAdmin = session.user.role === "admin";
        const card = await this.vocabService.updateCard(session.user.id, cardId, input, isAdmin);

        return {
            card: {
                _id: card.id,
                word: card.word,
                partOfSpeech: card.partOfSpeech,
                definition: card.definition,
                exampleSentence: card.exampleSentence,
            },
        };
    }
}

export class DeleteVocabCardController extends BaseController {
    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        _input: unknown,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Authentication required");
        const cardId = context?.params?.id as string;
        if (!cardId) throw new ValidationError("Card id is required");

        const isAdmin = session.user.role === "admin";
        await this.vocabService.deleteCard(session.user.id, cardId, isAdmin);

        return { success: true };
    }
}

export class GetDueCardsController extends BaseController {
    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(_input: unknown, _req: NextRequest | Request, session: Session | null): Promise<unknown> {
        const dueCards = await this.vocabService.getDueCards(session?.user?.id);
        const mapped = dueCards.map((c) => ({
            _id: c.id,
            deckId: c.deckId,
            word: c.word,
            partOfSpeech: c.partOfSpeech,
            definition: c.definition,
            exampleSentence: c.exampleSentence,
            box: c.box,
            nextReviewDate: c.nextReviewDate,
            reviewCount: c.reviewCount,
        }));
        return {
            dueCards: mapped,
            cards: mapped,
            dueCount: dueCards.length,
        };
    }
}

const reviewSchema = z.object({
    grade: z.union([
        z.enum(["again", "hard", "good", "easy"]),
        z.number().int().min(1).max(5).transform((n): ReviewGrade => {
            if (n === 1) return "again";
            if (n === 2) return "hard";
            if (n === 3) return "good";
            return "easy";
        }),
    ]),
});

export class ReviewVocabCardController extends BaseController<z.infer<typeof reviewSchema>> {
    protected override schema = reviewSchema;

    public constructor(private readonly vocabService: VocabService) {
        super();
    }

    protected async execute(
        input: z.infer<typeof reviewSchema>,
        _req: NextRequest | Request,
        session: Session | null,
        context?: ResolvedRequestContext
    ): Promise<unknown> {
        if (!session?.user?.id) throw new UnauthorizedError("Must be logged in to review cards");
        const cardId = context?.params?.id as string;
        if (!cardId) throw new ValidationError("Card id is required");

        const updated = await this.vocabService.reviewCard(
            session.user.id,
            cardId,
            input.grade as ReviewGrade
        );

        return {
            card: {
                _id: updated.id,
                cardId: updated.id,
                word: updated.word,
                box: updated.box,
                nextReviewDate: updated.nextReviewDate,
                intervalDays: updated.intervalDays,
                reviewCount: updated.reviewCount,
            },
            cardId: updated.id,
            box: updated.box,
            nextReviewDate: updated.nextReviewDate,
            intervalDays: updated.intervalDays,
            reviewCount: updated.reviewCount,
        };
    }
}
