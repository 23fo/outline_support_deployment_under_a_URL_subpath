import { withoutBasePath } from "@shared/utils/subpath";
import Desktop from "~/utils/Desktop";

/** The hostname of the default Outline cloud installation. */
export const DefaultHostname = "app.getoutline.com";

/** The origin of the default Outline cloud installation. */
export const DefaultHost = `https://${DefaultHostname}`;

/**
 * Builds the URL used to continue the current flow on another workspace.
 *
 * @param teamUrl the destination workspace URL, including its application subpath.
 * @param currentUrl the current browser URL.
 * @returns the destination URL with the current application-relative path.
 */
export function teamSwitcherUrl(teamUrl: string, currentUrl: string): string {
  const url = new URL(currentUrl);
  return `${teamUrl}${withoutBasePath(url.pathname)}${url.search}${url.hash}`;
}

/**
 * Redirect to a subdomain, adding it to the custom hosts list on desktop first.
 *
 * @param subdomain The subdomain to navigate to
 */
export async function navigateToSubdomain(subdomain: string) {
  const normalizedSubdomain = subdomain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "");
  const host = validateAndEncodeSubdomain(normalizedSubdomain);
  await Desktop.bridge?.addCustomHost(host);
  window.location.href = host;
}

/**
 * Normalize a user-entered host into a URL, defaulting to https and preserving
 * an optional application subpath.
 *
 * @param input The host entered by the user.
 * @returns the normalized URL (e.g. "https://example.com/outline").
 * @throws if the input cannot be parsed into a valid URL.
 */
export function normalizeHost(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);

  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

/**
 * Check that the given host is a reachable Outline installation by requesting
 * its auth configuration. The request is performed in the desktop main process
 * to bypass renderer CORS restrictions.
 *
 * @param input The host entered by the user.
 * @returns the normalized URL of the validated installation.
 * @throws if the host is unreachable or not an Outline installation.
 */
export async function validateHost(input: string): Promise<string> {
  const host = normalizeHost(input);

  if (!Desktop.bridge?.loadAuthConfig) {
    throw new Error("Host validation is unavailable");
  }

  const config = await Desktop.bridge.loadAuthConfig(host);
  if (!Array.isArray(config?.providers)) {
    throw new Error("Host is not an Outline installation");
  }

  return host;
}

/**
 * Set the given host in desktop config and navigate to it.
 *
 * @param host The normalized URL to switch to.
 */
export async function navigateToHost(host: string) {
  await Desktop.bridge?.addCustomHost(host);
  window.location.href = host;
}

function validateAndEncodeSubdomain(subdomain: string): string {
  const encodedSubdomain = encodeURIComponent(subdomain);
  const urlPattern = /^[a-z\d-]{1,63}$/;
  if (!urlPattern.test(encodedSubdomain)) {
    throw new Error("Invalid subdomain");
  }
  return `https://${encodedSubdomain}.getoutline.com`;
}
