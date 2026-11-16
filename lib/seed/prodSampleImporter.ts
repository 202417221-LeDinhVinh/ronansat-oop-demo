import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import Test, { ITest, Section } from "../models/Test";
import Question, { IQuestion } from "../models/Question";

export interface RawQuestionOption {
    id: string;
    option_code: string;
    option_text: string;
    display_order: number;
}

export interface RawCorrectOptions {
    option_id: string;
}

export interface RawQuestion {
    id: string;
    position: number;
    question_type: "multiple_choice" | "spr";
    question_text: string;
    passage: string | null;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    points: number;
    domain?: string;
    skill?: string;
    image_url?: string | null;
    question_options?: RawQuestionOption[];
    question_correct_options?: RawCorrectOptions;
}

export interface RawSection {
    name: "Verbal" | "Math" | string;
    module_number: number;
    display_order: number;
    question_count: number;
    time_limit_minutes: number;
    questions: RawQuestion[];
}

export interface RawTest {
    id: string;
    title: string;
    difficulty: string;
    time_limit_minutes: number;
    test_sections: RawSection[];
}

export interface ImportResult {
    test: ITest;
    questions: IQuestion[];
}

export interface ImportSummary {
    tests: ITest[];
    totalQuestions: number;
    details: {
        testId: string;
        title: string;
        sectionsCount: number;
        questionsCount: number;
    }[];
}

export function getLocalFigureFilename(url: string): string {
    const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
    let ext = ".png";
    try {
        const parsed = new URL(url);
        const parsedExt = path.extname(parsed.pathname);
        if (parsedExt && parsedExt.length <= 5) {
            ext = parsedExt;
        }
    } catch {
        // fallback
    }
    return `fig-${hash}${ext}`;
}

export function getLocalFigurePath(url: string): string {
    return `/demo-figures/${getLocalFigureFilename(url)}`;
}

export class ProdSampleImporter {
    private readonly dataFilePath: string;

    constructor(dataFilePath?: string) {
        this.dataFilePath = dataFilePath || path.resolve(process.cwd(), "data", "prod-sample-tests.json");
    }

    public loadRawData(): RawTest[] {
        if (!fs.existsSync(this.dataFilePath)) {
            throw new Error(`Data file not found at: ${this.dataFilePath}`);
        }
        const content = fs.readFileSync(this.dataFilePath, "utf-8");
        return JSON.parse(content) as RawTest[];
    }

    public mapSectionName(name: string): string {
        return name === "Verbal" ? "Reading and Writing" : name;
    }

    public resolveImageUrl(imageUrl?: string | null): string | undefined {
        if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
            return undefined;
        }
        return getLocalFigurePath(imageUrl);
    }

    public formatChoicesAndAnswer(rawQ: RawQuestion): { choices: string[]; correctAnswer: string } {
        const sortedOptions = [...(rawQ.question_options || [])].sort(
            (a, b) => a.display_order - b.display_order
        );
        const choices = sortedOptions.map((o) => o.option_text);
        const correctOptId = rawQ.question_correct_options?.option_id;
        const correctOpt = sortedOptions.find((o) => o.id === correctOptId);
        const correctAnswer = correctOpt ? correctOpt.option_text : choices[0] || "";
        return { choices, correctAnswer };
    }

    public mapQuestion(
        rawQ: RawQuestion,
        testId: mongoose.Types.ObjectId,
        sectionName: string,
        moduleNumber: number
    ): Partial<IQuestion> | null {
        if (rawQ.question_type === "spr") {
            return null; // Skip free-response questions
        }

        const { choices, correctAnswer } = this.formatChoicesAndAnswer(rawQ);

        return {
            testId,
            section: sectionName,
            module: moduleNumber,
            questionText: rawQ.question_text,
            passage: rawQ.passage ? rawQ.passage : undefined,
            choices,
            correctAnswer,
            explanation: rawQ.explanation || "",
            difficulty: rawQ.difficulty || "medium",
            points: rawQ.points || 10,
            imageUrl: this.resolveImageUrl(rawQ.image_url),
        };
    }

    public async importTest(rawTest: RawTest): Promise<ImportResult> {
        const sortedSections = [...rawTest.test_sections].sort((a, b) => a.display_order - b.display_order);

        const mappedSections: Section[] = [];
        const questionsToInsert: Partial<IQuestion>[] = [];

        const testDoc = new Test({
            title: rawTest.title,
            timeLimit: rawTest.time_limit_minutes || 134,
            difficulty: rawTest.difficulty || "medium",
            sections: [],
            questions: [],
        });

        for (const rawSec of sortedSections) {
            const sectionName = this.mapSectionName(rawSec.name);
            const sortedQuestions = [...rawSec.questions].sort((a, b) => a.position - b.position);

            let sectionImportedCount = 0;
            for (const rawQ of sortedQuestions) {
                const mappedQ = this.mapQuestion(rawQ, testDoc._id as any, sectionName, rawSec.module_number);
                if (mappedQ) {
                    questionsToInsert.push(mappedQ);
                    sectionImportedCount++;
                }
            }

            mappedSections.push({
                name: sectionName,
                questionsCount: sectionImportedCount,
                timeLimit: rawSec.time_limit_minutes,
            });
        }

        const insertedQuestions = await Question.insertMany(questionsToInsert);

        testDoc.sections = mappedSections;
        testDoc.questions = insertedQuestions.map((q) => q._id as any);
        await testDoc.save();

        return {
            test: testDoc,
            questions: insertedQuestions as unknown as IQuestion[],
        };
    }

    public async importAll(): Promise<ImportSummary> {
        const rawTests = this.loadRawData();
        const tests: ITest[] = [];
        const details: ImportSummary["details"] = [];
        let totalQuestions = 0;

        for (const rawTest of rawTests) {
            const result = await this.importTest(rawTest);
            tests.push(result.test);
            totalQuestions += result.questions.length;
            details.push({
                testId: result.test._id.toString(),
                title: result.test.title,
                sectionsCount: result.test.sections.length,
                questionsCount: result.questions.length,
            });
        }

        return {
            tests,
            totalQuestions,
            details,
        };
    }
}
