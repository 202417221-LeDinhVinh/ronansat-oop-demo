import * as fs from "fs";
import * as path from "path";

// 1. Gather all source files in lib/, app/, components/
function getFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== "node_modules" && file !== ".next" && file !== ".git") {
                getFiles(fullPath, fileList);
            }
        } else if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const searchDirs = ["lib", "app", "components"];
const codeFiles = searchDirs.flatMap((d) => getFiles(path.resolve(process.cwd(), d)));

// Load all file contents for grep
const codeContents = codeFiles.map((f) => ({
    file: f,
    content: fs.readFileSync(f, "utf-8"),
}));

function existsInCode(token: string): boolean {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`);
    return codeContents.some((c) => regex.test(c.content));
}

const identifierRegex = /[A-Z][A-Za-z0-9_]+|[a-z]+[A-Z][A-Za-z0-9_]*/g;
const tokens = new Set<string>();

// Ignore generic placeholders and standard TypeScript / framework builtins
const IGNORED_TOKENS = new Set([
    "T", "TId", "TEntity", "TDoc", "TProps", "TInput", "TOutput", "TEvent", "TEvents", "K", "U",
    "Promise", "Record", "Map", "Date", "Array", "Set", "String", "Number", "Boolean",
    "Object", "Error", "NextResponse", "NextRequest", "Session", "Request", "Response",
    "true", "false", "null", "undefined", "void", "string", "number", "boolean", "object",
    "Math", "JSON", "RegExp"
]);

// 2. Extract from slides/main.tex
const mainTexPath = path.resolve(process.cwd(), "slides/main.tex");
if (fs.existsSync(mainTexPath)) {
    const mainTexContent = fs.readFileSync(mainTexPath, "utf-8");

    // 2a. \texttt{...}
    const textttRegex = /\\texttt\{([^}]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = textttRegex.exec(mainTexContent)) !== null) {
        const inner = m[1].replace(/\\_/g, "_");
        let im: RegExpExecArray | null;
        while ((im = identifierRegex.exec(inner)) !== null) {
            if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
        }
    }

    // 2b. \lstinline|...| or \lstinline{...}
    const lstinlineRegex = /\\lstinline(?:\[[^\]]*\])?(?:\{([^}]+)\}|\|([^|]+)\|)/g;
    while ((m = lstinlineRegex.exec(mainTexContent)) !== null) {
        const inner = (m[1] || m[2] || "").replace(/\\_/g, "_");
        let im: RegExpExecArray | null;
        while ((im = identifierRegex.exec(inner)) !== null) {
            if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
        }
    }

    // 2c. \begin{lstlisting} ... \end{lstlisting}
    const lstlistingRegex = /\\begin\{lstlisting\}([\s\S]*?)\\end\{lstlisting\}/g;
    while ((m = lstlistingRegex.exec(mainTexContent)) !== null) {
        let inner = m[1];
        // Strip comments so prose in code comments is not checked as identifiers
        inner = inner.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
        let im: RegExpExecArray | null;
        while ((im = identifierRegex.exec(inner)) !== null) {
            if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
        }
    }
}

// 3. Extract class, method, and property names from docs/uml/*.mmd
const umlDir = path.resolve(process.cwd(), "docs/uml");
if (fs.existsSync(umlDir)) {
    const mmdFiles = fs.readdirSync(umlDir).filter((f) => f.endsWith(".mmd"));
    for (const file of mmdFiles) {
        const lines = fs.readFileSync(path.join(umlDir, file), "utf-8").split("\n");
        for (const line of lines) {
            const trimmed = line.trim();

            // Class definitions: "class ClassName" or "class ClassName~T~ {"
            const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
            if (classMatch) {
                const name = classMatch[1];
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(name)) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
            }

            // Relationship lines: "ClassA <|-- ClassB"
            const relMatch = trimmed.match(/([A-Za-z0-9_]+)\s*(?:<\|--|<\|\.\.|\*--|o--|-->|\.\.>|--)\s*([A-Za-z0-9_]+)/);
            if (relMatch) {
                for (const part of [relMatch[1], relMatch[2]]) {
                    let im: RegExpExecArray | null;
                    while ((im = identifierRegex.exec(part)) !== null) {
                        if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                    }
                }
            }

            // Sequence diagram participants: "participant C as SubmitAttemptController"
            const partMatch = trimmed.match(/participant\s+(?:[A-Za-z0-9_]+\s+as\s+)?([A-Za-z0-9_]+)/);
            if (partMatch) {
                const name = partMatch[1];
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(name)) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
            }

            // Sequence diagram method calls: "C->>S: submitAttempt(id, userId)"
            const seqCallMatch = trimmed.match(/->>.*:\s*([a-zA-Z0-9_]+)\s*\(/);
            if (seqCallMatch) {
                const method = seqCallMatch[1];
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(method)) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
            }

            // Flowchart / Class diagram class names inside <b>...</b>
            const boldMatch = trimmed.match(/<b>(.*?)<\/b>/);
            if (boldMatch) {
                const clean = boldMatch[1].replace(/&laquo;.*?&raquo;/g, "").replace(/\(.*?\)/g, "").replace(/&lt;.*?&gt;/g, "");
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(clean)) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
            }

            // Members / methods in class diagram: lines with visibility prefix +, -, #
            const memberMatch = trimmed.match(/^[\+\-\#]([a-zA-Z0-9_]+)/);
            if (memberMatch) {
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(memberMatch[1])) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
            }

            // Members with type annotations: "+MethodName(args) ReturnType"
            const typedMemberMatch = trimmed.match(/^[\+\-\#]([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*([A-Za-z0-9_]+)?/);
            if (typedMemberMatch) {
                const methodName = typedMemberMatch[1];
                let im: RegExpExecArray | null;
                while ((im = identifierRegex.exec(methodName)) !== null) {
                    if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                }
                if (typedMemberMatch[3]) {
                    const returnType = typedMemberMatch[3];
                    while ((im = identifierRegex.exec(returnType)) !== null) {
                        if (!IGNORED_TOKENS.has(im[0])) tokens.add(im[0]);
                    }
                }
            }
        }
    }
}

// 4. Verify against codebase
const notFound: string[] = [];
const found: string[] = [];

for (const token of Array.from(tokens).sort()) {
    if (existsInCode(token)) {
        found.push(token);
    } else {
        notFound.push(token);
    }
}

// 5. Verify code excerpts in slides/main.tex
interface ListingMiss {
    file: string | null;
    line: string;
    blockIndex: number;
}

const listingMisses: ListingMiss[] = [];
let totalListingBlocksChecked = 0;
let totalListingLinesChecked = 0;

if (fs.existsSync(mainTexPath)) {
    const mainTexContent = fs.readFileSync(mainTexPath, "utf-8");
    const blockRegex = /\\begin\{(?:lstlisting|minted)\}(?:\[[^\]]*\])?(?:\{[^}]*\})?([\s\S]*?)\\end\{(?:lstlisting|minted)\}/g;
    let bMatch: RegExpExecArray | null;
    let bIdx = 0;

    while ((bMatch = blockRegex.exec(mainTexContent)) !== null) {
        bIdx++;
        const rawContent = bMatch[1];
        const lines = rawContent.split(/\r?\n/);
        const firstNonEmpty = lines.find((l) => l.trim().length > 0);
        if (!firstNonEmpty) continue;

        const headerMatch = firstNonEmpty.trim().match(/^\/\/\s*(lib\/[^\s:]+)/);
        if (!headerMatch) continue;

        totalListingBlocksChecked++;
        let currentFile: string | null = null;
        let fileLinesNorm: Set<string> = new Set();

        for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed) continue;

            const fileMatch = trimmed.match(/^\/\/\s*(lib\/[^\s:]+)/);
            if (fileMatch) {
                currentFile = fileMatch[1];
                const fullPath = path.resolve(process.cwd(), currentFile);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    fileLinesNorm = new Set(
                        content.split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, " "))
                    );
                } else {
                    fileLinesNorm = new Set();
                    listingMisses.push({
                        file: currentFile,
                        line: `[FILE NOT FOUND: ${currentFile}]`,
                        blockIndex: bIdx,
                    });
                }
                continue;
            }

            if (trimmed === "// ...") {
                continue;
            }

            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue;
            }

            totalListingLinesChecked++;
            const norm = trimmed.replace(/\s+/g, " ");
            if (!currentFile || !fileLinesNorm.has(norm)) {
                listingMisses.push({
                    file: currentFile,
                    line: norm,
                    blockIndex: bIdx,
                });
            }
        }
    }
}

console.log("==========================================");
console.log(`ANTI-DRIFT IDENTIFIER CHECK`);
console.log("==========================================");
console.log(`Total unique identifiers checked: ${tokens.size}`);
console.log(`Found in lib/, app/, components/: ${found.length}`);
console.log(`Not found in codebase:             ${notFound.length}`);
console.log("------------------------------------------");
console.log(`Listing blocks checked:            ${totalListingBlocksChecked}`);
console.log(`Listing lines checked:             ${totalListingLinesChecked}`);
console.log(`Listing line misses:               ${listingMisses.length}`);
console.log("==========================================");

if (notFound.length > 0) {
    console.log("\nIDENTIFIERS NOT FOUND IN CODEBASE:");
    for (const item of notFound) {
        console.log(`  - ${item}`);
    }
} else {
    console.log("\nAll identifiers found in code!");
}

if (listingMisses.length > 0) {
    console.log("\nLISTING EXCERPT MISSES IN main.tex:");
    for (const miss of listingMisses) {
        console.log(`  [Block ${miss.blockIndex} -> ${miss.file}]: "${miss.line}"`);
    }
} else {
    console.log("All code listings verbatim match source files!");
}

if (notFound.length > 0 || listingMisses.length > 0) {
    process.exit(1);
}
