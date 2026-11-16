import fs from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import { TestModel, ITestDoc, ISectionDoc } from "../persistence/schemas/TestSchema";
import { QuestionModel, IQuestionDoc } from "../persistence/schemas/QuestionSchema";

export interface RawQuestionOption {
    id: string;
    option_code: string;
    option_text: string;
    display_order: number;
}

export interface RawCorrectOptions {
    option_id: string;
}

export interface RawSprAnswer {
    display_order: number;
    accepted_answer: string;
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
    question_correct_options?: RawCorrectOptions | null;
    question_spr_accepted_answers?: RawSprAnswer[];
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
    test: ITestDoc;
    questions: IQuestionDoc[];
}

export interface ImportSummary {
    tests: ITestDoc[];
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

    public constructor(dataFilePath?: string) {
        this.dataFilePath =
            dataFilePath || path.resolve(process.cwd(), "data", "prod-sample-tests.json");
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
        const hash = crypto.createHash("sha256").update(imageUrl).digest("hex").slice(0, 16);
        let ext = ".png";
        try {
            const parsed = new URL(imageUrl);
            const parsedExt = path.extname(parsed.pathname);
            if (parsedExt && parsedExt.length <= 5) {
                ext = parsedExt;
            }
        } catch {
            // fallback
        }
        return `/demo-figures/fig-${hash}${ext}`;
    }

    public mapQuestion(
        rawQ: RawQuestion,
        testId: mongoose.Types.ObjectId,
        sectionName: string,
        moduleNumber: number
    ): Partial<IQuestionDoc> {
        const isSpr = rawQ.question_type === "spr";
        let choices: string[] = [];
        let correctAnswer = "";
        let acceptedAnswers: string[] = [];

        if (isSpr) {
            acceptedAnswers = (rawQ.question_spr_accepted_answers || []).map((a) => a.accepted_answer);
            correctAnswer = acceptedAnswers[0] || "";
        } else {
            const sortedOptions = [...(rawQ.question_options || [])].sort(
                (a, b) => a.display_order - b.display_order
            );
            choices = sortedOptions.map((o) => o.option_text);
            const correctOptId = rawQ.question_correct_options?.option_id;
            const correctOpt = sortedOptions.find((o) => o.id === correctOptId);
            correctAnswer = correctOpt ? correctOpt.option_text : choices[0] || "";
        }

        return {
            testId,
            section: sectionName,
            module: moduleNumber,
            questionText: rawQ.question_text,
            passage: rawQ.passage || undefined,
            choices,
            correctAnswer,
            acceptedAnswers: isSpr ? acceptedAnswers : undefined,
            questionType: isSpr ? "spr" : "multiple_choice",
            explanation: rawQ.explanation || "",
            difficulty: rawQ.difficulty || "medium",
            points: rawQ.points || 10,
            domain: rawQ.domain,
            skill: rawQ.skill,
            imageUrl: this.resolveImageUrl(rawQ.image_url),
        };
    }

    public async importTest(rawTest: RawTest): Promise<ImportResult> {
        const sortedSections = [...rawTest.test_sections].sort((a, b) => a.display_order - b.display_order);

        const mappedSections: ISectionDoc[] = [];
        const questionsToInsert: Partial<IQuestionDoc>[] = [];

        const testDoc = new TestModel({
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
                const mappedQ = this.mapQuestion(rawQ, testDoc._id, sectionName, rawSec.module_number);
                questionsToInsert.push(mappedQ);
                sectionImportedCount++;
            }

            mappedSections.push({
                name: sectionName,
                module: rawSec.module_number,
                questionsCount: sectionImportedCount,
                timeLimit: rawSec.time_limit_minutes,
            });
        }

        const insertedQuestions = await QuestionModel.insertMany(questionsToInsert);

        const totalTimeLimit = mappedSections.reduce((acc, s) => acc + (s.timeLimit || 0), 0) || 134;
        testDoc.timeLimit = totalTimeLimit;
        testDoc.sections = mappedSections;
        testDoc.questions = insertedQuestions.map((q) => q._id);
        await testDoc.save();

        return {
            test: testDoc,
            questions: insertedQuestions as unknown as IQuestionDoc[],
        };
    }

    public async importAll(): Promise<ImportSummary> {
        const rawTests = this.loadRawData();
        const tests: ITestDoc[] = [];
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
