import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.getQuestionsController.handle(req);
}

export async function POST(req: Request) {
    return container.adminQuestionsController.handle(req);
}
