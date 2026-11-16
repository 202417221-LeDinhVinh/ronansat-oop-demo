import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.adminVocabDecksListController.handle(req);
}

export async function POST(req: Request) {
    return container.adminVocabDecksController.handle(req);
}
