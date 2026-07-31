import sharedEnv from "../env";
import parseCollectionSlug from "./parseCollectionSlug";

const originalBasePath = sharedEnv.BASE_PATH;
const originalUrl = sharedEnv.URL;

beforeEach(() => {
  sharedEnv.BASE_PATH = "";
  sharedEnv.URL = "https://app.outline.dev";
});

afterAll(() => {
  sharedEnv.BASE_PATH = originalBasePath;
  sharedEnv.URL = originalUrl;
});

describe("#parseCollectionSlug", () => {
  it("should work with fully qualified url", () => {
    expect(
      parseCollectionSlug("http://example.com/collection/test-ANzZwgv2RG")
    ).toEqual("test-ANzZwgv2RG");
  });

  it("should work with paths after document slug", () => {
    expect(
      parseCollectionSlug(
        "http://mywiki.getoutline.com/collection/test-ANzZwgv2RG/recent"
      )
    ).toEqual("test-ANzZwgv2RG");
  });

  it("should work with hash", () => {
    expect(
      parseCollectionSlug(
        "http://mywiki.getoutline.com/collection/test-ANzZwgv2RG#state"
      )
    ).toEqual("test-ANzZwgv2RG");
  });

  it("should work with subdomain qualified url", () => {
    expect(
      parseCollectionSlug(
        "http://mywiki.getoutline.com/collection/test-ANzZwgv2RG"
      )
    ).toEqual("test-ANzZwgv2RG");
  });

  it("should work with path", () => {
    expect(parseCollectionSlug("/collection/test-ANzZwgv2RG")).toEqual(
      "test-ANzZwgv2RG"
    );
  });

  it("should work with path and hash", () => {
    expect(parseCollectionSlug("/collection/test-ANzZwgv2RG#somehash")).toEqual(
      "test-ANzZwgv2RG"
    );
  });

  it("removes a base path containing a collection route segment", () => {
    sharedEnv.BASE_PATH = "/collection/outline";
    sharedEnv.URL = "https://app.outline.dev/collection/outline";

    expect(
      parseCollectionSlug(
        "https://app.outline.dev/collection/outline/collection/title-collectionId"
      )
    ).toEqual("title-collectionId");
    expect(parseCollectionSlug("/collection/outline")).toEqual("outline");
  });
});
