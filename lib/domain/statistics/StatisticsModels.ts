export interface ScoreTrendPoint {
    attemptId: string;
    testTitle: string;
    date: string;
    score: number;
    mode: "full_length" | "sectional";
}

export interface SectionalScorePoint {
    attemptId: string;
    testTitle: string;
    section: string;
    module?: number;
    date: string;
    score: number; // 200-800
}

export interface SectionAccuracy {
    section: string;
    correct: number;
    total: number;
    percentage: number;
}

export interface SkillAccuracy {
    domain: string;
    skill: string;
    correct: number;
    total: number;
    percentage: number;
}

export interface ActivityHeatmapItem {
    date: string; // YYYY-MM-DD
    count: number;
}

export interface SkillPerformance {
    domain: string;
    skill: string;
    accuracy: number;
    questionsAnswered: number;
}

export interface StatisticsSnapshot {
    totalTestsTaken: number;
    totalFullLengthTaken: number;
    totalSectionalTaken: number;
    highestScore: number;
    latestScore: number;
    averageScore: number;
    latestSectionalScore?: number;
    averageSectionalScore?: number;
    questionsAnswered: number;
    scoreTrend: ScoreTrendPoint[];
    sectionalTrend: SectionalScorePoint[];
    sectionAccuracy: SectionAccuracy[];
    strongestSkills: SkillPerformance[];
    weakestSkills: SkillPerformance[];
    activityHeatmap: ActivityHeatmapItem[];
}
