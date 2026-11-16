import * as dotenv from "dotenv";
import { seedDatabase } from "./lib/seedData";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in .env.local");
    process.exit(1);
}

seedDatabase(MONGODB_URI)
    .then(() => {
        console.log("Seeding complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error seeding database:", error);
        process.exit(1);
    });
