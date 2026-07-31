import Koa from "koa";
import LocalStorage from "@server/storage/files/LocalStorage";
import TestServer from "@server/test/TestServer";
import subpathRedirect from "./subpathRedirect";

let server: TestServer | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function getLocation(target: string) {
  const app = new Koa();
  app.use(subpathRedirect("/apps/knowledge"));
  app.use((ctx) => {
    ctx.redirect(target);
  });
  server = new TestServer(app);

  const response = await server.get("/", { redirect: "manual" });
  // The HTTP client resolves the header against the request URL.
  return new URL(response.headers.get("location") ?? "");
}

describe("subpathRedirect", () => {
  it("prefixes root-relative redirects", async () => {
    const location = await getLocation("/doc/test");

    expect(location.pathname).toBe("/apps/knowledge/doc/test");
  });

  it("applies the prefix once to local storage URLs", async () => {
    const url = new LocalStorage().getUrlForKey("public/image.png");
    const location = await getLocation(url);

    expect(location.pathname).toBe("/apps/knowledge/api/files.get");
    expect(location.search).toBe("?key=public/image.png");
  });

  it("leaves absolute and protocol-relative redirects unchanged", async () => {
    const absolute = await getLocation("https://example.net/file");
    expect(absolute.href).toBe("https://example.net/file");

    const protocolRelative = await getLocation("//example.net/file");
    expect(protocolRelative.host).toBe("example.net");
    expect(protocolRelative.pathname).toBe("/file");
  });
});
