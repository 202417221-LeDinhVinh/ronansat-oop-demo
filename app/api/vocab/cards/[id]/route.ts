import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function PUT(req: Request, context: RequestContext) {
    return container.updateVocabCardController.handle(req, context);
}

export async function DELETE(req: Request, context: RequestContext) {
    return container.deleteVocabCardController.handle(req, context);
}
