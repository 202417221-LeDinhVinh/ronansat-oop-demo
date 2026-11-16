import { container } from "@/lib/container";

export async function POST(req: Request) {
    return container.startAttemptController.handle(req);
}
