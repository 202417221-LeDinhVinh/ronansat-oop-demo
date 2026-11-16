import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function POST(req: Request, context: RequestContext) {
    return container.retryErrorLogController.handle(req, context);
}
