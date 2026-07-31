import env from "../env";
import {
  normalizeResourceUrlForStorage,
  resolveResourceUrl,
  sanitizeResourceUrl,
} from "./resourceUrl";

const originalBasePath = env.BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) {
    delete env.BASE_PATH;
  } else {
    env.BASE_PATH = originalBasePath;
  }
});

describe("resolveResourceUrl", () => {
  it("prefixes root-relative resources with the configured base path", () => {
    env.BASE_PATH = "/outline";

    expect(resolveResourceUrl("/api/attachments.redirect?id=123")).toBe(
      "/outline/api/attachments.redirect?id=123"
    );
  });

  it("does not confuse a resource route with the base path", () => {
    env.BASE_PATH = "/api";

    expect(resolveResourceUrl("/api/attachments.redirect?id=123")).toBe(
      "/api/api/attachments.redirect?id=123"
    );
  });

  it("leaves non-root and non-application resources unchanged", () => {
    env.BASE_PATH = "/outline";

    expect(resolveResourceUrl("relative/file.pdf")).toBe("relative/file.pdf");
    expect(resolveResourceUrl("https://cdn.example.com/file.pdf")).toBe(
      "https://cdn.example.com/file.pdf"
    );
    expect(resolveResourceUrl("//cdn.example.com/file.pdf")).toBe(
      "//cdn.example.com/file.pdf"
    );
    expect(resolveResourceUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc"
    );
    expect(resolveResourceUrl("blob:https://example.com/id")).toBe(
      "blob:https://example.com/id"
    );
  });

  it("leaves root-relative resources unchanged for root deployments", () => {
    env.BASE_PATH = "";

    expect(resolveResourceUrl("/api/attachments.redirect?id=123")).toBe(
      "/api/attachments.redirect?id=123"
    );
  });

  it("returns undefined for empty resources", () => {
    expect(resolveResourceUrl(undefined)).toBeUndefined();
    expect(resolveResourceUrl(null)).toBeUndefined();
    expect(resolveResourceUrl("")).toBeUndefined();
  });
});

describe("sanitizeResourceUrl", () => {
  it("resolves root-relative resources before sanitizing", () => {
    env.BASE_PATH = "/outline";

    expect(sanitizeResourceUrl("/api/attachments.redirect?id=123")).toBe(
      "/outline/api/attachments.redirect?id=123"
    );
  });

  it("retains the existing sanitizer behavior", () => {
    expect(sanitizeResourceUrl("javascript:alert(1)")).toBe(
      "https://javascript:alert(1)"
    );
  });
});

describe("normalizeResourceUrlForStorage", () => {
  it("removes only the configured base path from root-relative resources", () => {
    env.BASE_PATH = "/apps/knowledge";

    expect(
      normalizeResourceUrlForStorage(
        "/apps/knowledge/api/attachments.redirect?id=123"
      )
    ).toBe("/api/attachments.redirect?id=123");
    expect(normalizeResourceUrlForStorage("/apps/knowledge-base/file")).toBe(
      "/apps/knowledge-base/file"
    );
  });

  it("leaves external and already application-relative resources unchanged", () => {
    env.BASE_PATH = "/apps/knowledge";

    expect(normalizeResourceUrlForStorage("/api/files.get?id=123")).toBe(
      "/api/files.get?id=123"
    );
    expect(
      normalizeResourceUrlForStorage("https://cdn.example.com/file.pdf")
    ).toBe("https://cdn.example.com/file.pdf");
  });
});
