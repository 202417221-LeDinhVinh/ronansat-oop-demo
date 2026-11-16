import {
    IAttemptRepository,
    IQuestionRepository,
    ITestRepository,
    IUserRepository,
} from "../ports";
import {
    StatisticsSnapshot,
    ScoreTrendPoint,
    SectionalScorePoint,
    SectionAccuracy,
    SkillPerformance,
    ActivityHeatmapItem,
} from "../../domain/statistics";
import { Student } from "../../domain/user";

/**
 * Service aggregating performance statistics for dashboard and progress tracking.
 * Separates full-length composite scores (400-1600) from sectional scores (200-800)
 * to avoid misleading zig-zag trends.
 */
export class StatisticsService {
    public constructor(
        private readonly attemptRepo: IAttemptRepository,
        private readonly questionRepo: IQuestionRepository,
        private readonly testRepo: ITestRepository,
        private readonly userRepo: IUserRepository
    ) {}

    public async getStatistics(userId: string): Promise<StatisticsSnapshot> {
        const attempts = await this.attemptRepo.findByUserId(userId);
        const submittedAttempts = attempts
            .filter((a) => a.isSubmitted() && a.score !== undefined)
            .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

        const fullLengthAttempts = submittedAttempts.filter((a) => a.mode === "full_length");
        const sectionalAttempts = submittedAttempts.filter((a) => a.mode === "sectional");

        const user = await this.userRepo.findById(userId);

        const testIds = Array.from(new Set(submittedAttempts.map((a) => a.testId)));
        const tests = await Promise.all(testIds.map((id) => this.testRepo.findById(id)));
        const testMap = new Map<string, string>();
        for (const t of tests) {
            if (t) testMap.set(t.id, t.title);
        }

        let totalQuestionsAnswered = 0;
        const heatmapMap = new Map<string, number>();

        const sectionCounts: Record<string, { correct: number; total: number }> = {
            "Reading and Writing": { correct: 0, total: 0 },
            Math: { correct: 0, total: 0 },
        };

        const skillMap: Record<string, { domain: string; correct: number; total: number }> = {};

        // Collect question details for accuracy breakdown
        const allQuestions = await Promise.all(
            testIds.map((id) => this.questionRepo.findByTestId(id))
        );
        const questionLookup = new Map<string, { section: string; domain?: string; skill?: string }>();
        for (const qList of allQuestions) {
            for (const q of qList) {
                questionLookup.set(q.id, {
                    section: q.section,
                    domain: q.domain,
                    skill: q.skill,
                });
            }
        }

        // Process all submitted attempts for heatmap and accuracy
        for (const att of submittedAttempts) {
            totalQuestionsAnswered += att.answers.length;

            const dateStr = att.startedAt.toISOString().split("T")[0];
            heatmapMap.set(dateStr, (heatmapMap.get(dateStr) || 0) + 1);

            for (const ans of att.answers) {
                const qMeta = questionLookup.get(ans.questionId);
                if (qMeta) {
                    const secKey = qMeta.section.toLowerCase().includes("math")
                        ? "Math"
                        : "Reading and Writing";

                    if (!sectionCounts[secKey]) {
                        sectionCounts[secKey] = { correct: 0, total: 0 };
                    }
                    sectionCounts[secKey].total++;
                    if (ans.isCorrect) sectionCounts[secKey].correct++;

                    const skillName = qMeta.skill || "General";
                    const domainName = qMeta.domain || secKey;
                    if (!skillMap[skillName]) {
                        skillMap[skillName] = { domain: domainName, correct: 0, total: 0 };
                    }
                    skillMap[skillName].total++;
                    if (ans.isCorrect) skillMap[skillName].correct++;
                }
            }
        }

        // 1. Full-Length Score Trend (400-1600 scale only)
        const scoreTrend: ScoreTrendPoint[] = fullLengthAttempts.map((att) => ({
            attemptId: att.id,
            testTitle: testMap.get(att.testId) || "Official SAT Practice Test",
            date: att.startedAt.toISOString().split("T")[0],
            score: att.score?.total ?? 400,
            mode: "full_length",
        }));

        // 2. Sectional Trend (200-800 scale)
        const sectionalTrend: SectionalScorePoint[] = sectionalAttempts.map((att) => ({
            attemptId: att.id,
            testTitle: testMap.get(att.testId) || "Official SAT Practice Test",
            section:
                att.sectionalSubject ||
                (att.score?.sectionScores.math !== undefined ? "Math" : "Reading and Writing"),
            module: att.sectionalModule,
            date: att.startedAt.toISOString().split("T")[0],
            score: att.score?.total ?? 200,
        }));

        // Full-length metrics
        const fullLengthScores = fullLengthAttempts.map((a) => a.score?.total ?? 400);
        const fullLengthSum = fullLengthScores.reduce((sum, s) => sum + s, 0);

        const averageScore = fullLengthScores.length > 0
            ? Math.round(fullLengthSum / fullLengthScores.length)
            : 0;

        const highestScore = fullLengthScores.length > 0
            ? Math.max(...fullLengthScores)
            : (user instanceof Student && user.highestScore >= 400 ? user.highestScore : 0);

        const latestScore = fullLengthAttempts.length > 0
            ? (fullLengthAttempts[fullLengthAttempts.length - 1].score?.total ?? 400)
            : (sectionalAttempts.length > 0 ? (sectionalAttempts[sectionalAttempts.length - 1].score?.total ?? 200) : 0);

        // Sectional metrics
        const sectionalScores = sectionalAttempts.map((a) => a.score?.total ?? 200);
        const averageSectionalScore = sectionalScores.length > 0
            ? Math.round(sectionalScores.reduce((sum, s) => sum + s, 0) / sectionalScores.length)
            : undefined;

        const latestSectionalScore = sectionalAttempts.length > 0
            ? (sectionalAttempts[sectionalAttempts.length - 1].score?.total ?? 200)
            : undefined;

        const sectionAccuracy: SectionAccuracy[] = Object.entries(sectionCounts).map(([section, data]) => ({
            section,
            correct: data.correct,
            total: data.total,
            percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        }));

        const skillPerformances: SkillPerformance[] = Object.entries(skillMap).map(([skill, data]) => ({
            skill,
            domain: data.domain,
            questionsAnswered: data.total,
            accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        }));

        skillPerformances.sort((a, b) => b.accuracy - a.accuracy);
        const strongestSkills = skillPerformances.slice(0, 5);
        const weakestSkills = [...skillPerformances].reverse().slice(0, 5);

        const activityHeatmap: ActivityHeatmapItem[] = Array.from(heatmapMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalTestsTaken: submittedAttempts.length,
            totalFullLengthTaken: fullLengthAttempts.length,
            totalSectionalTaken: sectionalAttempts.length,
            highestScore,
            latestScore,
            averageScore,
            latestSectionalScore,
            averageSectionalScore,
            questionsAnswered: totalQuestionsAnswered,
            scoreTrend,
            sectionalTrend,
            sectionAccuracy,
            strongestSkills,
            weakestSkills,
            activityHeatmap,
        };
    }
}
