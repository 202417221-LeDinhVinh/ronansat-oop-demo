import { DemoSeeder, DEMO_ADMIN, DEMO_STUDENT } from "./infrastructure/seed/DemoSeeder";

export { DEMO_ADMIN, DEMO_STUDENT };

export async function seedDatabase(mongoUri: string): Promise<void> {
    const seeder = new DemoSeeder();
    await seeder.seed(mongoUri);
}
