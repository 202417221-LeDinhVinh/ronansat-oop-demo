import { IRepository } from "./IRepository";
import { VocabDeck } from "../../../domain/vocab";

export interface IVocabDeckRepository extends IRepository<VocabDeck, string> {
    findAllAvailable(userId?: string): Promise<VocabDeck[]>;
    findSystemDecks(): Promise<VocabDeck[]>;
    count(): Promise<number>;
}
