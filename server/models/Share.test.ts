import { randomUUID } from "node:crypto";
import env from "@server/env";
import { buildShare, buildTeam } from "@server/test/factories";

const originalUrl = env.URL;

afterEach(() => {
  env.URL = originalUrl;
});

describe("Share", () => {
  describe("canonicalUrl", () => {
    it("preserves the application subpath for custom domains", async () => {
      env.URL = "https://app.example.com:3000/outline";
      const domain = `share-${randomUUID()}.example.com`;
      const team = await buildTeam();
      const share = await buildShare({
        teamId: team.id,
        domain,
      });

      expect(share.canonicalUrl).toBe(`https://${domain}:3000/outline`);
    });

    it("leaves root deployments unchanged for custom domains", async () => {
      env.URL = "https://app.example.com";
      const domain = `share-${randomUUID()}.example.com`;
      const team = await buildTeam();
      const share = await buildShare({
        teamId: team.id,
        domain,
      });

      expect(share.canonicalUrl).toBe(`https://${domain}`);
    });

    it("uses the team URL for regular shares", async () => {
      env.URL = "https://app.example.com/outline";
      const team = await buildTeam();
      const share = await buildShare({
        teamId: team.id,
        urlId: "public-share",
      });
      share.team = team;

      expect(share.canonicalUrl).toBe(
        "https://app.example.com/outline/s/public-share"
      );
    });
  });
});
