import { randomUUID } from "node:crypto";
import { addDays, subDays } from "date-fns";
import env from "@server/env";
import { Share } from "@server/models";
import { buildShare, buildTeam } from "@server/test/factories";

describe("Share", () => {
  describe("getPublicSharesForDocumentIds", () => {
    it("should return shares without an expiry or with a future expiry", async () => {
      const noExpiry = await buildShare();
      const future = await buildShare({
        teamId: noExpiry.teamId,
        expiresAt: addDays(new Date(), 1),
      });

      const shares = await Share.getPublicSharesForDocumentIds(
        noExpiry.teamId,
        [noExpiry.documentId!, future.documentId!]
      );

      expect(shares.map((share) => share.id).sort()).toEqual(
        [noExpiry.id, future.id].sort()
      );
    });

    it("should not return expired shares", async () => {
      const share = await buildShare({
        expiresAt: subDays(new Date(), 1),
      });

      const shares = await Share.getPublicSharesForDocumentIds(
        share.teamId,
        share.documentId!
      );

      expect(shares).toEqual([]);
    });
  });
  describe("canonicalUrl", () => {
    const originalUrl = env.URL;

    afterEach(() => {
      env.URL = originalUrl;
    });

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
