import Router from "@koa/router";
import { Day } from "@shared/utils/time";
import env from "@server/env";
import { createMcpDiscoveryRouter } from "./mcp";
import { opensearchResponse } from "./opensearch";
import { robotsResponse } from "./robots";

const router = new Router();

router.get("/opensearch.xml", (ctx) => {
  ctx.type = "text/xml";
  ctx.response.set("Cache-Control", `public, max-age=${7 * Day.seconds}`);
  ctx.body = opensearchResponse(`${ctx.request.URL.origin}${env.basePath}`);
});

/**
 * Creates the routes that clients request from the origin root regardless of
 * where the application is mounted, robots.txt and OAuth discovery.
 *
 * @param basePath the application base path.
 * @returns the configured router.
 */
export function createOriginDiscoveryRouter(basePath: string): Router {
  const originRouter = new Router();

  originRouter.get("/robots.txt", (ctx) => {
    ctx.body = robotsResponse(basePath);
  });
  originRouter.use(createMcpDiscoveryRouter(basePath).routes());

  return originRouter;
}

export default router;
