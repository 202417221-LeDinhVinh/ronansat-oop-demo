import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function GET(req: Request, context: RequestContext) {
    return container.getResultDetailController.handle(req, context);
}
