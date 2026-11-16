import { container } from "@/lib/container";

export async function POST(req: Request) {
    return container.registerController.handle(req);
}
