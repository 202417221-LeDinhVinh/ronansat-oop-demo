import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function GET(req: Request, context: RequestContext) {
    return container.getTestByIdController.handle(req, context);
}

export async function PUT(req: Request, context: RequestContext) {
    return container.adminTestDetailController.handle(req, context);
}

export async function DELETE(req: Request, context: RequestContext) {
    return container.adminTestDetailController.handle(req, context);
}
