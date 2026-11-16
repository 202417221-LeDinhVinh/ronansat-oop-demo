import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function PUT(req: Request, context: RequestContext) {
    return container.adminQuestionDetailController.handle(req, context);
}

export async function DELETE(req: Request, context: RequestContext) {
    return container.adminQuestionDetailController.handle(req, context);
}
