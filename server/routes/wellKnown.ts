import Koa from "koa";
import Router from "@koa/router";
import { TeamPreference } from "@shared/types";
import {
  authorizationServerMetadataPath,
  protectedResourceMetadataPath,
} from "@shared/utils/oauthMetadata";
import env from "@server/env";
import { OAuthHelper } from "@server/utils/oauth/OAuthHelper";
import { getTeamFromContext } from "@server/utils/passport";

/**
 * Exposes RFC 8414 / RFC 9728 OAuth discovery paths at the origin root for
 * issuers hosted beneath a URL prefix. The normal app still serves discovery
 * below the mount path, but standards-compliant clients discover these URLs
 * under /.well-known/<name>/<issuer-path>.
 */
export function createWellKnownApp(basePath = env.basePath): Koa {
  const app = new Koa();
  const router = new Router();

  if (basePath) {
    router.get(authorizationServerMetadataPath(basePath), async (ctx) => {
      const issuer = OAuthHelper.getIssuer(ctx);
      const team = await getTeamFromContext(ctx, {
        includeOAuthState: false,
      });
      const mcpEnabled = team?.getPreference(TeamPreference.MCP) ?? true;

      ctx.body = {
        issuer,
        authorization_endpoint: `${issuer}/oauth/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        ...(!env.OAUTH_DISABLE_DCR &&
          team &&
          mcpEnabled && {
            registration_endpoint: `${issuer}/oauth/register`,
          }),
        client_id_metadata_document_supported: mcpEnabled,
        response_types_supported: OAuthHelper.responseTypes,
        grant_types_supported: OAuthHelper.grantTypes,
        token_endpoint_auth_methods_supported:
          OAuthHelper.tokenEndpointAuthMethods,
        code_challenge_methods_supported: ["S256"],
        scopes_supported: OAuthHelper.mcpScopes,
      };
    });

    router.get(
      protectedResourceMetadataPath(`${basePath}/mcp`),
      async (ctx) => {
        const team = await getTeamFromContext(ctx, {
          includeOAuthState: false,
        });
        const mcpEnabled = team?.getPreference(TeamPreference.MCP) ?? true;
        if (!mcpEnabled) {
          ctx.status = 404;
          return;
        }

        const issuer = OAuthHelper.getIssuer(ctx);
        ctx.body = {
          resource: `${issuer}/mcp`,
          authorization_servers: [issuer],
          scopes_supported: OAuthHelper.mcpScopes,
          bearer_methods_supported: ["header"],
        };
      }
    );
  }

  app.use(router.routes());
  return app;
}
