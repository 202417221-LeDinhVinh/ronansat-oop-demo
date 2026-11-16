import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import Test from "./models/Test";
import Question, { IQuestion } from "./models/Question";
import Result from "./models/Result";
import Student from "./models/studentCard";
import { ProdSampleImporter } from "./seed/prodSampleImporter";

export const DEMO_ADMIN = {
    name: "Demo Admin",
    email: "admin@ronansat.com",
    password: "AdminPassword123!",
    role: "admin" as const,
};

export const DEMO_STUDENT = {
    name: "Demo Student",
    email: "student@ronansat.com",
    password: "StudentPassword123!",
    role: "user" as const,
};

export async function seedDatabase(mongoUri: string) {
    console.log("Connecting to MongoDB for seeding...");
    const conn = await mongoose.connect(mongoUri);

    try {
        // 1. Clear old demo data for a clean slate
        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await Test.deleteMany({});
        await Question.deleteMany({});
        await Result.deleteMany({});
        await Student.deleteMany({});

        // 2. Create Admin and Student Users
        const adminPasswordHash = await bcrypt.hash(DEMO_ADMIN.password, 10);
        const studentPasswordHash = await bcrypt.hash(DEMO_STUDENT.password, 10);

        const adminUser = await User.create({
            name: DEMO_ADMIN.name,
            email: DEMO_ADMIN.email,
            password: adminPasswordHash,
            role: DEMO_ADMIN.role,
            testsTaken: [],
            highestScore: 1480,
            wrongQuestions: [],
        });

        const studentUser = await User.create({
            name: DEMO_STUDENT.name,
            email: DEMO_STUDENT.email,
            password: studentPasswordHash,
            role: DEMO_STUDENT.role,
            testsTaken: [],
            highestScore: 1540,
            lastTestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            wrongQuestions: [],
        });

        console.log(`Created users: Admin (${adminUser.email}), Student (${studentUser.email})`);

        // 3. Import Both Prod Sample Tests via ProdSampleImporter
        console.log("Importing production sample tests...");
        const importer = new ProdSampleImporter();
        const rawTests = importer.loadRawData();

        const importedResults: { test: any; questions: IQuestion[] }[] = [];
        for (const rawTest of rawTests) {
            const res = await importer.importTest(rawTest);
            importedResults.push(res);
            console.log(
                `Imported test "${res.test.title}" (${res.test.sections.length} sections, ${res.questions.length} questions)`
            );
        }

        const [test1Data, test2Data] = importedResults;
        const test1 = test1Data.test;
        const questions1 = test1Data.questions;
        const test2 = test2Data?.test;
        const questions2 = test2Data?.questions;

        // 4. Create Realistic Past Results for Student & Admin
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        // A. Student's Full-Length Test 1 Result (Score: 1520 - RW: 760, Math: 760)
        // Mark 4 questions incorrect (2 in Reading and Writing, 2 in Math)
        const studentWrongQIds: mongoose.Types.ObjectId[] = [];
        const studentTest1Answers = questions1.map((q, index) => {
            const isIncorrect = index === 5 || index === 20 || index === 60 || index === 75;
            let userAnswer = q.correctAnswer;
            if (isIncorrect) {
                studentWrongQIds.push(q._id as any);
                const wrongChoice = q.choices.find((c) => c !== q.correctAnswer) || q.choices[0];
                userAnswer = wrongChoice;
            }
            return {
                questionId: q._id,
                userAnswer,
                isCorrect: !isIncorrect,
            };
        });

        const _studentResultTest1 = await Result.create({
            userId: studentUser._id,
            testId: test1._id,
            isSectional: false,
            score: 1520,
            sectionBreakdown: {
                readingAndWriting: 760,
                math: 760,
            },
            answers: studentTest1Answers,
            date: twoDaysAgo,
            createdAt: twoDaysAgo,
        });

        // B. Student's Full-Length Test 2 Result (Score: 1540 - RW: 770, Math: 770)
        if (test2 && questions2) {
            const studentTest2Answers = questions2.map((q, index) => {
                const isIncorrect = index === 10 || index === 30 || index === 70;
                let userAnswer = q.correctAnswer;
                if (isIncorrect) {
                    studentWrongQIds.push(q._id as any);
                    const wrongChoice = q.choices.find((c) => c !== q.correctAnswer) || q.choices[0];
                    userAnswer = wrongChoice;
                }
                return {
                    questionId: q._id,
                    userAnswer,
                    isCorrect: !isIncorrect,
                };
            });

            await Result.create({
                userId: studentUser._id,
                testId: test2._id,
                isSectional: false,
                score: 1540,
                sectionBreakdown: {
                    readingAndWriting: 770,
                    math: 770,
                },
                answers: studentTest2Answers,
                date: oneDayAgo,
                createdAt: oneDayAgo,
            });
        }

        // C. Student's Sectional Practice Result (Test 1, Reading & Writing, Module 1: 26 / 27 correct)
        const rwModule1Questions = questions1.filter(
            (q) => q.section === "Reading and Writing" && q.module === 1
        );
        const sectionalAnswers = rwModule1Questions.map((q, index) => {
            const isIncorrect = index === 3;
            let userAnswer = q.correctAnswer;
            if (isIncorrect) {
                userAnswer = q.choices.find((c) => c !== q.correctAnswer) || q.choices[0];
            }
            return {
                questionId: q._id,
                userAnswer,
                isCorrect: !isIncorrect,
            };
        });

        await Result.create({
            userId: studentUser._id,
            testId: test1._id,
            isSectional: true,
            sectionalSubject: "Reading and Writing",
            sectionalModule: 1,
            score: 26,
            answers: sectionalAnswers,
            date: threeDaysAgo,
            createdAt: threeDaysAgo,
        });

        // Update Student User stats
        studentUser.testsTaken.push(test1._id as any);
        if (test2) studentUser.testsTaken.push(test2._id as any);
        studentUser.wrongQuestions.push(...studentWrongQIds);
        studentUser.highestScore = 1540;
        studentUser.lastTestDate = oneDayAgo;
        await studentUser.save();

        // D. Admin Result for multi-user Leaderboard (Score: 1480 - RW: 720, Math: 760)
        const adminTest1Answers = questions1.map((q, index) => {
            const isIncorrect = index % 12 === 0;
            let userAnswer = q.correctAnswer;
            if (isIncorrect) {
                userAnswer = q.choices.find((c) => c !== q.correctAnswer) || q.choices[0];
            }
            return {
                questionId: q._id,
                userAnswer,
                isCorrect: !isIncorrect,
            };
        });

        await Result.create({
            userId: adminUser._id,
            testId: test1._id,
            isSectional: false,
            score: 1480,
            sectionBreakdown: {
                readingAndWriting: 720,
                math: 760,
            },
            answers: adminTest1Answers,
            date: fourDaysAgo,
            createdAt: fourDaysAgo,
        });

        adminUser.testsTaken.push(test1._id as any);
        adminUser.highestScore = 1480;
        await adminUser.save();

        console.log(
            `Created past results: Student (1520 & 1540), Admin (1480), Sectional (26/27)`
        );

        // 5. Create Hall of Fame Students
        await Student.insertMany([
            {
                name: "Alex Morgan",
                school: "Stanford Pre-Collegiate",
                score: 1580,
                examDate: "Oct 2025",
                imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
            },
            {
                name: "Sarah Chen",
                school: "Thomas Jefferson High",
                score: 1550,
                examDate: "Nov 2025",
                imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
            },
            {
                name: "Marcus Johnson",
                school: "Stuyvesant High School",
                score: 1510,
                examDate: "Dec 2025",
                imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
            },
        ]);

        console.log("Seeded Hall of Fame student cards.");
        console.log("Database seeding completed successfully!");
    } finally {
        await conn.disconnect();
    }
}
