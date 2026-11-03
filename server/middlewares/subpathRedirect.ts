import type { Middleware } from "koa";
import { withBasePath } from "@shared/utils/subpath";

/**
 * Normalizes root-relative response redirects at the web service boundary.
 *
 * @param basePath the application base path.
 * @returns middleware that normalizes response redirects.
 */
export default function subpathRedirect(basePath: string): Middleware {
  return async (ctx, next) => {
    await next();

    const location = ctx.response.get("Location");
    if (basePath && location?.startsWith("/")) {
      ctx.set("Location", withBasePath(location, basePath));
    }
  };
}
