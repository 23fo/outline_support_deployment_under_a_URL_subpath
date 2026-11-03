import {
  authorizationServerMetadataPath,
  protectedResourceMetadataPath,
} from "./oauthMetadata";

describe("OAuth metadata paths", () => {
  it("builds root deployment paths", () => {
    expect(authorizationServerMetadataPath("")).toBe(
      "/.well-known/oauth-authorization-server"
    );
    expect(protectedResourceMetadataPath("/mcp")).toBe(
      "/.well-known/oauth-protected-resource/mcp"
    );
  });

  it("inserts well-known before issuer and resource subpaths", () => {
    expect(authorizationServerMetadataPath("/outline")).toBe(
      "/.well-known/oauth-authorization-server/outline"
    );
    expect(protectedResourceMetadataPath("/outline/mcp")).toBe(
      "/.well-known/oauth-protected-resource/outline/mcp"
    );
  });

  it("normalizes leading and trailing slashes", () => {
    expect(authorizationServerMetadataPath("outline/")).toBe(
      "/.well-known/oauth-authorization-server/outline"
    );
  });
});
