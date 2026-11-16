import {
    IVocabDeckRepository,
    IVocabCardRepository,
    Clock,
} from "../ports";
import {
    VocabDeck,
    VocabCard,
    ReviewGrade,
    ReviewScheduler,
} from "../../domain/vocab";
import { NotFoundError, ForbiddenError, ValidationError } from "../../domain/shared";

export interface CreateDeckDTO {
    title: string;
    description: string;
}

export interface CreateCardDTO {
    word: string;
    partOfSpeech: string;
    definition: string;
    exampleSentence: string;
}

/**
 * Service managing SAT vocabulary decks, flashcards, and spaced-repetition study reviews.
 */
export class VocabService {
    public constructor(
        private readonly deckRepo: IVocabDeckRepository,
        private readonly cardRepo: IVocabCardRepository,
        private readonly scheduler: ReviewScheduler,
        private readonly clock: Clock
    ) {}

    public async getDecks(userId?: string): Promise<VocabDeck[]> {
        const decks = await this.deckRepo.findAllAvailable(userId);

        // Populate cards count and due count for each deck
        for (const deck of decks) {
            const cards = await this.cardRepo.findByDeckId(deck.id);
            for (const c of cards) {
                deck.addCard(c);
            }
        }
        return decks;
    }

    public async getDeck(
        deckId: string,
        userId?: string
    ): Promise<{ deck: VocabDeck; cards: VocabCard[]; dueCount: number }> {
        const deck = await this.deckRepo.findById(deckId);
        if (!deck) {
            throw new NotFoundError(`Vocab deck with id "${deckId}" not found`);
        }
        if (!deck.isSystem && deck.ownerId && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot access another user's private deck");
        }

        const cards = await this.cardRepo.findByDeckId(deckId);
        const now = this.clock.now();
        const dueCount = cards.filter((c) => c.isDue(now)).length;

        return { deck, cards, dueCount };
    }

    public async createDeck(userId: string, dto: CreateDeckDTO): Promise<VocabDeck> {
        if (!dto.title.trim()) {
            throw new ValidationError("Deck title cannot be empty");
        }

        const deck = new VocabDeck({
            id: "",
            title: dto.title,
            description: dto.description || "",
            isSystem: false,
            ownerId: userId,
            cards: [],
            createdAt: this.clock.now(),
        });

        return this.deckRepo.save(deck);
    }

    public async updateDeck(
        deckId: string,
        userId: string,
        dto: CreateDeckDTO,
        isAdmin = false
    ): Promise<VocabDeck> {
        const deck = await this.deckRepo.findById(deckId);
        if (!deck) {
            throw new NotFoundError(`Vocab deck with id "${deckId}" not found`);
        }
        if (!isAdmin && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot modify another user's deck");
        }

        deck.updateDetails(dto.title, dto.description);
        return this.deckRepo.save(deck);
    }

    public async deleteDeck(deckId: string, userId: string, isAdmin = false): Promise<boolean> {
        const deck = await this.deckRepo.findById(deckId);
        if (!deck) {
            throw new NotFoundError(`Vocab deck with id "${deckId}" not found`);
        }
        if (!isAdmin && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot delete another user's deck");
        }

        // Delete associated cards first
        const cards = await this.cardRepo.findByDeckId(deckId);
        for (const c of cards) {
            await this.cardRepo.delete(c.id);
        }

        return this.deckRepo.delete(deckId);
    }

    public async getCards(deckId: string): Promise<VocabCard[]> {
        return this.cardRepo.findByDeckId(deckId);
    }

    public async createCard(
        userId: string,
        deckId: string,
        dto: CreateCardDTO,
        isAdmin = false
    ): Promise<VocabCard> {
        const deck = await this.deckRepo.findById(deckId);
        if (!deck) {
            throw new NotFoundError(`Deck with id "${deckId}" not found`);
        }
        if (!isAdmin && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot add cards to another user's deck");
        }
        if (!dto.word.trim()) {
            throw new ValidationError("Card word cannot be empty");
        }

        const now = this.clock.now();
        const card = new VocabCard({
            id: "",
            deckId,
            word: dto.word,
            partOfSpeech: dto.partOfSpeech || "",
            definition: dto.definition || "",
            exampleSentence: dto.exampleSentence || "",
            box: 1,
            nextReviewDate: now,
            intervalDays: 1,
            reviewCount: 0,
            createdAt: now,
        });

        return this.cardRepo.save(card);
    }

    public async updateCard(
        userId: string,
        cardId: string,
        dto: CreateCardDTO,
        isAdmin = false
    ): Promise<VocabCard> {
        const card = await this.cardRepo.findById(cardId);
        if (!card) {
            throw new NotFoundError(`Card with id "${cardId}" not found`);
        }

        const deck = await this.deckRepo.findById(card.deckId);
        if (!deck) {
            throw new NotFoundError(`Deck with id "${card.deckId}" not found`);
        }
        if (!isAdmin && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot modify another user's card");
        }

        card.updateContent(dto.word, dto.partOfSpeech, dto.definition, dto.exampleSentence);
        return this.cardRepo.save(card);
    }

    public async deleteCard(userId: string, cardId: string, isAdmin = false): Promise<boolean> {
        const card = await this.cardRepo.findById(cardId);
        if (!card) {
            throw new NotFoundError(`Card with id "${cardId}" not found`);
        }

        const deck = await this.deckRepo.findById(card.deckId);
        if (!deck) {
            throw new NotFoundError(`Deck with id "${card.deckId}" not found`);
        }
        if (!isAdmin && deck.ownerId !== userId) {
            throw new ForbiddenError("Cannot delete another user's card");
        }

        return this.cardRepo.delete(cardId);
    }

    public async getDueCards(userId?: string): Promise<VocabCard[]> {
        const availableDecks = await this.deckRepo.findAllAvailable(userId);
        const deckIds = availableDecks.map((d) => d.id);
        const now = this.clock.now();
        return this.cardRepo.findDueCards(deckIds, now);
    }

    public async getDueCount(userId?: string): Promise<number> {
        const availableDecks = await this.deckRepo.findAllAvailable(userId);
        const deckIds = availableDecks.map((d) => d.id);
        const now = this.clock.now();
        return this.cardRepo.countDueCards(deckIds, now);
    }

    public async reviewCard(
        userId: string,
        cardId: string,
        grade: ReviewGrade
    ): Promise<VocabCard> {
        const card = await this.cardRepo.findById(cardId);
        if (!card) {
            throw new NotFoundError(`Card with id "${cardId}" not found`);
        }

        const now = this.clock.now();
        card.review(grade, this.scheduler, now);

        return this.cardRepo.save(card);
    }
}
