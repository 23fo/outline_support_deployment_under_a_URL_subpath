import sharedEnv from "../env";
import parseDocumentSlug from "./parseDocumentSlug";

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

describe("#parseDocumentSlug", () => {
  it("should work with fully qualified url", () => {
    expect(
      parseDocumentSlug("http://example.com/doc/my-doc-y4j4tR4UuV")
    ).toEqual("my-doc-y4j4tR4UuV");
  });

  it("should work with paths after document slug", () => {
    expect(
      parseDocumentSlug(
        "http://mywiki.getoutline.com/doc/my-doc-y4j4tR4UuV/edit"
      )
    ).toEqual("my-doc-y4j4tR4UuV");
  });

  it("should work with hash", () => {
    expect(
      parseDocumentSlug(
        "http://mywiki.getoutline.com/doc/my-doc-y4j4tR4UuV#state"
      )
    ).toEqual("my-doc-y4j4tR4UuV");
  });

  it("should work with subdomain qualified url", () => {
    expect(
      parseDocumentSlug("http://mywiki.getoutline.com/doc/my-doc-y4j4tR4UuV")
    ).toEqual("my-doc-y4j4tR4UuV");
  });

  it("should work with path", () => {
    expect(parseDocumentSlug("/doc/my-doc-y4j4tR4UuV")).toEqual(
      "my-doc-y4j4tR4UuV"
    );
  });

  it("should work with path and hash", () => {
    expect(parseDocumentSlug("/doc/my-doc-y4j4tR4UuV#my-heading-hash")).toEqual(
      "my-doc-y4j4tR4UuV"
    );
  });

  it("removes a base path containing a document route segment", () => {
    sharedEnv.BASE_PATH = "/doc/outline";
    sharedEnv.URL = "https://app.outline.dev/doc/outline";

    expect(
      parseDocumentSlug(
        "https://app.outline.dev/doc/outline/doc/title-documentId"
      )
    ).toEqual("title-documentId");
    expect(parseDocumentSlug("/doc/outline")).toEqual("outline");
  });
});
