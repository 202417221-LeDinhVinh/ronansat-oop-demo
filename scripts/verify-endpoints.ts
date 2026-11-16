import axios from "axios";

interface CookieMap {
    [key: string]: string;
}

function parseCookies(setCookieHeaders?: string[]): CookieMap {
    const cookies: CookieMap = {};
    if (!setCookieHeaders) return cookies;
    for (const header of setCookieHeaders) {
        const parts = header.split(";")[0].split("=");
        if (parts.length >= 2) {
            cookies[parts[0].trim()] = parts.slice(1).join("=").trim();
        }
    }
    return cookies;
}

function cookieString(cookies: CookieMap): string {
    return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
}

async function loginUser(email: string, password: string, baseUrl: string) {
    const csrfRes = await axios.get(`${baseUrl}/api/auth/csrf`);
    const cookies = parseCookies(csrfRes.headers["set-cookie"]);
    const csrfToken = csrfRes.data.csrfToken;

    const params = new URLSearchParams();
    params.append("csrfToken", csrfToken);
    params.append("email", email);
    params.append("password", password);
    params.append("json", "true");

    const loginRes = await axios.post(`${baseUrl}/api/auth/callback/credentials`, params.toString(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookieString(cookies),
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
    });

    const loginCookies = parseCookies(loginRes.headers["set-cookie"]);
    const allCookies = { ...cookies, ...loginCookies };

    return {
        status: loginRes.status,
        cookies: allCookies,
        cookieHeader: cookieString(allCookies),
    };
}

interface TestResult {
    test: string;
    status: number | string;
    passed: boolean;
    note?: string;
}

async function verifyAll() {
    const baseUrl = "http://localhost:3000";
    console.log("================================================================");
    console.log("      RONANSAT V2 OOP ARCHITECTURE - ENDPOINT VERIFICATION      ");
    console.log("================================================================\n");

    const results: TestResult[] = [];

    // 1. Home page (GET /)
    try {
        const res = await axios.get(`${baseUrl}/`);
        results.push({
            test: "1. Public: Home page (GET /)",
            status: res.status,
            passed: res.status === 200,
        });
    } catch (e: any) {
        results.push({ test: "1. Public: Home page (GET /)", status: e.response?.status || e.message, passed: false });
    }

    // 2. Register new student (POST /api/auth/register)
    const uniqueEmail = `student_${Date.now()}@ronansat.com`;
    try {
        const regRes = await axios.post(`${baseUrl}/api/auth/register`, {
            name: "Registered Test Student",
            email: uniqueEmail,
            password: "RegisteredPassword123!",
        });
        results.push({
            test: "2. Public: Register student (POST /api/auth/register)",
            status: regRes.status,
            passed: regRes.status === 201 && !!regRes.data?.userId,
            note: `Created userId: ${regRes.data?.userId}`,
        });
    } catch (e: any) {
        results.push({ test: "2. Public: Register student", status: e.response?.status || e.message, passed: false });
    }

    // 3. Login seeded student
    let studentCookie = "";
    try {
        const loginStudent = await loginUser("student@ronansat.com", "StudentPassword123!", baseUrl);
        studentCookie = loginStudent.cookieHeader;
        const hasSession = !!loginStudent.cookies["next-auth.session-token"];
        results.push({
            test: "3. Auth: Login student (student@ronansat.com)",
            status: loginStudent.status,
            passed: loginStudent.status === 200 && hasSession,
            note: hasSession ? "Session cookie received" : "No session cookie",
        });
    } catch (e: any) {
        results.push({ test: "3. Auth: Login student", status: e.response?.status || e.message, passed: false });
    }

    // 4. Login seeded admin
    let adminCookie = "";
    try {
        const loginAdmin = await loginUser("admin@ronansat.com", "AdminPassword123!", baseUrl);
        adminCookie = loginAdmin.cookieHeader;
        const hasSession = !!loginAdmin.cookies["next-auth.session-token"];
        results.push({
            test: "4. Auth: Login admin (admin@ronansat.com)",
            status: loginAdmin.status,
            passed: loginAdmin.status === 200 && hasSession,
            note: hasSession ? "Session cookie received" : "No session cookie",
        });
    } catch (e: any) {
        results.push({ test: "4. Auth: Login admin", status: e.response?.status || e.message, passed: false });
    }

    // 5. Barrier: 401 Unauthorized when unauthenticated
    try {
        const unauthRes = await axios.get(`${baseUrl}/api/error-log`, { validateStatus: () => true });
        results.push({
            test: "5. Barrier: 401 Unauthorized for anonymous (GET /api/error-log)",
            status: unauthRes.status,
            passed: unauthRes.status === 401,
            note: `Expected 401, received ${unauthRes.status}`,
        });
    } catch (e: any) {
        results.push({ test: "5. Barrier: 401 Unauthorized", status: e.response?.status || e.message, passed: false });
    }

    // 6. Barrier: 401 Unauthorized for anonymous accessing admin metrics
    try {
        const unauthAdminRes = await axios.get(`${baseUrl}/api/admin/metrics`, { validateStatus: () => true });
        results.push({
            test: "6. Barrier: 401 Unauthorized for anonymous (GET /api/admin/metrics)",
            status: unauthAdminRes.status,
            passed: unauthAdminRes.status === 401,
            note: `Expected 401, received ${unauthAdminRes.status}`,
        });
    } catch (e: any) {
        results.push({ test: "6. Barrier: 401 Unauthorized", status: e.response?.status || e.message, passed: false });
    }

    // 7. Barrier: 403 Forbidden when student accesses admin metrics
    try {
        const forbidRes = await axios.get(`${baseUrl}/api/admin/metrics`, {
            headers: { Cookie: studentCookie },
            validateStatus: () => true,
        });
        results.push({
            test: "7. Barrier: 403 Forbidden for student (GET /api/admin/metrics)",
            status: forbidRes.status,
            passed: forbidRes.status === 403,
            note: `Expected 403, received ${forbidRes.status}`,
        });
    } catch (e: any) {
        results.push({ test: "7. Barrier: 403 Forbidden", status: e.response?.status || e.message, passed: false });
    }

    // 8. Barrier: 403 Forbidden when student tries to create admin test
    try {
        const forbidCreateRes = await axios.post(
            `${baseUrl}/api/admin/tests`,
            { title: "Hacked Test" },
            {
                headers: { Cookie: studentCookie },
                validateStatus: () => true,
            }
        );
        results.push({
            test: "8. Barrier: 403 Forbidden for student (POST /api/admin/tests)",
            status: forbidCreateRes.status,
            passed: forbidCreateRes.status === 403,
            note: `Expected 403, received ${forbidCreateRes.status}`,
        });
    } catch (e: any) {
        results.push({ test: "8. Barrier: 403 Forbidden", status: e.response?.status || e.message, passed: false });
    }

    // 9. Test list API (GET /api/tests)
    let seededSeedTestId = "";
    try {
        const testsRes = await axios.get(`${baseUrl}/api/tests`);
        const tests = testsRes.data?.tests || [];
        const t1 = tests.find((t: any) => t.title?.includes("2025 March INT - A"));
        const t2 = tests.find((t: any) => t.title?.includes("2025 October US - A"));

        if (t1) {
            seededSeedTestId = t1._id;
        } else if (tests.length > 0) {
            seededSeedTestId = tests[0]._id;
        }

        const passed = tests.length >= 2 && !!t1 && !!t2;
        results.push({
            test: "9. Tests: List tests (GET /api/tests)",
            status: testsRes.status,
            passed,
            note: `Found ${tests.length} tests (T1: "${t1?.title}", T2: "${t2?.title}")`,
        });
    } catch (e: any) {
        results.push({ test: "9. Tests: List tests", status: e.response?.status || e.message, passed: false });
    }

    // 10. Test detail API (GET /api/tests/:id)
    try {
        const testDetailRes = await axios.get(`${baseUrl}/api/tests/${seededSeedTestId}`);
        const test = testDetailRes.data?.test;
        const passed = testDetailRes.status === 200 && test?._id === seededSeedTestId && test?.sections?.length > 0;
        results.push({
            test: `10. Tests: Get test detail (GET /api/tests/${seededSeedTestId})`,
            status: testDetailRes.status,
            passed,
            note: `Title: "${test?.title}", Sections: ${test?.sections?.length}`,
        });
    } catch (e: any) {
        results.push({ test: "10. Tests: Get test detail", status: e.response?.status || e.message, passed: false });
    }

    // 11. Questions API (GET /api/questions?testId=:id)
    let mcqQuestionId = "";
    let sprQuestionId = "";
    try {
        const qRes = await axios.get(`${baseUrl}/api/questions?testId=${seededSeedTestId}`);
        const questions = qRes.data?.questions || [];
        const mcq = questions.find(
            (q: any) => q.questionType === "multiple_choice" || (q.choices && q.choices.length > 0)
        );
        const spr = questions.find((q: any) => q.questionType === "spr");

        if (mcq) mcqQuestionId = mcq._id;
        if (spr) sprQuestionId = spr._id;

        const passed = questions.length > 0 && !!mcq && !!spr;
        results.push({
            test: "11. Questions: List with MCQ & SPR types (GET /api/questions)",
            status: qRes.status,
            passed,
            note: `Total: ${questions.length} | MCQ ID: ${mcqQuestionId} | SPR ID: ${sprQuestionId}`,
        });
    } catch (e: any) {
        results.push({ test: "11. Questions: List questions", status: e.response?.status || e.message, passed: false });
    }

    // 12. Student Flow: Start Attempt (POST /api/attempts/start)
    let newAttemptId = "";
    try {
        const startRes = await axios.post(
            `${baseUrl}/api/attempts/start`,
            {
                testId: seededSeedTestId,
                mode: "full_length",
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        newAttemptId = startRes.data?.attempt?.id || startRes.data?.attempt?._id;
        const passed = startRes.status === 201 && !!newAttemptId;
        results.push({
            test: "12. Attempt: Start full-length attempt (POST /api/attempts/start)",
            status: startRes.status,
            passed,
            note: `Created attemptId: ${newAttemptId}, status: ${startRes.data?.attempt?.status}`,
        });
    } catch (e: any) {
        results.push({ test: "12. Attempt: Start attempt", status: e.response?.status || e.message, passed: false });
    }

    // 13. Student Flow: Record MCQ Answer (POST /api/attempts/:id/answer)
    try {
        const ansRes = await axios.post(
            `${baseUrl}/api/attempts/${newAttemptId}/answer`,
            {
                questionId: mcqQuestionId,
                answer: "A",
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        const passed = ansRes.status === 200 && ansRes.data?.answeredCount >= 1;
        results.push({
            test: `13. Attempt: Record MCQ answer (POST /api/attempts/${newAttemptId}/answer)`,
            status: ansRes.status,
            passed,
            note: `Answered count: ${ansRes.data?.answeredCount}`,
        });
    } catch (e: any) {
        results.push({ test: "13. Attempt: Record MCQ answer", status: e.response?.status || e.message, passed: false });
    }

    // 14. Student Flow: Record SPR Answer with fraction/decimal (POST /api/attempts/:id/answer)
    try {
        const sprSubmission = "2.5";
        const sprAnsRes = await axios.post(
            `${baseUrl}/api/attempts/${newAttemptId}/answer`,
            {
                questionId: sprQuestionId,
                answer: sprSubmission,
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        const passed = sprAnsRes.status === 200 && sprAnsRes.data?.answeredCount >= 2;
        results.push({
            test: `14. Attempt: Record SPR answer (POST /api/attempts/${newAttemptId}/answer)`,
            status: sprAnsRes.status,
            passed,
            note: `Submitted "${sprSubmission}", answered count: ${sprAnsRes.data?.answeredCount}`,
        });
    } catch (e: any) {
        results.push({ test: "14. Attempt: Record SPR answer", status: e.response?.status || e.message, passed: false });
    }

    // 15. Student Flow: Submit Attempt & Grade via FullLengthScoringStrategy (POST /api/attempts/:id/submit)
    let finalScore = 0;
    try {
        const submitRes = await axios.post(
            `${baseUrl}/api/attempts/${newAttemptId}/submit`,
            {},
            {
                headers: { Cookie: studentCookie },
            }
        );
        finalScore = submitRes.data?.score?.total || submitRes.data?.attempt?.score?.total || 0;
        const rwScore = submitRes.data?.score?.readingAndWriting ?? submitRes.data?.attempt?.score?.readingAndWriting ?? 0;
        const mathScore = submitRes.data?.score?.math ?? submitRes.data?.attempt?.score?.math ?? 0;
        const passed = submitRes.status === 200 && finalScore >= 400 && finalScore <= 1600;
        results.push({
            test: `15. Scoring: Submit & grade full-length attempt (POST /api/attempts/${newAttemptId}/submit)`,
            status: submitRes.status,
            passed,
            note: `Total: ${finalScore} (RW: ${rwScore}, Math: ${mathScore}) | Invariant 400-1600 validated`,
        });
    } catch (e: any) {
        results.push({ test: "15. Scoring: Submit attempt", status: e.response?.status || e.message, passed: false });
    }

    // 16. Results List (GET /api/results)
    try {
        const resListRes = await axios.get(`${baseUrl}/api/results`, {
            headers: { Cookie: studentCookie },
        });
        const attempts = resListRes.data?.results || [];
        const passed = resListRes.status === 200 && attempts.length >= 1;
        results.push({
            test: "16. Results: List past attempts (GET /api/results)",
            status: resListRes.status,
            passed,
            note: `Found ${attempts.length} attempts for student (includes seeded + new attempt)`,
        });
    } catch (e: any) {
        results.push({ test: "16. Results: List past attempts", status: e.response?.status || e.message, passed: false });
    }

    // 17. Result Detail (GET /api/results/:id)
    try {
        const resDetailRes = await axios.get(`${baseUrl}/api/results/${newAttemptId}`, {
            headers: { Cookie: studentCookie },
        });
        const detail = resDetailRes.data?.result;
        const passed = resDetailRes.status === 200 && detail?._id === newAttemptId && detail?.score !== undefined;
        results.push({
            test: `17. Results: Get attempt detail (GET /api/results/${newAttemptId})`,
            status: resDetailRes.status,
            passed,
            note: `Status: ${detail?.status}, Score: ${detail?.score}`,
        });
    } catch (e: any) {
        results.push({ test: "17. Results: Get attempt detail", status: e.response?.status || e.message, passed: false });
    }

    // 18. Error Log: List Mistakes (GET /api/error-log)
    let sampleErrorLogId = "";
    try {
        const errLogRes = await axios.get(`${baseUrl}/api/error-log`, {
            headers: { Cookie: studentCookie },
        });
        const entries = errLogRes.data?.entries || [];
        if (entries.length > 0) {
            sampleErrorLogId = entries[0]._id;
        }
        const passed = errLogRes.status === 200 && entries.length > 0;
        results.push({
            test: "18. Error Log: List mistake entries (GET /api/error-log)",
            status: errLogRes.status,
            passed,
            note: `Seeded mistake entries count: ${entries.length} | Sample ID: ${sampleErrorLogId}`,
        });
    } catch (e: any) {
        results.push({ test: "18. Error Log: List entries", status: e.response?.status || e.message, passed: false });
    }

    // 19. Error Log: Update Note & Reason (PATCH /api/error-log/:id)
    try {
        const patchRes = await axios.patch(
            `${baseUrl}/api/error-log/${sampleErrorLogId}`,
            {
                reason: "Misread question",
                note: "Review quadratic roots theorem before retest",
                status: "open",
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        const updated = patchRes.data?.entry;
        const passed =
            patchRes.status === 200 &&
            updated?.reason === "Misread question" &&
            updated?.note === "Review quadratic roots theorem before retest";
        results.push({
            test: `19. Error Log: Update entry note & reason (PATCH /api/error-log/${sampleErrorLogId})`,
            status: patchRes.status,
            passed,
            note: `Updated reason: "${updated?.reason}", note: "${updated?.note}"`,
        });
    } catch (e: any) {
        results.push({ test: "19. Error Log: Update entry", status: e.response?.status || e.message, passed: false });
    }

    // 20. Error Log: Retry Mistake (POST /api/error-log/:id/retry)
    try {
        const retryRes = await axios.post(
            `${baseUrl}/api/error-log/${sampleErrorLogId}/retry`,
            {
                answer: "B",
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        const timesMissed = retryRes.data?.timesMissed ?? retryRes.data?.retryCount ?? 0;
        const passed = retryRes.status === 200 && timesMissed >= 1;
        results.push({
            test: `20. Error Log: Retry mistake (POST /api/error-log/${sampleErrorLogId}/retry)`,
            status: retryRes.status,
            passed,
            note: `Times missed: ${timesMissed}, status: ${retryRes.data?.status}, isCorrect: ${retryRes.data?.isCorrect}`,
        });
    } catch (e: any) {
        results.push({ test: "20. Error Log: Retry mistake", status: e.response?.status || e.message, passed: false });
    }

    // 21. Statistics Snapshot (GET /api/statistics)
    try {
        const statsRes = await axios.get(`${baseUrl}/api/statistics`, {
            headers: { Cookie: studentCookie },
        });
        const snap = statsRes.data?.statistics;
        const passed =
            statsRes.status === 200 &&
            snap?.totalTestsTaken > 0 &&
            Array.isArray(snap?.scoreTrend) &&
            Array.isArray(snap?.sectionAccuracy) &&
            Array.isArray(snap?.strongestSkills) &&
            Array.isArray(snap?.activityHeatmap);
        results.push({
            test: "21. Statistics: Aggregate analytics snapshot (GET /api/statistics)",
            status: statsRes.status,
            passed,
            note: `Tests: ${snap?.totalTestsTaken}, ScoreTrend: ${snap?.scoreTrend?.length}, Skills: ${snap?.strongestSkills?.length}, Heatmap days: ${snap?.activityHeatmap?.length}`,
        });
    } catch (e: any) {
        results.push({ test: "21. Statistics: Snapshot", status: e.response?.status || e.message, passed: false });
    }

    // 22. User stats (GET /api/user/stats)
    try {
        const uStatsRes = await axios.get(`${baseUrl}/api/user/stats`, {
            headers: { Cookie: studentCookie },
        });
        const testsTaken = uStatsRes.data?.testsTaken ?? uStatsRes.data?.stats?.testsTaken ?? 0;
        const passed = uStatsRes.status === 200 && testsTaken > 0;
        results.push({
            test: "22. User: Stats endpoint (GET /api/user/stats)",
            status: uStatsRes.status,
            passed,
            note: `testsTaken: ${testsTaken}, highestScore: ${uStatsRes.data?.highestScore ?? uStatsRes.data?.stats?.highestScore}`,
        });
    } catch (e: any) {
        results.push({ test: "22. User: Stats endpoint", status: e.response?.status || e.message, passed: false });
    }

    // 23. Vocab Decks (GET /api/vocab/decks)
    try {
        const decksRes = await axios.get(`${baseUrl}/api/vocab/decks`, {
            headers: { Cookie: studentCookie },
        });
        const decks = decksRes.data?.decks || [];
        const passed = decksRes.status === 200 && decks.length >= 3;
        results.push({
            test: "23. Vocab: List decks (GET /api/vocab/decks)",
            status: decksRes.status,
            passed,
            note: `Found ${decks.length} seeded SAT decks: "${decks.map((d: any) => d.title).join(", ")}"`,
        });
    } catch (e: any) {
        results.push({ test: "23. Vocab: List decks", status: e.response?.status || e.message, passed: false });
    }

    // 24. Vocab Due Cards (GET /api/vocab/due)
    let dueCardId = "";
    try {
        const dueRes = await axios.get(`${baseUrl}/api/vocab/due`, {
            headers: { Cookie: studentCookie },
        });
        const dueCards = dueRes.data?.dueCards || dueRes.data?.cards || [];
        if (dueCards.length > 0) dueCardId = dueCards[0]._id;
        const passed = dueRes.status === 200 && dueCards.length > 0;
        results.push({
            test: "24. Vocab: Get due cards for spaced repetition (GET /api/vocab/due)",
            status: dueRes.status,
            passed,
            note: `Cards due today: ${dueCards.length} | First word: "${dueCards[0]?.word}"`,
        });
    } catch (e: any) {
        results.push({ test: "24. Vocab: Get due cards", status: e.response?.status || e.message, passed: false });
    }

    // 25. Vocab Leitner Review (POST /api/vocab/cards/:id/review)
    try {
        const reviewRes = await axios.post(
            `${baseUrl}/api/vocab/cards/${dueCardId}/review`,
            { grade: "good" },
            {
                headers: { Cookie: studentCookie },
            }
        );
        const card = reviewRes.data?.card || reviewRes.data;
        const passed = reviewRes.status === 200 && card?.box >= 2 && !!card?.nextReviewDate;
        results.push({
            test: `25. Vocab: Leitner review card (POST /api/vocab/cards/${dueCardId}/review)`,
            status: reviewRes.status,
            passed,
            note: `Word: "${card?.word}", new Box: ${card?.box}, nextReview: ${card?.nextReviewDate?.slice(0, 10)}`,
        });
    } catch (e: any) {
        results.push({ test: "25. Vocab: Leitner review", status: e.response?.status || e.message, passed: false });
    }

    // 26. Admin Metrics (GET /api/admin/metrics)
    try {
        const metricsRes = await axios.get(`${baseUrl}/api/admin/metrics`, {
            headers: { Cookie: adminCookie },
        });
        const m = metricsRes.data?.metrics;
        const userCount = m?.totalUsers ?? m?.usersCount ?? 0;
        const attemptCount = m?.totalAttempts ?? m?.attemptsCount ?? 0;
        const passed = metricsRes.status === 200 && userCount >= 2 && attemptCount > 0;
        results.push({
            test: "26. Admin: Overview metrics (GET /api/admin/metrics)",
            status: metricsRes.status,
            passed,
            note: `Users: ${userCount}, Attempts: ${attemptCount}, Tests: ${m?.testsCount}`,
        });
    } catch (e: any) {
        results.push({ test: "26. Admin: Overview metrics", status: e.response?.status || e.message, passed: false });
    }

    // 27. Admin Tests List (GET /api/admin/tests)
    try {
        const adminTestsRes = await axios.get(`${baseUrl}/api/admin/tests`, {
            headers: { Cookie: adminCookie },
        });
        const tests = adminTestsRes.data?.tests || [];
        const passed = adminTestsRes.status === 200 && tests.length >= 2;
        results.push({
            test: "27. Admin: List tests (GET /api/admin/tests)",
            status: adminTestsRes.status,
            passed,
            note: `Tests count: ${tests.length}`,
        });
    } catch (e: any) {
        results.push({ test: "27. Admin: List tests", status: e.response?.status || e.message, passed: false });
    }

    // 28. Admin Create & Delete Test (POST /api/admin/tests & DELETE /api/admin/tests/:id)
    try {
        const createTestRes = await axios.post(
            `${baseUrl}/api/admin/tests`,
            {
                title: "E2E Automated Test",
                timeLimit: 134,
                difficulty: "medium",
                sections: [
                    { name: "Reading and Writing Module 1", module: 1, questionsCount: 27, timeLimit: 32 },
                    { name: "Math Module 1", module: 1, questionsCount: 22, timeLimit: 35 },
                ],
            },
            {
                headers: { Cookie: adminCookie },
            }
        );
        const createdTestId = createTestRes.data?.test?._id;
        const deleteRes = await axios.delete(`${baseUrl}/api/admin/tests/${createdTestId}`, {
            headers: { Cookie: adminCookie },
        });
        const passed = createTestRes.status === 201 && deleteRes.status === 200;
        results.push({
            test: "28. Admin: Create & Delete Test (POST & DELETE /api/admin/tests)",
            status: `${createTestRes.status} & ${deleteRes.status}`,
            passed,
            note: `Created and cleaned up test ${createdTestId}`,
        });
    } catch (e: any) {
        results.push({ test: "28. Admin: Create & Delete Test", status: e.response?.status || e.message, passed: false });
    }

    // 29. Admin Users List (GET /api/admin/users)
    try {
        const usersRes = await axios.get(`${baseUrl}/api/admin/users`, {
            headers: { Cookie: adminCookie },
        });
        const users = usersRes.data?.users || [];
        const passed = usersRes.status === 200 && users.length >= 2;
        results.push({
            test: "29. Admin: List users (GET /api/admin/users)",
            status: usersRes.status,
            passed,
            note: `Users count: ${users.length} (Admin + Students)`,
        });
    } catch (e: any) {
        results.push({ test: "29. Admin: List users", status: e.response?.status || e.message, passed: false });
    }

    // 30. Admin Vocab Decks Create & Delete (POST & DELETE /api/admin/vocab/decks)
    try {
        const createDeckRes = await axios.post(
            `${baseUrl}/api/admin/vocab/decks`,
            {
                title: "E2E Automated Vocab Deck",
                description: "Temporary deck for E2E verification",
                isPublic: true,
            },
            {
                headers: { Cookie: adminCookie },
            }
        );
        const createdDeckId = createDeckRes.data?.deck?._id;
        const deleteDeckRes = await axios.delete(`${baseUrl}/api/admin/vocab/decks/${createdDeckId}`, {
            headers: { Cookie: adminCookie },
        });
        const passed = createDeckRes.status === 201 && deleteDeckRes.status === 200;
        results.push({
            test: "30. Admin: Create & Delete Vocab Deck (POST & DELETE /api/admin/vocab/decks)",
            status: `${createDeckRes.status} & ${deleteDeckRes.status}`,
            passed,
            note: `Created and cleaned up deck ${createdDeckId}`,
        });
    } catch (e: any) {
        results.push({ test: "30. Admin: Create & Delete Vocab Deck", status: e.response?.status || e.message, passed: false });
    }

    // 31. Offline Asset: Demo figure file (GET /demo-figures/fig-767707cf65cdd50f.png)
    try {
        const figRes = await axios.get(`${baseUrl}/demo-figures/fig-767707cf65cdd50f.png`);
        results.push({
            test: "31. Offline Assets: Demo figure served (GET /demo-figures/...png)",
            status: figRes.status,
            passed: figRes.status === 200,
            note: `Content-Type: ${figRes.headers["content-type"]}`,
        });
    } catch (e: any) {
        results.push({ test: "31. Offline Assets: Demo figure served", status: e.response?.status || e.message, passed: false });
    }

    // Summary
    console.log("\n======================== VERIFICATION SUMMARY ========================");
    let allPassed = true;
    for (const r of results) {
        const icon = r.passed ? "✔ PASS" : "✖ FAIL";
        console.log(`[${icon}] ${r.test} (Status: ${r.status}) ${r.note ? `| ${r.note}` : ""}`);
        if (!r.passed) allPassed = false;
    }
    console.log("======================================================================");

    if (allPassed) {
        console.log(`\n🎉 ALL ${results.length} ENDPOINT & BARRIER CHECKS PASSED SUCCESSFULLY!\n`);
        process.exit(0);
    } else {
        const failedCount = results.filter((r) => !r.passed).length;
        console.error(`\n❌ ${failedCount} CHECKS FAILED!\n`);
        process.exit(1);
    }
}

verifyAll().catch((err) => {
    console.error("Verification script failed unexpectedly:", err);
    process.exit(1);
});
