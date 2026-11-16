import { IRepository } from "./IRepository";
import { VocabCard } from "../../../domain/vocab";

export interface IVocabCardRepository extends IRepository<VocabCard, string> {
    findByDeckId(deckId: string): Promise<VocabCard[]>;
    findDueCards(deckIds: string[], now: Date): Promise<VocabCard[]>;
    countDueCards(deckIds: string[], now: Date): Promise<number>;
}
