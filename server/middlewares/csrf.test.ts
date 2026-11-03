import Koa from "koa";
import { CSRF } from "@shared/constants";
import sharedEnv from "@shared/env";
import env from "@server/env";
import TestServer from "@server/test/TestServer";
import { attachCSRFToken, verifyCSRFToken } from "./csrf";

const originalUrl = env.URL;
let server: TestServer | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
  env.URL = sharedEnv.URL = originalUrl;
});

function createServer(): TestServer {
  const app = new Koa();
  app.proxy = true;
  app.use(attachCSRFToken());
  app.use(verifyCSRFToken());
  app.use((ctx) => {
    ctx.status = 204;
  });
  return new TestServer(app);
}

function getCookie(
  response: Awaited<ReturnType<TestServer["get"]>>,
  name: string
) {
  const cookies = response.headers.raw()["set-cookie"];
  const cookie = cookies?.find((value) => value.startsWith(`${name}=`));
  if (!cookie) {
    throw new Error(`Expected ${name} cookie`);
  }

  const pair = cookie.split(";")[0];
  return {
    cookie,
    pair,
    value: pair.slice(name.length + 1),
  };
}

describe("CSRF middleware", () => {
  it("uses a secure subpath-scoped regular cookie and accepts it", async () => {
    env.URL = sharedEnv.URL = "https://example.com/apps/knowledge";
    server = createServer();

    const response = await server.get("/", {
      headers: { "X-Forwarded-Proto": "https" },
    });
    const csrf = getCookie(response, CSRF.cookieName);

    expect(csrf.cookie).toMatch(/Path=\/apps\/knowledge/i);
    expect(csrf.cookie).toMatch(/Secure/i);
    expect(response.headers.raw()["set-cookie"]).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${CSRF.secureCookieName}=`),
      ])
    );

    const mutation = await server.post("/mutate", {
      headers: {
        "X-Forwarded-Proto": "https",
        Cookie: `accessToken=test; ${csrf.pair}`,
        [CSRF.headerName]: csrf.value,
      },
    });

    expect(mutation.status).toBe(204);
  });

  it("retains the host-bound cookie for secure root deployments", async () => {
    env.URL = sharedEnv.URL = "https://example.com";
    server = createServer();

    const response = await server.get("/", {
      headers: { "X-Forwarded-Proto": "https" },
    });
    const csrf = getCookie(response, CSRF.secureCookieName);

    expect(csrf.cookie).toMatch(/Path=\//i);
    expect(csrf.cookie).toMatch(/Secure/i);
  });
});
