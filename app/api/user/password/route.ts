import { container } from "@/lib/container";

export async function POST(req: Request) {
    return container.userPasswordController.handle(req);
}

export async function PUT(req: Request) {
    return container.userPasswordController.handle(req);
}
