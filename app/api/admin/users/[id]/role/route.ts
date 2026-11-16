import { container } from "@/lib/container";
import { RequestContext } from "@/lib/http/BaseController";

export async function PATCH(req: Request, context: RequestContext) {
    return container.adminUserRoleController.handle(req, context);
}
