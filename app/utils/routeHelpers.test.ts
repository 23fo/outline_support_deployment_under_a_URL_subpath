import sharedEnv from "@shared/env";
import env from "~/env";
import { sharedModelPath, desktopify, urlify } from "./routeHelpers";

const originalAppBasePath = env.BASE_PATH;
const originalSharedBasePath = sharedEnv.BASE_PATH;

afterEach(() => {
  env.BASE_PATH = originalAppBasePath;
  sharedEnv.BASE_PATH = originalSharedBasePath;
});

describe("#sharedDocumentPath", () => {
  it("should return share path for a document", () => {
    const shareId = "1c922644-40d8-41fe-98f9-df2b67239d45";
    const docPath = "/doc/test-DjDlkBi77t";
    expect(sharedModelPath(shareId)).toBe(
      "/s/1c922644-40d8-41fe-98f9-df2b67239d45"
    );
    expect(sharedModelPath(shareId, docPath)).toBe(
      "/s/1c922644-40d8-41fe-98f9-df2b67239d45/doc/test-DjDlkBi77t"
    );
  });
});

describe("#urlify", () => {
  beforeEach(() => {
    env.BASE_PATH = "/outline";
    sharedEnv.BASE_PATH = "/outline";
  });

  it("includes the configured subpath in a full host URL", () => {
    expect(
      urlify("/doc/test-DjDlkBi77t", "https://docs.example.com/outline")
    ).toBe("https://docs.example.com/outline/doc/test-DjDlkBi77t");
  });

  it("preserves the subpath in share canonical URLs", () => {
    expect(urlify("/s/share-id", "https://docs.example.com")).toBe(
      "https://docs.example.com/outline/s/share-id"
    );
  });

  it("does not confuse an application route with the base path", () => {
    env.BASE_PATH = "/settings";
    sharedEnv.BASE_PATH = "/settings";

    expect(
      urlify("/settings/authentication", "https://docs.example.com/settings")
    ).toBe("https://docs.example.com/settings/settings/authentication");
  });
});

describe("#desktopify", () => {
  it("should replace https protocol with outline://", () => {
    expect(
      desktopify("/doc/test-DjDlkBi77t", "https://app.getoutline.com")
    ).toBe("outline://app.getoutline.com/doc/test-DjDlkBi77t");
  });

  it("should replace http protocol with outline://", () => {
    expect(desktopify("/doc/test-DjDlkBi77t", "http://localhost:3000")).toBe(
      "outline://localhost:3000/doc/test-DjDlkBi77t"
    );
  });

  it("preserves a configured subpath exactly once", () => {
    env.BASE_PATH = "/outline";
    sharedEnv.BASE_PATH = "/outline";

    expect(
      desktopify("/doc/test-DjDlkBi77t", "https://docs.example.com/outline")
    ).toBe("outline://docs.example.com/outline/doc/test-DjDlkBi77t");
  });

  it("preserves the subpath in desktop authentication redirects", () => {
    env.BASE_PATH = "/outline";
    sharedEnv.BASE_PATH = "/outline";

    expect(
      desktopify(
        "/auth/redirect?token=test",
        "https://docs.example.com/outline"
      )
    ).toBe("outline://docs.example.com/outline/auth/redirect?token=test");
  });
});
