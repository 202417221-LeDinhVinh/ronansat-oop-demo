import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel } from "../persistence/schemas/UserSchema";
import { TestModel } from "../persistence/schemas/TestSchema";
import { QuestionModel } from "../persistence/schemas/QuestionSchema";
import { AttemptModel, IAnswerDoc } from "../persistence/schemas/AttemptSchema";
import { ErrorLogModel } from "../persistence/schemas/ErrorLogSchema";
import { VocabDeckModel } from "../persistence/schemas/VocabDeckSchema";
import { VocabCardModel } from "../persistence/schemas/VocabCardSchema";
import { ProdSampleImporter } from "./ProdSampleImporter";
import { FullLengthScoringStrategy } from "../../domain/scoring/FullLengthScoringStrategy";
import { SectionalScoringStrategy } from "../../domain/scoring/SectionalScoringStrategy";
import { Attempt } from "../../domain/attempt/Attempt";
import { AnswerRecord } from "../../domain/attempt/AnswerRecord";
import { QuestionFactory } from "../../domain/question/QuestionFactory";

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
    role: "student" as const,
};

// 80 High-Frequency real SAT words across 3 distinct decks
const SEED_DECKS = [
    {
        title: "Essential SAT Vocabulary (Core 30)",
        description: "Must-know words frequently appearing in SAT Reading & Writing passages.",
        cards: [
            { word: "Anachronism", partOfSpeech: "noun", definition: "Something belonging to another time period, especially earlier.", exampleSentence: "A modern smartphone in a Victorian period film is a glaring anachronism." },
            { word: "Belie", partOfSpeech: "verb", definition: "To give a false impression of; to contradict.", exampleSentence: "His calm demeanor belied the fierce panic raging beneath the surface." },
            { word: "Capitulate", partOfSpeech: "verb", definition: "To surrender or yield under agreed terms.", exampleSentence: "The defending army had to capitulate after running out of supplies." },
            { word: "Deference", partOfSpeech: "noun", definition: "Humble submission and respect.", exampleSentence: "He bowed his head in deference to the esteemed professor's verdict." },
            { word: "Ephemeral", partOfSpeech: "adjective", definition: "Lasting for a very short time; fleeting.", exampleSentence: "The blossoms of cherry trees are famous for their ephemeral spring beauty." },
            { word: "Fastidious", partOfSpeech: "adjective", definition: "Very attentive to accuracy and detail.", exampleSentence: "The copy editor was fastidious about grammatical precision." },
            { word: "Gregarious", partOfSpeech: "adjective", definition: "Fond of company; sociable.", exampleSentence: "Her gregarious personality made her popular at university social events." },
            { word: "Hackneyed", partOfSpeech: "adjective", definition: "Lacking significance through overuse; cliché.", exampleSentence: "The movie script relied heavily on hackneyed romance tropes." },
            { word: "Iconoclast", partOfSpeech: "noun", definition: "A person who attacks settled beliefs or institutions.", exampleSentence: "As an artistic iconoclast, she challenged the prevailing academic orthodoxy." },
            { word: "Juxtaposition", partOfSpeech: "noun", definition: "Placing two things close together for contrasting effect.", exampleSentence: "The juxtaposition of extreme wealth and poverty in the city was striking." },
            { word: "Laconic", partOfSpeech: "adjective", definition: "Using very few words; concise to the point of seeming rude.", exampleSentence: "The general gave a laconic reply: 'No.'" },
            { word: "Malleable", partOfSpeech: "adjective", definition: "Easily influenced, pliable, or adaptable.", exampleSentence: "Gold is a highly malleable metal that can be hammered into thin sheets." },
            { word: "Nebulous", partOfSpeech: "adjective", definition: "Vague, ill-defined, or in the form of a cloud.", exampleSentence: "His philosophical explanation remained nebulous and difficult to grasp." },
            { word: "Obdurate", partOfSpeech: "adjective", definition: "Stubbornly refusing to change one's opinion or action.", exampleSentence: "Despite overwhelming evidence, he remained obdurate in his denial." },
            { word: "Paradox", partOfSpeech: "noun", definition: "A seemingly contradictory statement that may nevertheless be true.", exampleSentence: "The paradox of technology is that it connects us globally while isolating us locally." },
            { word: "Quixotic", partOfSpeech: "adjective", definition: "Exceedingly idealistic; unrealistic and impractical.", exampleSentence: "His quixotic campaign to abolish all standardized testing won few backers." },
            { word: "Reticent", partOfSpeech: "adjective", definition: "Not revealing one's thoughts or feelings readily.", exampleSentence: "She was reticent about discussing her past research achievements." },
            { word: "Sagacious", partOfSpeech: "adjective", definition: "Having keen mental discernment and good judgment; wise.", exampleSentence: "The diplomat gave sagacious counsel during the international crisis." },
            { word: "Taciturn", partOfSpeech: "adjective", definition: "Reserved or uncommunicative in speech; untalkative.", exampleSentence: "The librarian was a taciturn man who preferred books to conversations." },
            { word: "Ubiquitous", partOfSpeech: "adjective", definition: "Present, appearing, or found everywhere.", exampleSentence: "Smartphones have become ubiquitous in modern secondary education." },
            { word: "Venerate", partOfSpeech: "verb", definition: "To regard with great respect; revere.", exampleSentence: "Scholars continue to venerate Newton's foundational contributions to physics." },
            { word: "Wary", partOfSpeech: "adjective", definition: "Feeling or showing caution about possible dangers or problems.", exampleSentence: "Investors grew wary as signs of inflation surfaced." },
            { word: "Zealous", partOfSpeech: "adjective", definition: "Having or showing great energy or enthusiasm for a cause.", exampleSentence: "The young activist was zealous in advocating for environmental policy reform." },
            { word: "Alacrity", partOfSpeech: "noun", definition: "Brisk and cheerful readiness.", exampleSentence: "She accepted the scholarship offer with palpable alacrity." },
            { word: "Cacophony", partOfSpeech: "noun", definition: "A harsh, discordant mixture of sounds.", exampleSentence: "A cacophony of car horns and construction drills greeted them each morning." },
            { word: "Didactic", partOfSpeech: "adjective", definition: "Intended to instruct or lecture, often with a moralizing tone.", exampleSentence: "The novel was criticized for being overtly didactic rather than entertaining." },
            { word: "Enervate", partOfSpeech: "verb", definition: "To cause someone to feel drained of energy or vitality.", exampleSentence: "The sweltering summer heat served to enervate the marathon runners." },
            { word: "Furtive", partOfSpeech: "adjective", definition: "Attempting to avoid notice or attention; secretive.", exampleSentence: "They cast furtive glances at each other across the tense conference table." },
            { word: "Garrulous", partOfSpeech: "adjective", definition: "Excessively talkative, especially on trivial matters.", exampleSentence: "Our garrulous neighbor could talk for hours about his garden." },
            { word: "Harangue", partOfSpeech: "noun", definition: "A lengthy and aggressive speech.", exampleSentence: "The coach delivered a stern harangue at halftime to rally the sluggish team." },
        ],
    },
    {
        title: "Advanced SAT Words & Rhetoric",
        description: "Challenging vocabulary and analytical phrasing for top 1500+ scorers.",
        cards: [
            { word: "Acumen", partOfSpeech: "noun", definition: "The ability to make good judgments and quick decisions.", exampleSentence: "Her business acumen allowed the startup to achieve profitability within a year." },
            { word: "Blandishment", partOfSpeech: "noun", definition: "A flattering or pleasing statement used to persuade.", exampleSentence: "He resisted all blandishments and stuck resolutely to the objective data." },
            { word: "Circumlocution", partOfSpeech: "noun", definition: "The use of many words where fewer would do, especially deliberately.", exampleSentence: "The politician resorted to circumlocution to evade answering the direct question." },
            { word: "Demagogue", partOfSpeech: "noun", definition: "A leader who seeks support by appealing to popular desires rather than reason.", exampleSentence: "History warns against the rise of demagogues during economic turmoil." },
            { word: "Equivocate", partOfSpeech: "verb", definition: "To use ambiguous language so as to conceal the truth.", exampleSentence: "When pressed for specifics, the spokesperson chose to equivocate." },
            { word: "Fractious", partOfSpeech: "adjective", definition: "Irritable and quarrelsome; difficult to control.", exampleSentence: "The fractious committee could not agree on even the committee agenda." },
            { word: "Grandiloquent", partOfSpeech: "adjective", definition: "Pompous or extravagant in language, style, or manner.", exampleSentence: "His grandiloquent speech failed to mask the emptiness of his proposal." },
            { word: "Hegemony", partOfSpeech: "noun", definition: "Leadership or dominance, especially by one country or social group over others.", exampleSentence: "The empire maintained its cultural hegemony over the surrounding provinces." },
            { word: "Inchoate", partOfSpeech: "adjective", definition: "Just begun and so not fully formed or developed; rudimentary.", exampleSentence: "His theory was still inchoate and required substantial empirical backing." },
            { word: "Juxtapose", partOfSpeech: "verb", definition: "To place close together for comparison or contrast.", exampleSentence: "The exhibition juxtaposes classical oil paintings with digital contemporary art." },
            { word: "Knell", partOfSpeech: "noun", definition: "The sound of a bell, especially for a funeral; an omen of death or failure.", exampleSentence: "The widespread adoption of email sounded the death knell for paper telegrams." },
            { word: "Languid", partOfSpeech: "adjective", definition: "Slow and relaxed; displaying or having a disinclination for physical exertion.", exampleSentence: "On humid afternoons, the town moved at a languid and peaceful pace." },
            { word: "Mendacious", partOfSpeech: "adjective", definition: "Not telling the truth; lying or deceitful.", exampleSentence: "The editor retracted the mendacious claims published by the unreliable correspondent." },
            { word: "Noxious", partOfSpeech: "adjective", definition: "Harmful, poisonous, or very unpleasant.", exampleSentence: "Industrial waste generated noxious chemical fumes that irritated residents." },
            { word: "Onerous", partOfSpeech: "adjective", definition: "Involving an amount of effort and difficulty that is burdensome.", exampleSentence: "Complying with the new financial regulations proved to be an onerous undertaking." },
            { word: "Paragon", partOfSpeech: "noun", definition: "A person or thing regarded as a perfect model of a particular quality.", exampleSentence: "The researcher was hailed as a paragon of scientific integrity." },
            { word: "Querulous", partOfSpeech: "adjective", definition: "Complaining in a petulant or whining manner.", exampleSentence: "The querulous patient expressed dissatisfaction with every single hospital meal." },
            { word: "Rancor", partOfSpeech: "noun", definition: "Bitterness or resentfulness, especially long-standing.", exampleSentence: "The political rivals debated fiercely but without personal rancor." },
            { word: "Salient", partOfSpeech: "adjective", definition: "Most noticeable or important; prominent.", exampleSentence: "She summarized the salient points of the lengthy climate report in five slides." },
            { word: "Temerity", partOfSpeech: "noun", definition: "Excessive confidence or boldness; audacity.", exampleSentence: "Few students had the temerity to openly contradict the authoritarian dean." },
            { word: "Umbrage", partOfSpeech: "noun", definition: "Offense or annoyance; resentment.", exampleSentence: "The author took umbrage at the reviewer's dismissive remarks." },
            { word: "Vacillate", partOfSpeech: "verb", definition: "To alternate between different opinions or actions; be indecisive.", exampleSentence: "The investor vacillated for days before finally deciding to buy the bonds." },
            { word: "Wistful", partOfSpeech: "adjective", definition: "Having or showing a feeling of vague or regretful longing.", exampleSentence: "He cast a wistful glance at his childhood neighborhood before boarding the train." },
            { word: "Yoke", partOfSpeech: "noun", definition: "A burden or oppressive bond holding people back.", exampleSentence: "The nation struggled for decades to cast off the yoke of foreign colonial rule." },
            { word: "Zenith", partOfSpeech: "noun", definition: "The time at which something is most powerful or successful; peak.", exampleSentence: "The Roman Empire was at the zenith of its territorial extent under Trajan." },
        ],
    },
    {
        title: "High-Frequency SAT Math & Science Terms",
        description: "Key concepts and precise terminology for the SAT Math and Science-based passages.",
        cards: [
            { word: "Asymptote", partOfSpeech: "noun", definition: "A line that a curve approaches arbitrarily closely without ever touching.", exampleSentence: "The rational function has a vertical asymptote at x = 3." },
            { word: "Coefficient", partOfSpeech: "noun", definition: "A numerical or constant quantity placed before and multiplying the variable in an algebraic expression.", exampleSentence: "In the expression 7x^2, the coefficient of x^2 is 7." },
            { word: "Empirical", partOfSpeech: "adjective", definition: "Based on, concerned with, or verifiable by observation or experiment rather than theory.", exampleSentence: "The hypothesis was confirmed through rigorous empirical trials." },
            { word: "Hypotenuse", partOfSpeech: "noun", definition: "The longest side of a right-angled triangle, opposite the right angle.", exampleSentence: "By the Pythagorean theorem, the square of the hypotenuse equals the sum of the squares of the legs." },
            { word: "Inversely", partOfSpeech: "adverb", definition: "In an inverted manner; in opposite order, relation, or degree.", exampleSentence: "Gravitational attraction varies inversely with the square of the distance." },
            { word: "Median", partOfSpeech: "noun", definition: "The middle value in a distribution of numbers ordered from least to greatest.", exampleSentence: "Unlike the mean, the median is resilient against extreme outliers in economic data." },
            { word: "Parabola", partOfSpeech: "noun", definition: "A symmetrical open plane curve formed by the intersection of a cone with a plane parallel to its side.", exampleSentence: "The trajectory of a projectile launched under gravity forms a downward-opening parabola." },
            { word: "Qualitative", partOfSpeech: "adjective", definition: "Relating to, measuring, or measured by the quality of something rather than its quantity.", exampleSentence: "The researchers gathered qualitative feedback through in-depth participant interviews." },
            { word: "Quantitative", partOfSpeech: "adjective", definition: "Relating to, measuring, or measured by the quantity of something rather than its quality.", exampleSentence: "Quantitative analysis revealed a 15% increase in solar panel efficiency." },
            { word: "Radical", partOfSpeech: "noun", definition: "An expression that has a root (square root, cube root, etc.).", exampleSentence: "To simplify the radical, we factored out perfect squares from under the root sign." },
            { word: "Correlation", partOfSpeech: "noun", definition: "A mutual relationship or connection between two or more things.", exampleSentence: "A strong positive correlation was found between sleep duration and exam performance." },
            { word: "Discrepancy", partOfSpeech: "noun", definition: "A lack of compatibility or similarity between two or more facts.", exampleSentence: "The auditor discovered a significant discrepancy between reported and actual revenues." },
            { word: "Extrapolate", partOfSpeech: "verb", definition: "To estimate or conclude by projecting known information or trends.", exampleSentence: "It is hazardous to extrapolate long-term climate patterns from a single abnormal winter." },
            { word: "Linear", partOfSpeech: "adjective", definition: "Progressing from one stage to another in a single series of steps; having the form of a straight line.", exampleSentence: "The relation between hours worked and wages earned is strictly linear." },
            { word: "Proportional", partOfSpeech: "adjective", definition: "Corresponding in size or amount to something else.", exampleSentence: "The kinetic energy of an object is directly proportional to its mass." },
            { word: "Standard Deviation", partOfSpeech: "noun", definition: "A quantity calculating the dispersion of a set of values relative to their mean.", exampleSentence: "A small standard deviation indicates that the data points tend to cluster close to the mean." },
            { word: "Theorem", partOfSpeech: "noun", definition: "A general proposition not self-evident but proved by a chain of reasoning.", exampleSentence: "Euclid's theorem demonstrates that there are infinitely many prime numbers." },
            { word: "Variable", partOfSpeech: "noun", definition: "An element, feature, or factor that is liable to vary or change.", exampleSentence: "In this physics experiment, temperature served as the controlled independent variable." },
            { word: "Synthesize", partOfSpeech: "verb", definition: "To combine a number of things into a coherent whole.", exampleSentence: "The review essay synthesizes findings from twenty independent ecological studies." },
            { word: "Plausible", partOfSpeech: "adjective", definition: "Seeming reasonable or probable; believable.", exampleSentence: "The geologist offered a plausible explanation for the sudden sinkhole formation." },
            { word: "Deduce", partOfSpeech: "verb", definition: "To arrive at a fact or conclusion by reasoning; draw as a logical conclusion.", exampleSentence: "From the chemical reaction rate, the chemist deduced the reaction order." },
            { word: "Collinear", partOfSpeech: "adjective", definition: "Lying in the same straight line.", exampleSentence: "Three points in the Cartesian plane are collinear if the slope between any two is identical." },
            { word: "Concur", partOfSpeech: "verb", definition: "To be of the same opinion; agree.", exampleSentence: "All four peer reviewers concurred that the mathematical proof was rigorous." },
            { word: "Equilateral", partOfSpeech: "adjective", definition: "Having all its sides of the same length.", exampleSentence: "Each internal angle of an equilateral triangle measures exactly 60 degrees." },
            { word: "Permutation", partOfSpeech: "noun", definition: "An arrangement of elements in a definite order.", exampleSentence: "The number of permutations of 4 books on a shelf is 4 factorial, or 24." },
        ],
    },
];

export class DemoSeeder {
    private readonly fullLengthStrategy = new FullLengthScoringStrategy();
    private readonly sectionalStrategy = new SectionalScoringStrategy();

    public async seed(mongoUri: string): Promise<void> {
        console.log("[DemoSeeder] Connecting to MongoDB...");
        const conn = await mongoose.connect(mongoUri);

        try {
            console.log("[DemoSeeder] Wiping old collections for clean slate...");
            await Promise.all([
                UserModel.deleteMany({}),
                TestModel.deleteMany({}),
                QuestionModel.deleteMany({}),
                AttemptModel.deleteMany({}),
                ErrorLogModel.deleteMany({}),
                VocabDeckModel.deleteMany({}),
                VocabCardModel.deleteMany({}),
            ]);

            // 1. Create Admin and Student accounts
            console.log("[DemoSeeder] Creating admin & student accounts...");
            const [adminPasswordHash, studentPasswordHash] = await Promise.all([
                bcrypt.hash(DEMO_ADMIN.password, 10),
                bcrypt.hash(DEMO_STUDENT.password, 10),
            ]);

            await UserModel.create({
                name: DEMO_ADMIN.name,
                email: DEMO_ADMIN.email,
                password: adminPasswordHash,
                role: "admin",
                highestScore: 1510,
            });

            const studentUser = await UserModel.create({
                name: DEMO_STUDENT.name,
                email: DEMO_STUDENT.email,
                password: studentPasswordHash,
                role: "student",
                highestScore: 1540,
                lastTestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            });

            // 2. Import tests & questions via ProdSampleImporter
            console.log("[DemoSeeder] Importing full test suite with all SPR questions...");
            const importer = new ProdSampleImporter();
            const summary = await importer.importAll();
            console.log(
                `[DemoSeeder] Imported ${summary.tests.length} tests and ${summary.totalQuestions} questions.`
            );

            const [test1Doc, test2Doc] = summary.tests;
            const test1Questions = await QuestionModel.find({ testId: test1Doc._id }).sort({
                module: 1,
                _id: 1,
            });
            const test2Questions = await QuestionModel.find({ testId: test2Doc._id }).sort({
                module: 1,
                _id: 1,
            });

            const test1DomainQuestions = test1Questions.map((q) =>
                QuestionFactory.fromPersistence({
                    id: q._id.toString(),
                    testId: q.testId.toString(),
                    section: q.section,
                    module: q.module,
                    questionText: q.questionText,
                    choices: q.choices,
                    correctAnswer: q.correctAnswer,
                    acceptedAnswers: q.acceptedAnswers,
                    questionType: q.questionType,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    points: q.points,
                    domain: q.domain,
                    skill: q.skill,
                })
            );

            const test2DomainQuestions = test2Questions.map((q) =>
                QuestionFactory.fromPersistence({
                    id: q._id.toString(),
                    testId: q.testId.toString(),
                    section: q.section,
                    module: q.module,
                    questionText: q.questionText,
                    choices: q.choices,
                    correctAnswer: q.correctAnswer,
                    acceptedAnswers: q.acceptedAnswers,
                    questionType: q.questionType,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    points: q.points,
                    domain: q.domain,
                    skill: q.skill,
                })
            );

            // 3. Seed 5 Full-Length + 3 Sectional Realistic Past Attempts spread over the last 6 weeks
            // Progression: ~1050 -> 1150 -> 1230 -> 1300 -> 1360
            console.log("[DemoSeeder] Generating 5 full-length (1050->1360) and 3 sectional past attempts...");
            const nowMs = Date.now();
            const DAY = 24 * 60 * 60 * 1000;

            const missedQuestionIds: string[] = [];

            const createAnswers = (
                questions: typeof test1DomainQuestions,
                correctCount: number,
                date: Date
            ): IAnswerDoc[] => {
                const total = questions.length;
                const missCount = Math.max(0, total - correctCount);
                const missIndices = new Set<number>();
                if (missCount > 0) {
                    const step = total / missCount;
                    for (let i = 0; i < missCount; i++) {
                        missIndices.add(Math.floor(i * step));
                    }
                }
                return questions.map((q, idx) => {
                    const isMissed = missIndices.has(idx);
                    if (isMissed) {
                        missedQuestionIds.push(q.id);
                    }
                    return {
                        questionId: new mongoose.Types.ObjectId(q.id),
                        userAnswer: isMissed ? "Incorrect Answer" : "Correct Answer",
                        isCorrect: !isMissed,
                        answeredAt: date,
                    };
                });
            };

            const t1RwQs = test1DomainQuestions.filter(
                (q) => q.section.toLowerCase().includes("reading") || q.section.toLowerCase().includes("verbal")
            );
            const t1MathQs = test1DomainQuestions.filter((q) => q.section.toLowerCase().includes("math"));

            const t2RwQs = test2DomainQuestions.filter(
                (q) => q.section.toLowerCase().includes("reading") || q.section.toLowerCase().includes("verbal")
            );
            const t2MathQs = test2DomainQuestions.filter((q) => q.section.toLowerCase().includes("math"));

            // --- Attempt 1: 42 days ago - Full-Length Test 1 (Score: 1050) ---
            // R&W 29/54 (520) + Math 24/44 (530) = 1050
            const fl1Date = new Date(nowMs - 42 * DAY);
            const fl1Answers = [
                ...createAnswers(t1RwQs, 29, fl1Date),
                ...createAnswers(t1MathQs, 24, fl1Date),
            ];
            const domainFl1 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test1Doc._id.toString(),
                mode: "full_length",
                status: "in_progress",
                answers: fl1Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: fl1Date,
            });
            domainFl1.submit(this.fullLengthStrategy, test1DomainQuestions, fl1Date);
            const fl1Doc = await AttemptModel.create({
                userId: studentUser._id,
                testId: test1Doc._id,
                mode: "full_length",
                status: "submitted",
                answers: fl1Answers,
                score: {
                    total: domainFl1.score?.total,
                    sectionScores: domainFl1.score?.sectionScores,
                    rawCorrectCounts: domainFl1.score?.rawCorrectCounts,
                    totalQuestions: domainFl1.score?.totalQuestions,
                    isSectional: false,
                },
                startedAt: fl1Date,
                submittedAt: fl1Date,
            });

            // --- Attempt 2: 37 days ago - Sectional Test 1 (R&W Module 1, Score: 560) ---
            // R&W Module 1: 16/27 (560)
            const sec1Date = new Date(nowMs - 37 * DAY);
            const t1RwM1 = t1RwQs.filter((q) => q.module === 1);
            const sec1Answers = createAnswers(t1RwM1, 16, sec1Date);
            const domainSec1 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test1Doc._id.toString(),
                mode: "sectional",
                sectionalSubject: "Reading and Writing",
                sectionalModule: 1,
                status: "in_progress",
                answers: sec1Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: sec1Date,
            });
            domainSec1.submit(this.sectionalStrategy, t1RwM1, sec1Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test1Doc._id,
                mode: "sectional",
                sectionalSubject: "Reading and Writing",
                sectionalModule: 1,
                status: "submitted",
                answers: sec1Answers,
                score: {
                    total: domainSec1.score?.total,
                    sectionScores: domainSec1.score?.sectionScores,
                    rawCorrectCounts: domainSec1.score?.rawCorrectCounts,
                    totalQuestions: domainSec1.score?.totalQuestions,
                    isSectional: true,
                },
                startedAt: sec1Date,
                submittedAt: sec1Date,
            });

            // --- Attempt 3: 32 days ago - Full-Length Test 2 (Score: 1150) ---
            // R&W 33/54 (570) + Math 28/44 (580) = 1150
            const fl2Date = new Date(nowMs - 32 * DAY);
            const fl2Answers = [
                ...createAnswers(t2RwQs, 33, fl2Date),
                ...createAnswers(t2MathQs, 28, fl2Date),
            ];
            const domainFl2 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test2Doc._id.toString(),
                mode: "full_length",
                status: "in_progress",
                answers: fl2Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: fl2Date,
            });
            domainFl2.submit(this.fullLengthStrategy, test2DomainQuestions, fl2Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test2Doc._id,
                mode: "full_length",
                status: "submitted",
                answers: fl2Answers,
                score: {
                    total: domainFl2.score?.total,
                    sectionScores: domainFl2.score?.sectionScores,
                    rawCorrectCounts: domainFl2.score?.rawCorrectCounts,
                    totalQuestions: domainFl2.score?.totalQuestions,
                    isSectional: false,
                },
                startedAt: fl2Date,
                submittedAt: fl2Date,
            });

            // --- Attempt 4: 27 days ago - Sectional Test 1 (Math Module 1, Score: 610) ---
            // Math Module 1: 15/22 (610)
            const sec2Date = new Date(nowMs - 27 * DAY);
            const t1MathM1 = t1MathQs.filter((q) => q.module === 1);
            const sec2Answers = createAnswers(t1MathM1, 15, sec2Date);
            const domainSec2 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test1Doc._id.toString(),
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
                status: "in_progress",
                answers: sec2Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: sec2Date,
            });
            domainSec2.submit(this.sectionalStrategy, t1MathM1, sec2Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test1Doc._id,
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 1,
                status: "submitted",
                answers: sec2Answers,
                score: {
                    total: domainSec2.score?.total,
                    sectionScores: domainSec2.score?.sectionScores,
                    rawCorrectCounts: domainSec2.score?.rawCorrectCounts,
                    totalQuestions: domainSec2.score?.totalQuestions,
                    isSectional: true,
                },
                startedAt: sec2Date,
                submittedAt: sec2Date,
            });

            // --- Attempt 5: 22 days ago - Full-Length Test 1 (Score: 1230) ---
            // R&W 37/54 (610) + Math 31/44 (620) = 1230
            const fl3Date = new Date(nowMs - 22 * DAY);
            const fl3Answers = [
                ...createAnswers(t1RwQs, 37, fl3Date),
                ...createAnswers(t1MathQs, 31, fl3Date),
            ];
            const domainFl3 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test1Doc._id.toString(),
                mode: "full_length",
                status: "in_progress",
                answers: fl3Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: fl3Date,
            });
            domainFl3.submit(this.fullLengthStrategy, test1DomainQuestions, fl3Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test1Doc._id,
                mode: "full_length",
                status: "submitted",
                answers: fl3Answers,
                score: {
                    total: domainFl3.score?.total,
                    sectionScores: domainFl3.score?.sectionScores,
                    rawCorrectCounts: domainFl3.score?.rawCorrectCounts,
                    totalQuestions: domainFl3.score?.totalQuestions,
                    isSectional: false,
                },
                startedAt: fl3Date,
                submittedAt: fl3Date,
            });

            // --- Attempt 6: 17 days ago - Sectional Test 2 (Math Module 2, Score: 660) ---
            // Math Module 2: 17/22 (660)
            const sec3Date = new Date(nowMs - 17 * DAY);
            const t2MathM2 = t2MathQs.filter((q) => q.module === 2);
            const sec3Answers = createAnswers(t2MathM2, 17, sec3Date);
            const domainSec3 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test2Doc._id.toString(),
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 2,
                status: "in_progress",
                answers: sec3Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: sec3Date,
            });
            domainSec3.submit(this.sectionalStrategy, t2MathM2, sec3Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test2Doc._id,
                mode: "sectional",
                sectionalSubject: "Math",
                sectionalModule: 2,
                status: "submitted",
                answers: sec3Answers,
                score: {
                    total: domainSec3.score?.total,
                    sectionScores: domainSec3.score?.sectionScores,
                    rawCorrectCounts: domainSec3.score?.rawCorrectCounts,
                    totalQuestions: domainSec3.score?.totalQuestions,
                    isSectional: true,
                },
                startedAt: sec3Date,
                submittedAt: sec3Date,
            });

            // --- Attempt 7: 12 days ago - Full-Length Test 2 (Score: 1300) ---
            // R&W 40/54 (640) + Math 34/44 (660) = 1300
            const fl4Date = new Date(nowMs - 12 * DAY);
            const fl4Answers = [
                ...createAnswers(t2RwQs, 40, fl4Date),
                ...createAnswers(t2MathQs, 34, fl4Date),
            ];
            const domainFl4 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test2Doc._id.toString(),
                mode: "full_length",
                status: "in_progress",
                answers: fl4Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: fl4Date,
            });
            domainFl4.submit(this.fullLengthStrategy, test2DomainQuestions, fl4Date);
            await AttemptModel.create({
                userId: studentUser._id,
                testId: test2Doc._id,
                mode: "full_length",
                status: "submitted",
                answers: fl4Answers,
                score: {
                    total: domainFl4.score?.total,
                    sectionScores: domainFl4.score?.sectionScores,
                    rawCorrectCounts: domainFl4.score?.rawCorrectCounts,
                    totalQuestions: domainFl4.score?.totalQuestions,
                    isSectional: false,
                },
                startedAt: fl4Date,
                submittedAt: fl4Date,
            });

            // --- Attempt 8: 2 days ago - Full-Length Test 1 (Score: 1360) ---
            // R&W 43/54 (680) + Math 35/44 (680) = 1360
            const fl5Date = new Date(nowMs - 2 * DAY);
            const fl5Answers = [
                ...createAnswers(t1RwQs, 43, fl5Date),
                ...createAnswers(t1MathQs, 35, fl5Date),
            ];
            const domainFl5 = new Attempt({
                id: "",
                userId: studentUser._id.toString(),
                testId: test1Doc._id.toString(),
                mode: "full_length",
                status: "in_progress",
                answers: fl5Answers.map((a) => new AnswerRecord(a.questionId.toString(), a.userAnswer, a.isCorrect, a.answeredAt)),
                startedAt: fl5Date,
            });
            domainFl5.submit(this.fullLengthStrategy, test1DomainQuestions, fl5Date);
            const fl5Doc = await AttemptModel.create({
                userId: studentUser._id,
                testId: test1Doc._id,
                mode: "full_length",
                status: "submitted",
                answers: fl5Answers,
                score: {
                    total: domainFl5.score?.total,
                    sectionScores: domainFl5.score?.sectionScores,
                    rawCorrectCounts: domainFl5.score?.rawCorrectCounts,
                    totalQuestions: domainFl5.score?.totalQuestions,
                    isSectional: false,
                },
                startedAt: fl5Date,
                submittedAt: fl5Date,
            });

            // Update student user stats
            studentUser.highestScore = domainFl5.score?.total || 1360;
            studentUser.testsTaken = [test1Doc._id, test2Doc._id];
            studentUser.lastTestDate = fl5Date;
            await studentUser.save();

            // 4. Populate Deduplicated Error Log with tagged reasons and notes
            console.log("[DemoSeeder] Seeding error log entries with realistic student tags & notes...");
            const uniqueMissedIds = Array.from(new Set(missedQuestionIds)).slice(0, 15);
            const reasons = ["Careless", "Concept gap", "Misread question", "Time pressure", "Guessed"] as const;

            for (let i = 0; i < uniqueMissedIds.length; i++) {
                const qId = uniqueMissedIds[i];
                const reason = reasons[i % reasons.length];
                const isResolved = i % 3 === 0;

                await ErrorLogModel.create({
                    userId: studentUser._id,
                    questionId: new mongoose.Types.ObjectId(qId),
                    latestAttemptId: fl5Doc._id,
                    timesMissed: (i % 3) + 1,
                    reason,
                    note: `Need to re-read carefully and watch out for ${reason.toLowerCase()} error on SAT ${reason === "Concept gap" ? "algebra" : "reading"}.`,
                    status: isResolved ? "resolved" : "open",
                    lastAttemptedAt: new Date(nowMs - (i + 1) * DAY),
                    resolvedAt: isResolved ? new Date(nowMs - i * DAY) : undefined,
                });
            }

            // 5. Seed Vocabulary Decks, Cards, and Spaced-Repetition Study History
            console.log("[DemoSeeder] Seeding 3 SAT vocabulary decks and flashcards...");
            for (let deckIdx = 0; deckIdx < SEED_DECKS.length; deckIdx++) {
                const deckData = SEED_DECKS[deckIdx];
                const deckDoc = await VocabDeckModel.create({
                    title: deckData.title,
                    description: deckData.description,
                    isSystem: true,
                });

                const cardsToInsert = deckData.cards.map((c, cardIdx) => {
                    // Spread boxes 1-5 and due dates
                    const box = ((cardIdx + deckIdx) % 5) + 1;
                    const isDueToday = cardIdx % 4 === 0; // Some cards due today!
                    const daysOffset = isDueToday ? -1 : cardIdx * 2;
                    const nextReviewDate = new Date(nowMs + daysOffset * DAY);

                    return {
                        deckId: deckDoc._id,
                        word: c.word,
                        partOfSpeech: c.partOfSpeech,
                        definition: c.definition,
                        exampleSentence: c.exampleSentence,
                        box,
                        nextReviewDate,
                        intervalDays: box === 1 ? 1 : box === 2 ? 3 : box === 3 ? 7 : box === 4 ? 14 : 30,
                        reviewCount: (box - 1) * 2 + 1,
                        lastReviewedAt: new Date(nowMs - 3 * DAY),
                    };
                });

                await VocabCardModel.insertMany(cardsToInsert);
            }

            console.log("[DemoSeeder] Database seeding completed successfully!");
        } finally {
            await conn.disconnect();
        }
    }
}
