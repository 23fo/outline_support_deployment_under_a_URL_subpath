import { Server } from "node:https";
import Koa from "koa";
import compress from "koa-compress";
import helmet from "koa-helmet";
import mount from "koa-mount";
import enforceHttps, {
  httpsResolver,
  xForwardedProtoResolver,
} from "koa-sslify";
import { Second } from "@shared/utils/time";
import env from "@server/env";
import Logger from "@server/logging/Logger";
import Metrics from "@server/logging/Metrics";
import csp from "@server/middlewares/csp";
import { attachCSRFToken } from "@server/middlewares/csrf";
import subpathRedirect from "@server/middlewares/subpathRedirect";
import { userAgent } from "@server/middlewares/userAgent";
import { ShutdownHelper, ShutdownOrder } from "@server/utils/ShutdownHelper";
import { initI18n } from "@server/utils/i18n";
import routes from "../routes";
import api from "../routes/api";
import auth from "../routes/auth";
import mcp from "../routes/mcp";
import oauth from "../routes/oauth";
import { createOriginDiscoveryRouter } from "../routes/discovery";

export default function init(app: Koa = new Koa(), server?: Server) {
  void initI18n();

  if (env.isProduction) {
    // Trust the X-Forwarded-* headers set by an upstream proxy, eg
    // X-Forwarded-For. Defaults to true, but can be disabled with
    // PROXY_HEADERS_TRUSTED when the app is reachable directly.
    if (env.PROXY_HEADERS_TRUSTED) {
      app.proxy = true;
      if (env.PROXY_IP_HEADER) {
        app.proxyIpHeader = env.PROXY_IP_HEADER;
      }
    } else if (env.URL.startsWith("https://") && !(server instanceof Server)) {
      // TLS is terminated upstream, but without X-Forwarded-Proto the app
      // cannot tell, so the CSRF token falls back to a cookie that a sibling
      // subdomain is able to write.
      Logger.warn(
        "PROXY_HEADERS_TRUSTED is disabled while URL is https and the app is not terminating TLS itself, which weakens CSRF protection. Enable it when running behind a proxy that terminates TLS."
      );
    }

    // Force redirect to HTTPS protocol unless explicitly disabled
    if (env.FORCE_HTTPS) {
      app.use(
        enforceHttps({
          resolver: (ctx) => {
            if (httpsResolver(ctx)) {
              return true;
            }
            // Only honor X-Forwarded-Proto when proxy headers are trusted
            return env.PROXY_HEADERS_TRUSTED
              ? xForwardedProtoResolver(ctx)
              : false;
          },
        })
      );
    } else {
      Logger.warn("Enforced https was disabled with FORCE_HTTPS env variable");
    }
  }

  app.use(userAgent());

  app.use(compress());

  // Monitor server connections
  if (server) {
    setInterval(() => {
      server.getConnections((err, count) => {
        if (err) {
          return;
        }
        Metrics.gaugePerInstance("connections.count", count);
      });
    }, 5 * Second.ms).unref();
  }

  ShutdownHelper.add("connections", ShutdownOrder.normal, async () => {
    Metrics.gaugePerInstance("connections.count", 0);
  });

  const basePath = env.basePath;
  const routedApp = new Koa();

  // Koa routes are defined relative to their mounted application. Normalize
  // root-relative redirects once at the web boundary.
  if (basePath) {
    app.use(subpathRedirect(basePath));
  }

  app.use(createOriginDiscoveryRouter(basePath).routes());
  routedApp.use(mount("/api", api));
  routedApp.use(mount("/mcp", mcp));

  // Generate and attach a CSRF token to the session on non-API requests
  routedApp.use(attachCSRFToken());

  // Apply CSP middleware after API as these responses are rendered in the browser
  routedApp.use(csp());

  // Allow DNS prefetching for performance, we do not care about leaking requests
  // to our own CDN's
  routedApp.use(
    helmet.dnsPrefetchControl({
      allow: true,
    })
  );
  routedApp.use(
    helmet.referrerPolicy({
      policy: "no-referrer",
    })
  );

  routedApp.use(mount("/auth", auth));
  routedApp.use(mount("/oauth", oauth));
  routedApp.use(mount(routes));
  app.use(mount(basePath || "/", routedApp));

  return app;
}
