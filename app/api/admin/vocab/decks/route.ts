import { container } from "@/lib/container";

export async function POST(req: Request) {
    return container.adminVocabDecksController.handle(req);
}
