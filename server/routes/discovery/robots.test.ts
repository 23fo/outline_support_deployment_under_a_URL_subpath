import { robotsResponse } from "./robots";

describe("robotsResponse", () => {
  it("leaves rules unprefixed at the domain root", () => {
    const robots = robotsResponse();

    expect(robots).toContain("Allow: /api/shares.sitemap");
    expect(robots).toContain("Disallow: /api/");
  });

  it("prefixes every rule with the application base path", () => {
    const robots = robotsResponse("/apps/knowledge");

    expect(robots).toContain("Allow: /apps/knowledge/api/shares.sitemap");
    expect(robots).toContain("Disallow: /apps/knowledge/api/");
    expect(robots).toContain("User-agent: *");
    expect(robots).not.toMatch(/^(Allow|Disallow): \/api\//m);
  });
});
