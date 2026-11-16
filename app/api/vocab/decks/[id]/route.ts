import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function GET(req: Request, context: RequestContext) {
    return container.getVocabDeckDetailController.handle(req, context);
}

export async function PUT(req: Request, context: RequestContext) {
    return container.updateVocabDeckController.handle(req, context);
}

export async function DELETE(req: Request, context: RequestContext) {
    return container.deleteVocabDeckController.handle(req, context);
}
