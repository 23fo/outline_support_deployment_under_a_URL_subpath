import env from "../env";
import {
  getBasePath,
  getCookiePath,
  isPathInBasePath,
  normalizeBasePath,
  resolveAppUrl,
  withBasePath,
  withoutBasePath,
} from "./subpath";
import { sanitizeImageSrc } from "./urls";

const originalBasePath = env.BASE_PATH;
const originalUrl = env.URL;

afterAll(() => {
  env.BASE_PATH = originalBasePath;
  env.URL = originalUrl;
});

describe("subpath", () => {
  beforeEach(() => {
    env.BASE_PATH = "/outline";
    env.URL = "https://example.com/outline";
  });

  it("returns the configured base path", () => {
    expect(getBasePath()).toBe("/outline");
  });

  it("prefixes application-relative paths", () => {
    expect(withBasePath("/api/auth.info")).toBe("/outline/api/auth.info");
  });

  it("does not confuse an application route with the base path", () => {
    expect(withBasePath("/api", "/api")).toBe("/api/api");
    expect(withBasePath("/auth/login", "/auth")).toBe("/auth/auth/login");
  });

  it("leaves external URLs unchanged", () => {
    expect(withBasePath("https://example.net/image.png")).toBe(
      "https://example.net/image.png"
    );
    expect(withBasePath("//example.net/image.png")).toBe(
      "//example.net/image.png"
    );
  });

  it("leaves ordinary relative paths unchanged", () => {
    expect(withBasePath("images/icon.png")).toBe("images/icon.png");
  });

  it("normalizes arbitrary multi-segment base paths", () => {
    expect(normalizeBasePath("//apps//knowledge///")).toBe("/apps/knowledge");
    expect(withBasePath("/api/auth.info", "/apps/knowledge/")).toBe(
      "/apps/knowledge/api/auth.info"
    );
  });

  it("returns an explicit cookie path", () => {
    expect(getCookiePath("/apps/knowledge/")).toBe("/apps/knowledge");
    expect(getCookiePath("")).toBe("/");
  });

  it("removes the base path while preserving suffixes", () => {
    expect(withoutBasePath("/outline")).toBe("/");
    expect(withoutBasePath("/outline/home?draft=true#top")).toBe(
      "/home?draft=true#top"
    );
    expect(withoutBasePath("/other/home")).toBe("/other/home");
  });

  it("checks base path boundaries", () => {
    expect(isPathInBasePath("/outline", "/outline")).toBe(true);
    expect(isPathInBasePath("/outline/doc/test", "/outline")).toBe(true);
    expect(isPathInBasePath("/outline-other/doc/test", "/outline")).toBe(false);
  });

  it("resolves application paths beneath an absolute application URL", () => {
    expect(
      resolveAppUrl("/doc/test", "https://example.com/apps/knowledge")
    ).toBe("https://example.com/apps/knowledge/doc/test");
    expect(
      resolveAppUrl("https://cdn.example.com/file", "https://example.com/api")
    ).toBe("https://cdn.example.com/file");
    expect(resolveAppUrl("/api", "https://example.com/api")).toBe(
      "https://example.com/api/api"
    );
  });

  it("prefixes root-relative image sources at render time", () => {
    expect(sanitizeImageSrc("/api/attachments.redirect?id=1")).toBe(
      "/outline/api/attachments.redirect?id=1"
    );
    expect(sanitizeImageSrc("https://example.net/image.png")).toBe(
      "https://example.net/image.png"
    );
  });

  it("does not add a prefix for root deployments", () => {
    env.BASE_PATH = "";
    env.URL = "https://example.com";

    expect(withBasePath("/api/auth.info")).toBe("/api/auth.info");
  });
});
