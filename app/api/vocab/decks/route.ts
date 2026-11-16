import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.getVocabDecksController.handle(req);
}

export async function POST(req: Request) {
    return container.createVocabDeckController.handle(req);
}
