import { container } from "@/lib/container";

export async function GET(req: Request) {
    return container.userSettingsController.handle(req);
}

export async function PUT(req: Request) {
    return container.userSettingsController.handle(req);
}
