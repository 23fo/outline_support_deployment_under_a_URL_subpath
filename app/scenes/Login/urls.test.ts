import sharedEnv from "@shared/env";
import { normalizeHost, teamSwitcherUrl } from "./urls";

const originalBasePath = sharedEnv.BASE_PATH;

afterEach(() => {
  sharedEnv.BASE_PATH = originalBasePath;
});

describe("normalizeHost", () => {
  it("defaults to https when no protocol is given", () => {
    expect(normalizeHost("app.getoutline.com")).toBe(
      "https://app.getoutline.com"
    );
  });

  it("preserves an explicit protocol", () => {
    expect(normalizeHost("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("preserves paths and strips trailing slashes", () => {
    expect(normalizeHost("https://docs.example.com/")).toBe(
      "https://docs.example.com"
    );
    expect(normalizeHost("docs.example.com/outline/")).toBe(
      "https://docs.example.com/outline"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHost("  app.getoutline.com  ")).toBe(
      "https://app.getoutline.com"
    );
  });

  it("throws on an unparseable host", () => {
    expect(() => normalizeHost("not a url")).toThrow();
  });
});

describe("teamSwitcherUrl", () => {
  it("preserves the destination subpath exactly once", () => {
    sharedEnv.BASE_PATH = "/outline";

    expect(
      teamSwitcherUrl(
        "https://team.example.com/outline",
        "https://app.example.com/outline/oauth/authorize?client_id=test#scope"
      )
    ).toBe(
      "https://team.example.com/outline/oauth/authorize?client_id=test#scope"
    );
  });

  it("leaves root deployments unchanged", () => {
    sharedEnv.BASE_PATH = "";

    expect(
      teamSwitcherUrl(
        "https://team.example.com",
        "https://app.example.com/oauth/authorize?client_id=test"
      )
    ).toBe("https://team.example.com/oauth/authorize?client_id=test");
  });
});
