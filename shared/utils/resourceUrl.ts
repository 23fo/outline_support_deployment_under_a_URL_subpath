import { withBasePath, withoutBasePath } from "./subpath";
import { sanitizeUrl } from "./urls";

/**
 * resolves an application-served resource URL for use by the browser.
 * Root-relative URLs are prefixed with the configured application base path,
 * while relative, absolute, protocol-relative, data, and blob URLs remain
 * unchanged.
 *
 * Persisted document URLs should remain root-relative; call this only at a
 * rendering, navigation, or request boundary.
 *
 * @param url the resource URL to resolve.
 * @returns the resolved URL, or undefined when no URL is provided.
 */
export function resolveResourceUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) {
    return undefined;
  }

  return url.startsWith("/") ? withBasePath(url) : url;
}

/**
 * Normalizes an application-served resource URL before it is persisted.
 * Root-relative URLs have the configured application base path removed, while
 * other URL forms remain unchanged.
 *
 * @param url the resource URL to normalize.
 * @returns the application-relative URL, or undefined when no URL is provided.
 */
export function normalizeResourceUrlForStorage(
  url: string | null | undefined
): string | undefined {
  if (!url) {
    return undefined;
  }

  return url.startsWith("/") ? withoutBasePath(url) : url;
}

/**
 * Resolves an application-served resource URL and applies the standard URL
 * sanitizer before it is assigned to a browser DOM attribute.
 *
 * @param url the resource URL to resolve and sanitize.
 * @returns the sanitized URL, or undefined when no URL is provided.
 */
export function sanitizeResourceUrl(
  url: string | null | undefined
): string | undefined {
  const resolved = resolveResourceUrl(url);
  return resolved ? sanitizeUrl(resolved) : undefined;
}
