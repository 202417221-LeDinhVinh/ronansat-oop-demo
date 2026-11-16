import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.getResultsController.handle(req);
}

export async function POST(req: Request) {
    return container.createResultController.handle(req);
}
