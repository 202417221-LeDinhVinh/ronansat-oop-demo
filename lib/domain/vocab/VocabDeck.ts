import { Entity } from "../shared/Entity";
import { VocabCard } from "./VocabCard";

export interface VocabDeckProps {
    id: string;
    title: string;
    description: string;
    isSystem: boolean;
    ownerId?: string;
    cards?: VocabCard[];
    createdAt?: Date;
}

/**
 * VocabDeck aggregate root.
 * Holds flashcards and metadata for an SAT vocabulary collection.
 * Pattern: DDD Aggregate Root.
 */
export class VocabDeck extends Entity<string> {
    private _title: string;
    private _description: string;
    private readonly _isSystem: boolean;
    private readonly _ownerId?: string;
    /** Composition: a deck owns its cards; removing the deck removes the cards with it. */
    private _cards: VocabCard[];
    private readonly _createdAt: Date;

    public constructor(props: VocabDeckProps) {
        super(props.id);
        this._title = props.title.trim();
        this._description = props.description.trim();
        this._isSystem = props.isSystem;
        this._ownerId = props.ownerId;
        this._cards = [...(props.cards ?? [])];
        this._createdAt = props.createdAt ?? new Date();
    }

    public get title(): string {
        return this._title;
    }

    public get description(): string {
        return this._description;
    }

    public get isSystem(): boolean {
        return this._isSystem;
    }

    public get ownerId(): string | undefined {
        return this._ownerId;
    }

    public get cards(): readonly VocabCard[] {
        return this._cards;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public addCard(card: VocabCard): void {
        this._cards.push(card);
    }

    public removeCard(cardId: string): void {
        this._cards = this._cards.filter((c) => c.id !== cardId);
    }

    public updateDetails(title: string, description: string): void {
        this._title = title.trim();
        this._description = description.trim();
    }

    public countDueCards(now: Date = new Date()): number {
        return this._cards.filter((c) => c.isDue(now)).length;
    }
}
