import fs from "fs";
import path from "path";
import axios from "axios";
import { getLocalFigureFilename, getLocalFigurePath } from "../lib/infrastructure/seed/ProdSampleImporter";

export { getLocalFigureFilename, getLocalFigurePath };

async function fetchFigures() {
    console.log("=== FETCHING DEMO FIGURES FOR OFFLINE USE ===");
    const dataPath = path.resolve(process.cwd(), "data", "prod-sample-tests.json");
    if (!fs.existsSync(dataPath)) {
        console.error(`Data file not found at: ${dataPath}`);
        process.exit(1);
    }

    const outputDir = path.resolve(process.cwd(), "public", "demo-figures");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const tests = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const urls = new Set<string>();

    for (const test of tests) {
        for (const section of test.test_sections || []) {
            for (const q of section.questions || []) {
                if (q.image_url && typeof q.image_url === "string" && q.image_url.startsWith("http")) {
                    urls.add(q.image_url);
                }
            }
        }
    }

    console.log(`Discovered ${urls.size} unique image URLs to download.`);

    let successCount = 0;
    for (const url of urls) {
        const filename = getLocalFigureFilename(url);
        const destPath = path.join(outputDir, filename);

        try {
            console.log(`Downloading: ${url} -> ${filename}`);
            const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
            fs.writeFileSync(destPath, Buffer.from(response.data));
            successCount++;
        } catch (err: any) {
            console.error(`Failed to download ${url}: ${err.message}`);
        }
    }

    console.log(`Successfully downloaded ${successCount} / ${urls.size} images to ${outputDir}`);
}

if (require.main === module || process.argv[1]?.includes("fetch-demo-figures")) {
    fetchFigures().catch((err) => {
        console.error("Fatal error fetching figures:", err);
        process.exit(1);
    });
}
