import Koa from "koa";
import env from "@server/env";
import createCSPMiddleware from "./csp";

const originalUrl = env.URL;

afterEach(() => {
  env.URL = originalUrl;
});

async function getContentSecurityPolicy(url: string): Promise<string | null> {
  env.URL = url;

  const app = new Koa();
  app.proxy = true;
  app.use(createCSPMiddleware());
  app.use((ctx) => {
    ctx.body = "ok";
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not bind to a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}`, {
      headers: {
        "x-forwarded-host": "docs.example.com",
      },
    });
    const policy = response.headers.get("content-security-policy");
    await response.text();

    return policy;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("CSP middleware", () => {
  it("allows service worker assets under the configured subpath", async () => {
    const policy = await getContentSecurityPolicy(
      "https://app.example.com/outline"
    );

    expect(policy).toContain("docs.example.com/outline/static/");
  });

  it("keeps the root deployment service worker path unchanged", async () => {
    const policy = await getContentSecurityPolicy("https://app.example.com");

    expect(policy).toContain("docs.example.com/static/");
    expect(policy).not.toContain("docs.example.com//static/");
  });
});
