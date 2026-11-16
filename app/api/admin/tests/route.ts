import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.getTestsController.handle(req);
}

export async function POST(req: Request) {
    return container.adminTestsController.handle(req);
}
