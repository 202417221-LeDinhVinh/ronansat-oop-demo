import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.getErrorLogController.handle(req);
}
