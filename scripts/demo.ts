import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import * as dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase, DEMO_ADMIN, DEMO_STUDENT } from "../lib/seedData";

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
}

const DEFAULT_FIXED_PORT = 27018;
const DEMO_SECRET = "ronansat-oop-demo-secret-key-2026";
const DEMO_URL = "http://localhost:3000";

async function runDemo() {
    console.log("====================================================");
    console.log("        RONANSAT OOP DEMO - ONE-COMMAND LAUNCHER    ");
    console.log("====================================================");

    let mongoUri = process.env.MONGODB_URI;
    let mongod: MongoMemoryServer | null = null;

    if (mongoUri) {
        console.log(`[Database] Using existing MONGODB_URI from environment / .env.local:`);
        console.log(`           ${mongoUri}`);
    } else {
        console.log(`[Database] Starting in-memory MongoDB on fixed port ${DEFAULT_FIXED_PORT}...`);
        try {
            mongod = await MongoMemoryServer.create({
                instance: {
                    port: DEFAULT_FIXED_PORT,
                    dbName: "ronansat",
                },
            });
            const baseUri = mongod.getUri();
            mongoUri = baseUri.endsWith("/") ? `${baseUri}ronansat` : `${baseUri}/ronansat`;
            console.log(`[Database] In-memory MongoDB running at: ${mongoUri}`);
        } catch (err: any) {
            console.warn(`[Database] Fixed port ${DEFAULT_FIXED_PORT} failed (${err.message}). Falling back to dynamic port...`);
            mongod = await MongoMemoryServer.create({
                instance: {
                    dbName: "ronansat",
                },
            });
            const baseUri = mongod.getUri();
            mongoUri = baseUri.endsWith("/") ? `${baseUri}ronansat` : `${baseUri}/ronansat`;
            console.log(`[Database] In-memory MongoDB running at: ${mongoUri}`);
        }
    }

    // Set environment variables for current and child processes
    process.env.MONGODB_URI = mongoUri;
    process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || DEMO_URL;
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || DEMO_SECRET;

    // Seed data
    console.log("\n[Seeding] Seeding initial test, questions, users and past results...");
    await seedDatabase(mongoUri);

    console.log("\n----------------------------------------------------");
    console.log("  DEMO CREDENTIALS FOR TESTING:");
    console.log(`  * Admin Account:   ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
    console.log(`  * Student Account: ${DEMO_STUDENT.email} / ${DEMO_STUDENT.password}`);
    console.log("----------------------------------------------------\n");

    // Launch Next.js dev server on port 3000
    console.log("[Server] Launching Next.js dev server on port 3000...");
    const nextDev = spawn("npx", ["next", "dev", "-p", "3000"], {
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            MONGODB_URI: mongoUri,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        },
    });

    let isShuttingDown = false;
    const cleanShutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log("\n[Shutdown] Shutting down demo server and cleanup...");

        try {
            if (nextDev && !nextDev.killed) {
                nextDev.kill();
            }
        } catch (e) {
            // Ignore process kill errors
        }

        if (mongod) {
            try {
                console.log("[Shutdown] Stopping in-memory MongoDB...");
                await mongod.stop();
                console.log("[Shutdown] In-memory MongoDB stopped cleanly.");
            } catch (err: any) {
                console.error("[Shutdown] Error stopping in-memory MongoDB:", err);
            }
        }

        process.exit(0);
    };

    process.on("SIGINT", cleanShutdown);
    process.on("SIGTERM", cleanShutdown);
    process.on("exit", () => {
        if (!isShuttingDown && mongod) {
            mongod.stop();
        }
    });

    nextDev.on("exit", async (code) => {
        console.log(`[Server] Next.js dev server exited with code ${code}`);
        await cleanShutdown();
    });
}

runDemo().catch((err) => {
    console.error("Fatal error running demo:", err);
    process.exit(1);
});
