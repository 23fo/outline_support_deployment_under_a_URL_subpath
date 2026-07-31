import Koa from "koa";
import { CSRF } from "@shared/constants";
import env from "@server/env";
import TestServer from "@server/test/TestServer";
import {
  bundleToken,
  clearCSRFCookie,
  generateRawToken,
} from "@server/utils/csrf";
import { attachCSRFToken, verifyCSRFToken } from "./csrf";

async function getSetCookie(cookie?: string) {
  const app = new Koa();
  app.use(attachCSRFToken());
  app.use((ctx) => {
    ctx.body = "ok";
  });

  const server = new TestServer(app);
  try {
    const res = await server.get("/", {
      headers: cookie ? { Cookie: cookie } : {},
    });
    return res.headers.get("set-cookie") ?? "";
  } finally {
    server.close();
  }
}

describe("attachCSRFToken", () => {
  it("should set a token when no cookie is present", async () => {
    const setCookie = await getSetCookie();
    expect(setCookie).toContain(`${CSRF.cookieName}=`);
  });

  it("should keep a valid existing token", async () => {
    const token = bundleToken(generateRawToken(16), env.SECRET_KEY);
    const setCookie = await getSetCookie(`${CSRF.cookieName}=${token}`);
    expect(setCookie).toEqual("");
  });

  it("should replace a malformed existing token", async () => {
    const token = `${generateRawToken(16).toString("hex")}.${"é".repeat(64)}`;
    const setCookie = await getSetCookie(`${CSRF.cookieName}=${token}`);
    expect(setCookie).toContain(`${CSRF.cookieName}=`);
    expect(setCookie).not.toContain(token);
  });

  it("should replace an invalid existing token", async () => {
    const token = bundleToken(generateRawToken(16), "wrong-secret");
    const setCookie = await getSetCookie(`${CSRF.cookieName}=${token}`);
    expect(setCookie).toContain(`${CSRF.cookieName}=`);
    expect(setCookie).not.toContain(token);
  });
});

describe("clearCSRFCookie", () => {
  it("should expire the cookie so a fresh token is minted next request", async () => {
    const app = new Koa();
    app.use((ctx) => {
      clearCSRFCookie(ctx);
      ctx.body = "ok";
    });

    const server = new TestServer(app);
    try {
      const res = await server.get("/");
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain(`${CSRF.cookieName}=;`);
      expect(setCookie).toContain("expires=Thu, 01 Jan 1970");
    } finally {
      server.close();
    }
  });
});

describe("CSRF cookie selection", () => {
  const originalUrl = env.URL;

  afterEach(() => {
    env.URL = originalUrl;
  });

  function createServer() {
    const app = new Koa();
    app.proxy = true;
    app.use(attachCSRFToken());
    app.use(verifyCSRFToken());
    app.use((ctx) => {
      ctx.status = 204;
    });
    return new TestServer(app);
  }

  it("uses a secure regular cookie scoped to the base path and accepts it", async () => {
    env.URL = "https://example.com/apps/knowledge";
    const server = createServer();

    try {
      const response = await server.get("/", {
        headers: { "X-Forwarded-Proto": "https" },
      });
      const cookie = response.headers.get("set-cookie") ?? "";
      expect(cookie).toContain(`${CSRF.cookieName}=`);
      expect(cookie).not.toContain(`${CSRF.secureCookieName}=`);
      expect(cookie).toMatch(/path=\/apps\/knowledge/i);
      expect(cookie).toMatch(/secure/i);

      const pair = cookie.split(";")[0];
      const mutation = await server.post("/mutate", {
        headers: {
          "X-Forwarded-Proto": "https",
          Cookie: `accessToken=test; ${pair}`,
          [CSRF.headerName]: pair.slice(CSRF.cookieName.length + 1),
        },
      });
      expect(mutation.status).toBe(204);
    } finally {
      server.close();
    }
  });

  it("retains the host-bound cookie for secure root deployments", async () => {
    env.URL = "https://example.com";
    const server = createServer();

    try {
      const response = await server.get("/", {
        headers: { "X-Forwarded-Proto": "https" },
      });
      const cookie = response.headers.get("set-cookie") ?? "";
      expect(cookie).toContain(`${CSRF.secureCookieName}=`);
      expect(cookie).toMatch(/path=\//i);
    } finally {
      server.close();
    }
  });

  it("expires the cookie at the base path", async () => {
    env.URL = "https://example.com/apps/knowledge";
    const app = new Koa();
    app.use((ctx) => {
      clearCSRFCookie(ctx);
      ctx.body = "ok";
    });

    const server = new TestServer(app);
    try {
      const response = await server.get("/");
      expect(response.headers.get("set-cookie") ?? "").toMatch(
        /path=\/apps\/knowledge/i
      );
    } finally {
      server.close();
    }
  });
});
