import { collaborationUrl } from "./collaborationUrl";

describe("collaborationUrl", () => {
  it("uses the root path for a dedicated collaboration origin", () => {
    expect(collaborationUrl("wss://collab.example.com")).toBe(
      "wss://collab.example.com/collaboration"
    );
  });

  it("preserves a configured collaboration subpath", () => {
    expect(collaborationUrl("wss://collab.example.com/ws")).toBe(
      "wss://collab.example.com/ws/collaboration"
    );
  });

  it("normalizes a trailing slash", () => {
    expect(collaborationUrl("wss://collab.example.com/ws/")).toBe(
      "wss://collab.example.com/ws/collaboration"
    );
  });
});
