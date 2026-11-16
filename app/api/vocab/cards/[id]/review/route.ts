import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function POST(req: Request, context: RequestContext) {
    return container.reviewVocabCardController.handle(req, context);
}
