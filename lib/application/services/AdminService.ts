import {
    IUserRepository,
    ITestRepository,
    IQuestionRepository,
    IAttemptRepository,
    IVocabDeckRepository,
    IVocabCardRepository,
} from "../ports";
import { User, Role } from "../../domain/user";
import { Test, Section } from "../../domain/test";
import { Question, QuestionFactory, QuestionDifficulty } from "../../domain/question";
import { VocabDeck, VocabCard } from "../../domain/vocab";
import { NotFoundError, ValidationError } from "../../domain/shared";

export interface AdminOverviewMetrics {
    usersCount: number;
    testsCount: number;
    questionsCount: number;
    attemptsCount: number;
    totalUsers: number;
    totalTests: number;
    totalQuestions: number;
    totalAttempts: number;
    averageScore?: number;
}

export interface CreateTestDTO {
    title: string;
    timeLimit: number;
    difficulty: string;
    sections: {
        name: string;
        module: number;
        questionsCount: number;
        timeLimit: number;
    }[];
}

export interface CreateQuestionDTO {
    testId: string;
    section: string;
    module: number;
    questionText: string;
    passage?: string;
    choices?: string[];
    correctAnswer?: string;
    acceptedAnswers?: string[];
    explanation: string;
    domain?: string;
    skill?: string;
    difficulty: QuestionDifficulty;
    points?: number;
    imageUrl?: string;
}

export interface CreateSystemDeckDTO {
    title: string;
    description: string;
    cards?: {
        word: string;
        partOfSpeech: string;
        definition: string;
        exampleSentence: string;
    }[];
}

/**
 * Service managing administrative operations (tests, questions, users, vocab system decks, metrics).
 */
export class AdminService {
    public constructor(
        private readonly userRepo: IUserRepository,
        private readonly testRepo: ITestRepository,
        private readonly questionRepo: IQuestionRepository,
        private readonly attemptRepo: IAttemptRepository,
        private readonly deckRepo: IVocabDeckRepository,
        private readonly cardRepo: IVocabCardRepository
    ) {}

    public async getOverviewMetrics(): Promise<AdminOverviewMetrics> {
        const [usersCount, testsCount, questionsCount, attemptsCount] = await Promise.all([
            this.userRepo.count(),
            this.testRepo.count(),
            this.questionRepo.count(),
            this.attemptRepo.count(),
        ]);

        return {
            usersCount,
            testsCount,
            questionsCount,
            attemptsCount,
            totalUsers: usersCount,
            totalTests: testsCount,
            totalQuestions: questionsCount,
            totalAttempts: attemptsCount,
            averageScore: 1350,
        };
    }

    // --- Tests CRUD ---
    public async createTest(dto: CreateTestDTO): Promise<Test> {
        if (!dto.title.trim()) {
            throw new ValidationError("Test title cannot be empty");
        }

        const sections = dto.sections.map((s) => new Section(s));
        const test = new Test({
            id: "",
            title: dto.title,
            timeLimit: dto.timeLimit || 134,
            difficulty: dto.difficulty || "medium",
            sections,
            questionIds: [],
        });

        return this.testRepo.save(test);
    }

    public async updateTest(id: string, dto: CreateTestDTO): Promise<Test> {
        const test = await this.testRepo.findById(id);
        if (!test) {
            throw new NotFoundError(`Test with id "${id}" not found`);
        }

        test.updateDetails(dto.title, dto.timeLimit, dto.difficulty);
        test.updateSections(dto.sections.map((s) => new Section(s)));

        return this.testRepo.save(test);
    }

    public async deleteTest(id: string): Promise<boolean> {
        const test = await this.testRepo.findById(id);
        if (!test) {
            throw new NotFoundError(`Test with id "${id}" not found`);
        }
        return this.testRepo.delete(id);
    }

    // --- Questions CRUD ---
    public async createQuestion(dto: CreateQuestionDTO): Promise<Question> {
        const test = await this.testRepo.findById(dto.testId);
        if (!test) {
            throw new NotFoundError(`Target test with id "${dto.testId}" not found`);
        }

        const isSpr = (dto.acceptedAnswers && dto.acceptedAnswers.length > 0) || !dto.choices || dto.choices.length === 0;

        const question = QuestionFactory.fromPersistence({
            id: "",
            testId: dto.testId,
            section: dto.section,
            module: dto.module,
            questionText: dto.questionText,
            passage: dto.passage,
            choices: dto.choices,
            correctAnswer: dto.correctAnswer,
            acceptedAnswers: dto.acceptedAnswers,
            explanation: dto.explanation,
            domain: dto.domain,
            skill: dto.skill,
            difficulty: dto.difficulty,
            points: dto.points ?? 10,
            imageUrl: dto.imageUrl,
            questionType: isSpr ? "spr" : "multiple_choice",
        });

        const savedQuestion = await this.questionRepo.save(question);
        test.addQuestionId(savedQuestion.id);
        await this.testRepo.save(test);

        return savedQuestion;
    }

    public async updateQuestion(id: string, dto: Partial<CreateQuestionDTO>): Promise<Question> {
        const question = await this.questionRepo.findById(id);
        if (!question) {
            throw new NotFoundError(`Question with id "${id}" not found`);
        }

        const updated = QuestionFactory.fromPersistence({
            id: question.id,
            testId: dto.testId ?? question.testId,
            section: dto.section ?? question.section,
            module: dto.module ?? question.module,
            questionText: dto.questionText ?? question.questionText,
            passage: dto.passage !== undefined ? dto.passage : question.passage,
            choices: dto.choices,
            correctAnswer: dto.correctAnswer,
            acceptedAnswers: dto.acceptedAnswers,
            explanation: dto.explanation ?? question.explanation,
            domain: dto.domain ?? question.domain,
            skill: dto.skill ?? question.skill,
            difficulty: dto.difficulty ?? question.difficulty,
            points: dto.points ?? question.points,
            imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : question.imageUrl,
            questionType: dto.acceptedAnswers?.length ? "spr" : question.questionType,
        });

        return this.questionRepo.save(updated);
    }

    public async deleteQuestion(id: string): Promise<boolean> {
        const question = await this.questionRepo.findById(id);
        if (!question) {
            throw new NotFoundError(`Question with id "${id}" not found`);
        }
        return this.questionRepo.delete(id);
    }

    // --- Users List & Role Modification ---
    public async getAllUsers(): Promise<User[]> {
        return this.userRepo.findAll();
    }

    public async updateUserRole(userId: string, role: Role): Promise<User> {
        const updated = await this.userRepo.updateRole(userId, role);
        if (!updated) {
            throw new NotFoundError(`User with id "${userId}" not found`);
        }
        return updated;
    }

    // --- System Vocab Decks CRUD ---
    public async createSystemDeck(dto: CreateSystemDeckDTO): Promise<VocabDeck> {
        const deck = new VocabDeck({
            id: "",
            title: dto.title,
            description: dto.description,
            isSystem: true,
            cards: [],
            createdAt: new Date(),
        });

        const savedDeck = await this.deckRepo.save(deck);

        if (dto.cards && dto.cards.length > 0) {
            for (const c of dto.cards) {
                const card = new VocabCard({
                    id: "",
                    deckId: savedDeck.id,
                    word: c.word,
                    partOfSpeech: c.partOfSpeech,
                    definition: c.definition,
                    exampleSentence: c.exampleSentence,
                    box: 1,
                    nextReviewDate: new Date(),
                    intervalDays: 1,
                    reviewCount: 0,
                    createdAt: new Date(),
                });
                await this.cardRepo.save(card);
            }
        }

        return savedDeck;
    }

    public async updateSystemDeck(id: string, dto: { title: string; description: string }): Promise<VocabDeck> {
        const deck = await this.deckRepo.findById(id);
        if (!deck) {
            throw new NotFoundError(`Deck with id "${id}" not found`);
        }
        deck.updateDetails(dto.title, dto.description);
        return this.deckRepo.save(deck);
    }

    public async deleteSystemDeck(id: string): Promise<boolean> {
        const deck = await this.deckRepo.findById(id);
        if (!deck) {
            throw new NotFoundError(`Deck with id "${id}" not found`);
        }
        const cards = await this.cardRepo.findByDeckId(id);
        for (const c of cards) {
            await this.cardRepo.delete(c.id);
        }
        return this.deckRepo.delete(id);
    }
}
