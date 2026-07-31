import env from "@server/env";

/**
 * Returns the robots.txt content for the installation, allowing crawlers on
 * cloud-hosted installations and disallowing them when self-hosted.
 *
 * @param basePath the application base path to disallow when self-hosted.
 * @returns the robots.txt content.
 */
export const robotsResponse = (basePath = ""): string => {
  if (env.isCloudHosted) {
    return `
User-agent: *
Allow: /
`;
  }

  return `
User-agent: *
Disallow: ${basePath || "/"}
`;
};
