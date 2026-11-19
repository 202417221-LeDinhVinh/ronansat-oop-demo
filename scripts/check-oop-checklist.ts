import fs from "fs";
import path from "path";

interface Row {
    line: number;
    concept: string;
    files: string[];
    symbols: string[];
    tests: string[];
}

const root = process.cwd();
const checklistPath = path.join(root, "docs", "v3", "OOP-CHECKLIST.md");

function extractCodeSpans(cell: string): string[] {
    const spans: string[] = [];
    const pattern = /`([^`]+)`/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(cell)) !== null) {
        const value = match[1].trim();
        if (value && value !== "-" && value !== "—") {
            spans.push(value);
        }
    }
    return spans;
}

function walkFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) return [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
        } else if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function parseRows(markdown: string): Row[] {
    const rows: Row[] = [];
    const lines = markdown.split(/\r?\n/);

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return;

        const cells = trimmed
            .slice(1, -1)
            .split("|")
            .map((cell) => cell.trim());

        if (cells.length < 5) return;
        if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) return;
        if (cells[0].toLowerCase() === "concept") return;

        const files = extractCodeSpans(cells[1]);
        const symbols = extractCodeSpans(cells[2]);
        const tests = extractCodeSpans(cells[4]);
        if (files.length === 0 && symbols.length === 0) return;

        rows.push({
            line: index + 1,
            concept: cells[0],
            files,
            symbols,
            tests,
        });
    });

    return rows;
}

function main(): void {
    if (!fs.existsSync(checklistPath)) {
        console.error(`Checklist not found: ${checklistPath}`);
        process.exit(1);
    }

    const markdown = fs.readFileSync(checklistPath, "utf8");
    const rows = parseRows(markdown);
    const testFiles = walkFiles(path.join(root, "tests"));
    const testContents = testFiles.map((file) => ({
        file,
        content: fs.readFileSync(file, "utf8"),
    }));

    const misses: string[] = [];
    let checkedFiles = 0;
    let checkedSymbols = 0;
    let checkedTests = 0;

    for (const row of rows) {
        if (row.files.length === 0) {
            misses.push(`line ${row.line}: ${row.concept} has no file reference`);
            continue;
        }
        if (row.symbols.length === 0) {
            misses.push(`line ${row.line}: ${row.concept} has no symbol reference`);
            continue;
        }

        for (const fileRef of row.files) {
            const filePath = path.join(root, fileRef);
            checkedFiles++;
            if (!fs.existsSync(filePath)) {
                misses.push(`line ${row.line}: missing file ${fileRef}`);
                continue;
            }

            const content = fs.readFileSync(filePath, "utf8");
            for (const symbol of row.symbols) {
                checkedSymbols++;
                if (!content.includes(symbol)) {
                    misses.push(
                        `line ${row.line}: ${fileRef} does not contain symbol "${symbol}"`
                    );
                }
            }
        }

        for (const testName of row.tests) {
            checkedTests++;
            const found = testContents.some((testFile) => testFile.content.includes(testName));
            if (!found) {
                misses.push(`line ${row.line}: no test named "${testName}" exists under tests/`);
            }
        }
    }

    if (misses.length > 0) {
        console.error("OOP checklist verification FAILED:");
        for (const miss of misses) {
            console.error(`  - ${miss}`);
        }
        console.error(
            `\n${rows.length} rows checked, ${misses.length} miss(es). ` +
                `${checkedFiles} files, ${checkedSymbols} symbols, ${checkedTests} tests.`
        );
        process.exit(1);
    }

    console.log("OOP checklist verification PASSED.");
    console.log(
        `${rows.length} rows, ${checkedFiles} file references, ` +
            `${checkedSymbols} symbol checks, ${checkedTests} test checks.`
    );
}

main();
