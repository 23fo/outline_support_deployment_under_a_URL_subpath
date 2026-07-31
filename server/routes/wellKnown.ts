import type { Context } from "koa";
import Koa from "koa";
import Router from "koa-router";
import { TeamPreference } from "@shared/types";
import env from "@server/env";
import {
  authorizationServerMetadataPath,
  protectedResourceMetadataPath,
} from "@server/utils/oauthMetadata";
import { getTeamFromContext } from "@server/utils/passport";
import { robotsResponse } from "@server/utils/robots";

/**
 * Creates the origin-root routes used for OAuth discovery and robots.txt.
 *
 * @param basePath the application base path.
 * @returns the configured Koa application.
 */
export function createWellKnownApp(basePath = env.basePath): Koa {
  const app = new Koa();
  const router = new Router();
  const authorizationPaths = [authorizationServerMetadataPath(basePath)];
  const protectedResourcePaths = [
    protectedResourceMetadataPath(`${basePath}/mcp`),
  ];

  // Preserve the root-deployment aliases that predate base path support.
  if (!basePath) {
    authorizationPaths.push(authorizationServerMetadataPath("/mcp"));
    protectedResourcePaths.push(protectedResourceMetadataPath(""));
  }

  router.get(authorizationPaths, async (ctx) => {
    const base = `${originForRequest(ctx)}${basePath}`;
    const team = await getTeamFromContext(ctx, { includeOAuthState: false });
    const mcpEnabled = team?.getPreference(TeamPreference.MCP) ?? true;

    ctx.body = {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      revocation_endpoint: `${base}/oauth/revoke`,
      ...(!env.OAUTH_DISABLE_DCR &&
        mcpEnabled && {
          registration_endpoint: `${base}/oauth/register`,
        }),
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["read", "write"],
    };
  });

  router.get(protectedResourcePaths, async (ctx) => {
    const team = await getTeamFromContext(ctx, { includeOAuthState: false });
    const mcpEnabled = team?.getPreference(TeamPreference.MCP) ?? true;

    if (!mcpEnabled) {
      ctx.status = 404;
      return;
    }

    const base = `${originForRequest(ctx)}${basePath}`;
    ctx.body = {
      resource: `${base}/mcp`,
      authorization_servers: [base],
      scopes_supported: ["read", "write"],
      bearer_methods_supported: ["header"],
    };
  });

  router.get("/robots.txt", (ctx) => {
    ctx.type = "text/plain";
    ctx.body = robotsResponse(basePath);
  });

  app.use(router.routes());
  return app;
}

function originForRequest(ctx: Context): string {
  return env.isCloudHosted ? ctx.request.URL.origin : new URL(env.URL).origin;
}
