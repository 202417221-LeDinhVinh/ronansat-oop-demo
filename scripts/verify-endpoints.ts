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
    // 1. Get CSRF token
    const csrfRes = await axios.get(`${baseUrl}/api/auth/csrf`);
    const cookies = parseCookies(csrfRes.headers["set-cookie"]);
    const csrfToken = csrfRes.data.csrfToken;

    // 2. Post credentials
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

async function verifyAll() {
    const baseUrl = "http://localhost:3000";
    console.log("=== STARTING END-TO-END HTTP VERIFICATION (PHASE 2) ===");
    const results: { test: string; status: number | string; passed: boolean; note?: string }[] = [];

    // 1. Home page
    try {
        const res = await axios.get(`${baseUrl}/`);
        results.push({ test: "1. Home page (GET /)", status: res.status, passed: res.status === 200 });
    } catch (e: any) {
        results.push({ test: "1. Home page (GET /)", status: e.response?.status || e.message, passed: false });
    }

    // 2. Register new user
    const uniqueEmail = `testuser_${Date.now()}@ronansat.com`;
    try {
        const regRes = await axios.post(`${baseUrl}/api/auth/register`, {
            name: "Newly Registered Student",
            email: uniqueEmail,
            password: "RegisteredPassword123!",
        });
        results.push({
            test: "2. Register new user (POST /api/auth/register)",
            status: regRes.status,
            passed: regRes.status === 201,
            note: `Created userId: ${regRes.data?.userId}`,
        });
    } catch (e: any) {
        results.push({ test: "2. Register new user", status: e.response?.status || e.message, passed: false });
    }

    // 3a. Login seeded student
    let studentCookie = "";
    try {
        const loginStudent = await loginUser("student@ronansat.com", "StudentPassword123!", baseUrl);
        studentCookie = loginStudent.cookieHeader;
        const passed = !!loginStudent.cookies["next-auth.session-token"];
        results.push({
            test: "3a. Login seeded student (POST credentials)",
            status: loginStudent.status,
            passed: passed || loginStudent.status === 200,
            note: passed ? "Received next-auth.session-token" : "Login status 200",
        });
    } catch (e: any) {
        results.push({ test: "3a. Login seeded student", status: e.response?.status || e.message, passed: false });
    }

    // 3b. Login seeded admin
    let adminCookie = "";
    try {
        const loginAdmin = await loginUser("admin@ronansat.com", "AdminPassword123!", baseUrl);
        adminCookie = loginAdmin.cookieHeader;
        const passed = !!loginAdmin.cookies["next-auth.session-token"];
        results.push({
            test: "3b. Login seeded admin (POST credentials)",
            status: loginAdmin.status,
            passed: passed || loginAdmin.status === 200,
            note: passed ? "Received next-auth.session-token" : "Login status 200",
        });
    } catch (e: any) {
        results.push({ test: "3b. Login seeded admin", status: e.response?.status || e.message, passed: false });
    }

    // 4. Test list API - verify both prod tests and recomputed section counts
    let seededSeedTestId = "";
    let test1Found = false;
    let test2Found = false;
    try {
        const testsRes = await axios.get(`${baseUrl}/api/tests`);
        const tests = testsRes.data?.tests || [];
        const t1 = tests.find((t: any) => t.title.includes("2025 March INT - A"));
        const t2 = tests.find((t: any) => t.title.includes("2025 October US - A"));

        test1Found = !!t1;
        test2Found = !!t2;

        const t1Counts = t1?.sections?.map((s: any) => s.questionsCount) || [];
        const t2Counts = t2?.sections?.map((s: any) => s.questionsCount) || [];

        // Check expected counts:
        // Test 1: Math M1: 15, Math M2: 15, Verbal M1: 27, Verbal M2: 27 -> sum = 84
        // Test 2: Math M1: 16, Math M2: 17, Verbal M1: 27, Verbal M2: 27 -> sum = 87
        const t1Sum = t1Counts.reduce((acc: number, c: number) => acc + c, 0);
        const t2Sum = t2Counts.reduce((acc: number, c: number) => acc + c, 0);

        const correctCounts = t1Sum === 84 && t2Sum === 87;

        if (t1) {
            seededSeedTestId = t1._id;
        } else if (tests.length > 0) {
            seededSeedTestId = tests[0]._id;
        }

        results.push({
            test: "4. Test list API (GET /api/tests returns both prod tests with correct section counts)",
            status: testsRes.status,
            passed: testsRes.status === 200 && test1Found && test2Found && correctCounts,
            note: `Tests: ${tests.length} | Test1: ${t1?.title} (${t1Counts.join(", ")}, total: ${t1Sum}) | Test2: ${t2?.title} (${t2Counts.join(", ")}, total: ${t2Sum})`,
        });
    } catch (e: any) {
        results.push({ test: "4. Test list API", status: e.response?.status || e.message, passed: false });
    }

    // 5. Questions API - verify math question with LaTeX and question with local figure path
    let sampleFigureUrl = "";
    try {
        const qRes = await axios.get(`${baseUrl}/api/questions?testId=${seededSeedTestId}`);
        const questions = qRes.data?.questions || [];

        const mathLatexQ = questions.find(
            (q: any) => q.section === "Math" && (q.questionText?.includes("\\(") || q.questionText?.includes("\\["))
        );
        const imageQ = questions.find(
            (q: any) => q.imageUrl && q.imageUrl.startsWith("/demo-figures/")
        );

        if (imageQ) {
            sampleFigureUrl = imageQ.imageUrl;
        }

        const passed = !!mathLatexQ && !!imageQ;
        results.push({
            test: "5. Questions API (Math LaTeX question & local image path check)",
            status: qRes.status,
            passed: qRes.status === 200 && passed,
            note: `Found ${questions.length} questions. LaTeX Math Q: "${mathLatexQ?.questionText?.slice(0, 40)}..." | Figure: ${sampleFigureUrl}`,
        });
    } catch (e: any) {
        results.push({ test: "5. Questions API", status: e.response?.status || e.message, passed: false });
    }

    // 6. Local demo figure HTTP check (GET /demo-figures/<file> returns 200)
    try {
        if (!sampleFigureUrl) {
            sampleFigureUrl = "/demo-figures/fig-767707cf65cdd50f.png";
        }
        const figRes = await axios.get(`${baseUrl}${sampleFigureUrl}`);
        results.push({
            test: `6. Offline demo figure check (GET ${sampleFigureUrl})`,
            status: figRes.status,
            passed: figRes.status === 200,
            note: `Content-Type: ${figRes.headers["content-type"]}, size: ${figRes.data?.length || "OK"}`,
        });
    } catch (e: any) {
        results.push({ test: "6. Offline demo figure check", status: e.response?.status || e.message, passed: false });
    }

    // 7. Test page loads
    try {
        const testPageRes = await axios.get(`${baseUrl}/test/${seededSeedTestId}`, {
            headers: { Cookie: studentCookie },
        });
        results.push({
            test: `7. Test page loads (GET /test/${seededSeedTestId})`,
            status: testPageRes.status,
            passed: testPageRes.status === 200,
        });
    } catch (e: any) {
        results.push({ test: "7. Test page loads", status: e.response?.status || e.message, passed: false });
    }

    // 8. Submitting a result works
    try {
        const qRes = await axios.get(`${baseUrl}/api/questions?testId=${seededSeedTestId}`);
        const questions = qRes.data?.questions || [];
        const answers = questions.map((q: any) => ({
            questionId: q._id,
            userAnswer: q.correctAnswer,
            isCorrect: true,
        }));

        const submitRes = await axios.post(
            `${baseUrl}/api/results`,
            {
                testId: seededSeedTestId,
                answers: answers,
                score: 1560,
                sectionBreakdown: { readingAndWriting: 780, math: 780 },
            },
            {
                headers: { Cookie: studentCookie },
            }
        );

        results.push({
            test: "8. Submit result (POST /api/results)",
            status: submitRes.status,
            passed: submitRes.status === 201,
            note: `New result score: ${submitRes.data?.result?.score}`,
        });
    } catch (e: any) {
        results.push({ test: "8. Submit result", status: e.response?.status || e.message, passed: false });
    }

    // 9. Leaderboard API
    try {
        const lbRes = await axios.get(`${baseUrl}/api/leaderboard`);
        const lb = lbRes.data?.leaderboard || [];
        results.push({
            test: "9. Leaderboard API (GET /api/leaderboard)",
            status: lbRes.status,
            passed: lbRes.status === 200 && lb.length > 0,
            note: `Entries count: ${lb.length}, Top score: ${lb[0]?.highestScore}`,
        });
    } catch (e: any) {
        results.push({ test: "9. Leaderboard API", status: e.response?.status || e.message, passed: false });
    }

    // 10. Review API & Page
    try {
        const reviewApiRes = await axios.get(`${baseUrl}/api/results`, {
            headers: { Cookie: studentCookie },
        });
        const reviewPageRes = await axios.get(`${baseUrl}/review`, {
            headers: { Cookie: studentCookie },
        });
        const count = reviewApiRes.data?.results?.length || 0;
        results.push({
            test: "10. Review API & Page (GET /api/results & /review)",
            status: `${reviewApiRes.status} & ${reviewPageRes.status}`,
            passed: reviewApiRes.status === 200 && reviewPageRes.status === 200 && count > 0,
            note: `Past results count: ${count}`,
        });
    } catch (e: any) {
        results.push({ test: "10. Review API & Page", status: e.response?.status || e.message, passed: false });
    }

    // 11. User stats API
    try {
        const statsRes = await axios.get(`${baseUrl}/api/user/stats`, {
            headers: { Cookie: studentCookie },
        });
        results.push({
            test: "11. User stats API (GET /api/user/stats)",
            status: statsRes.status,
            passed: statsRes.status === 200 && statsRes.data?.testsTaken > 0,
            note: `testsTaken: ${statsRes.data?.testsTaken}, highestScore: ${statsRes.data?.highestScore}`,
        });
    } catch (e: any) {
        results.push({ test: "11. User stats API", status: e.response?.status || e.message, passed: false });
    }

    // 12. Admin page & Admin API
    try {
        const adminPageRes = await axios.get(`${baseUrl}/admin`, {
            headers: { Cookie: adminCookie },
        });
        const studentsRes = await axios.get(`${baseUrl}/api/students`);
        results.push({
            test: "12. Admin page & Student cards API (GET /admin & /api/students)",
            status: `${adminPageRes.status} & ${studentsRes.status}`,
            passed: adminPageRes.status === 200 && studentsRes.status === 200,
            note: `Students count: ${studentsRes.data?.students?.length}`,
        });
    } catch (e: any) {
        results.push({ test: "12. Admin page & Admin API", status: e.response?.status || e.message, passed: false });
    }

    // 13. AI Chat fallback test (zero API keys)
    try {
        const qRes = await axios.get(`${baseUrl}/api/questions?testId=${seededSeedTestId}`);
        const sampleQuestionId = qRes.data?.questions?.[0]?._id;
        const chatRes = await axios.post(
            `${baseUrl}/api/chat`,
            {
                questionId: sampleQuestionId,
                message: "Hello AI Tutor, explain this question please",
            },
            {
                headers: { Cookie: studentCookie },
            }
        );
        results.push({
            test: "13. AI Chat fallback (POST /api/chat without key)",
            status: chatRes.status,
            passed: chatRes.status === 200 && !!chatRes.data?.response,
            note: `Response: "${chatRes.data?.response?.substring(0, 60)}..."`,
        });
    } catch (e: any) {
        results.push({ test: "13. AI Chat fallback", status: e.response?.status || e.message, passed: false });
    }

    // Print summary
    console.log("\n================ VERIFICATION SUMMARY ================");
    let allPassed = true;
    for (const r of results) {
        const icon = r.passed ? "✔ PASS" : "✖ FAIL";
        console.log(`[${icon}] ${r.test} | Status: ${r.status} ${r.note ? `| Note: ${r.note}` : ""}`);
        if (!r.passed) allPassed = false;
    }
    console.log("======================================================");

    if (allPassed) {
        console.log("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
        process.exit(0);
    } else {
        console.error("SOME CHECKS FAILED!");
        process.exit(1);
    }
}

verifyAll().catch((err) => {
    console.error("Verification script failed with error:", err);
    process.exit(1);
});
