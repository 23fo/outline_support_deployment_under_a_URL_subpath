// @vitest-isolate true
import { randomUUID } from "node:crypto";
import { CSRF } from "@shared/constants";
import sharedEnv from "@shared/env";
import env from "@server/env";
import { buildDocument, buildShare, buildUser } from "@server/test/factories";
import { getTestServer } from "@server/test/support";
import { buildOAuthUser, mcpHeaders, mcpRequest } from "@server/test/McpHelper";

const originalUrl = env.URL;
env.URL = sharedEnv.URL = "https://example.com/apps/knowledge";

const server = getTestServer();

beforeEach(() => {
  env.URL = sharedEnv.URL = "https://example.com/apps/knowledge";
});

afterAll(() => {
  env.URL = sharedEnv.URL = originalUrl;
});

describe("web service application base path", () => {
  it("mounts the application once beneath a multi-segment base path", async () => {
    const root = await server.get("/share/example");
    const app = await server.get("/apps/knowledge/share/example", {
      redirect: "manual",
    });

    expect(root.status).toBe(404);
    expect(app.status).toBe(301);
    const location = app.headers.get("location");
    if (!location) {
      throw new Error("Expected redirect location");
    }
    expect(new URL(location, server.address).pathname).toBe(
      "/apps/knowledge/s/example"
    );
  });

  it("scopes session and CSRF cookies to the application base path", async () => {
    const user = await buildUser();
    const authResponse = await server.get(
      `/apps/knowledge/auth/redirect?token=${user.getTransferToken()}`,
      { redirect: "manual" }
    );
    const sessionCookies = authResponse.headers.raw()["set-cookie"];
    const sessionCookie = sessionCookies?.find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/(?:^|;\s*)path=\/apps\/knowledge(?:;|$)/i);

    const appResponse = await server.get("/apps/knowledge/");
    const csrfCookies = appResponse.headers.raw()["set-cookie"];
    const csrfCookie = csrfCookies?.find((cookie) =>
      cookie.startsWith(`${CSRF.cookieName}=`)
    );

    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).toMatch(/(?:^|;\s*)path=\/apps\/knowledge(?:;|$)/i);
  });

  it("expires the session cookie at the application base path", async () => {
    const user = await buildUser();
    const response = await server.post("/apps/knowledge/api/auth.delete", user);
    const sessionCookies = response.headers.raw()["set-cookie"];
    const sessionCookie = sessionCookies?.find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    expect(response.status).toBe(200);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain("accessToken=;");
    expect(sessionCookie).toMatch(/(?:^|;\s*)path=\/apps\/knowledge(?:;|$)/i);
    expect(sessionCookie).toMatch(/(?:^|;\s*)expires=/i);
  });

  it("accepts a subpath-scoped CSRF token with cookie authentication", async () => {
    const user = await buildUser();
    const authResponse = await server.get(
      `/apps/knowledge/auth/redirect?token=${user.getTransferToken()}`,
      { redirect: "manual" }
    );
    const authCookies = authResponse.headers.raw()["set-cookie"];
    const accessToken = authCookies
      ?.find((cookie) => cookie.startsWith("accessToken="))
      ?.split(";")[0];
    const appResponse = await server.get("/apps/knowledge/");
    const appCookies = appResponse.headers.raw()["set-cookie"];
    const csrfToken = appCookies
      ?.find((cookie) => cookie.startsWith(`${CSRF.cookieName}=`))
      ?.split(";")[0];

    if (!accessToken || !csrfToken) {
      throw new Error("Expected authentication and CSRF cookies");
    }

    const response = await server.post("/apps/knowledge/api/auth.delete", {
      headers: {
        Cookie: `${accessToken}; ${csrfToken}`,
        [CSRF.headerName]: csrfToken.slice(CSRF.cookieName.length + 1),
      },
    });

    expect(response.status).toBe(200);
  });

  it("expires the access token when leaving through OIDC logout", async () => {
    const response = await server.get("/apps/knowledge/auth/oidc.logout", {
      redirect: "manual",
    });
    const cookies = response.headers.raw()["set-cookie"];
    const accessToken = cookies?.find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    expect(response.status).toBe(302);
    expect(accessToken).toBeDefined();
    expect(accessToken).toContain("accessToken=;");
    expect(accessToken).toMatch(/(?:^|;\s*)path=\/apps\/knowledge(?:;|$)/i);
  });

  it("resolves URLs in public share Markdown", async () => {
    const imageId = randomUUID();
    const document = await buildDocument({
      text: [
        "[Document](/doc/internal-123)",
        "",
        `![Image](/api/attachments.redirect?id=${imageId})`,
      ].join("\n"),
    });
    const share = await buildShare({
      documentId: document.id,
      teamId: document.teamId,
      includeChildDocuments: false,
    });

    const response = await server.get(`/apps/knowledge/s/${share.id}.md`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain(
      `https://example.com/apps/knowledge/s/${share.id}/doc/internal-123`
    );
    expect(body).toContain(
      `https://example.com/apps/knowledge/api/attachments.redirect?id=${imageId}`
    );
  });

  it("preserves the base path in custom-domain sitemaps", async () => {
    const document = await buildDocument();
    const domain = `share-${randomUUID()}.example.com`;
    const share = await buildShare({
      documentId: document.id,
      teamId: document.teamId,
      domain,
      allowIndexing: true,
      includeChildDocuments: true,
    });

    const response = await server.get(
      `/apps/knowledge/api/shares.sitemap?id=${share.id}`,
      { headers: { Host: domain } }
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain(`<loc>https://${domain}/apps/knowledge</loc>`);
  });

  it("serves OAuth discovery from the origin root", async () => {
    const metadata = await server.get(
      "/.well-known/oauth-authorization-server/apps/knowledge"
    );

    expect(metadata.status).toBe(200);
    expect((await metadata.json()).issuer).toBe(
      "https://example.com/apps/knowledge"
    );
  });

  it("limits self-hosted crawler exclusion to the application base path", async () => {
    const robots = await server.get("/robots.txt");

    expect(robots.status).toBe(200);
    expect(await robots.text()).toContain("Disallow: /apps/knowledge");
  });

  it("normalizes the base path before OAuth scope checks", async () => {
    const { accessToken } = await buildOAuthUser();
    const { body } = mcpRequest("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    });

    const response = await server.post("/apps/knowledge/mcp/", {
      headers: mcpHeaders(accessToken),
      body,
    });

    expect(response.status).toBe(200);
  });

  it("includes the base path in API pagination links", async () => {
    const user = await buildUser();
    const response = await server.post("/apps/knowledge/api/users.list", user, {
      body: { limit: 1 },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagination.nextPath).toContain(
      "/apps/knowledge/api/users.list"
    );
  });
});
