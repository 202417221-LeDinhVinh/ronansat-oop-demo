import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import axios from "axios";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

async function main() {
    console.log("=== TAKING APPLICATION SCREENSHOTS ===");
    const outDir = path.resolve(process.cwd(), "docs", "screenshots");
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    if (!fs.existsSync(CHROME_PATH)) {
        throw new Error(`Chrome executable not found at ${CHROME_PATH}`);
    }

    // 1. Get tests
    const testsRes = await axios.get(`${BASE_URL}/api/tests`);
    const tests = testsRes.data?.tests || [];
    if (tests.length === 0) {
        throw new Error("No tests found in database!");
    }
    const test1 = tests[0];
    const testId = test1._id;
    console.log(`Using Test: "${test1.title}" (${testId})`);

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        defaultViewport: { width: 1400, height: 900 },
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--window-size=1400,900"
        ]
    });

    try {
        const page = await browser.newPage();

        // 2. Login as student
        console.log("Logging in as student...");
        await page.goto(`${BASE_URL}/auth`, { waitUntil: "networkidle2" });
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', "student@ronansat.com");
        await page.type('input[type="password"]', "StudentPassword123!");
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: "networkidle2" });
        console.log("Logged in successfully. Current URL:", page.url());

        // 3. Screenshot 1: Reading and Writing question with passage (Question 1)
        console.log("Navigating to Reading and Writing test page (Question 1)...");
        await page.goto(`${BASE_URL}/test/${testId}?section=Reading%20and%20Writing&module=1&mode=sectional`, {
            waitUntil: "networkidle2"
        });
        await page.waitForSelector(".rich-text", { timeout: 10000 });
        await new Promise((r) => setTimeout(r, 2000));

        const rwPath = path.join(outDir, "01-reading-writing-passage.png");
        await page.screenshot({ path: rwPath });
        console.log(`Saved screenshot 1: ${rwPath}`);

        // 4. Screenshot 2: Math question with LaTeX (Question 2)
        console.log("Navigating to Math test page (Question 2 - LaTeX)...");
        await page.goto(`${BASE_URL}/test/${testId}?section=Math&module=1&mode=sectional`, {
            waitUntil: "networkidle2"
        });
        await page.waitForSelector(".rich-text", { timeout: 10000 });

        // Click Next to reach Question 2
        const allBtnsQ2 = await page.$$("button");
        for (const btn of allBtnsQ2) {
            const text = await page.evaluate((el) => el.textContent, btn);
            if (text && text.trim().startsWith("Next")) {
                await btn.click();
                break;
            }
        }
        await new Promise((r) => setTimeout(r, 2000));

        const mathPath = path.join(outDir, "02-math-latex.png");
        await page.screenshot({ path: mathPath });
        console.log(`Saved screenshot 2: ${mathPath}`);

        // 5. Screenshot 3: Math question with Linear Graph Image & LaTeX (Question 3)
        console.log("Clicking Next to reach Question 3 (Linear Graph Image & LaTeX)...");
        const allBtnsQ3 = await page.$$("button");
        for (const btn of allBtnsQ3) {
            const text = await page.evaluate((el) => el.textContent, btn);
            if (text && text.trim().startsWith("Next")) {
                await btn.click();
                break;
            }
        }
        await new Promise((r) => setTimeout(r, 2000));

        const mathFigPath = path.join(outDir, "03-math-latex-with-figure.png");
        await page.screenshot({ path: mathFigPath });
        console.log(`Saved screenshot 3: ${mathFigPath}`);

        // 6. Screenshot 4: Reading and Writing Question with Table Figure & Passage (Question 11)
        console.log("Navigating to Reading & Writing Question with Table Figure & Passage (Question 11)...");
        await page.goto(`${BASE_URL}/test/${testId}?section=Reading%20and%20Writing&module=1&mode=sectional`, {
            waitUntil: "networkidle2"
        });
        await page.waitForSelector(".rich-text", { timeout: 10000 });
        for (let i = 1; i < 11; i++) {
            const nextButtons = await page.$$("button");
            for (const btn of nextButtons) {
                const text = await page.evaluate((el) => el.textContent, btn);
                if (text && text.trim().startsWith("Next")) {
                    await btn.click();
                    break;
                }
            }
            await new Promise((r) => setTimeout(r, 300));
        }
        await new Promise((r) => setTimeout(r, 2000));

        const rwFigPath = path.join(outDir, "04-reading-writing-with-table-figure.png");
        await page.screenshot({ path: rwFigPath });
        console.log(`Saved screenshot 4: ${rwFigPath}`);

        // 7. Screenshot 5: Review page
        console.log("Navigating to Review page...");
        await page.goto(`${BASE_URL}/review`, { waitUntil: "networkidle2" });
        await page.waitForSelector(".grid-cols-10", { timeout: 10000 });
        await new Promise((r) => setTimeout(r, 2000));

        const reviewPath = path.join(outDir, "05-review-page.png");
        await page.screenshot({ path: reviewPath });
        console.log(`Saved screenshot 5: ${reviewPath}`);

        // 8. Screenshot 6: Review Question Popup with Explanation
        console.log("Clicking question in Review grid to open popup...");
        const questionBtn = await page.$(".grid-cols-10 button");
        if (questionBtn) {
            await questionBtn.click();
            await page.waitForSelector(".rich-text", { timeout: 10000 });
            // Click "Explanation" button in the popup header to show explanation
            const buttons = await page.$$("button");
            for (const btn of buttons) {
                const text = await page.evaluate((el) => el.textContent, btn);
                if (text && text.includes("Explanation")) {
                    await btn.click();
                    break;
                }
            }
            await new Promise((r) => setTimeout(r, 2000));
            const popupPath = path.join(outDir, "06-review-question-popup.png");
            await page.screenshot({ path: popupPath });
            console.log(`Saved screenshot 6: ${popupPath}`);
        }

        console.log("All screenshots taken successfully!");
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error("Screenshot error:", err);
    process.exit(1);
});
