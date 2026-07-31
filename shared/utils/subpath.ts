import env from "../env";

/**
 * Returns the configured application base path without a trailing slash.
 * This works in both browser and server bundles.
 *
 * @returns the configured application base path.
 */
export function getBasePath(): string {
  const path: string =
    env.BASE_PATH ?? (env.URL ? new URL(env.URL).pathname : "");
  return path.replace(/\/+$/, "");
}

/**
 * Returns the path used to scope application cookies. Unlike the application
 * base path, root deployments must use an explicit slash.
 *
 * @param basePath the application base path.
 * @returns the cookie path.
 */
export function getCookiePath(basePath: string = getBasePath()): string {
  return basePath || "/";
}

/**
 * Prefixes an application-relative path with the configured base path.
 * Absolute URLs, protocol-relative URLs, and ordinary relative paths are
 * returned unchanged.
 *
 * @param path the path to prefix.
 * @param basePath the application base path.
 * @returns the path with the application base path applied.
 */
export function withBasePath(
  path: string,
  basePath: string = getBasePath()
): string {
  return isRootRelative(path) ? `${basePath}${path}` : path;
}

/**
 * Removes the configured base path from an application-relative path while
 * preserving its query string and fragment.
 *
 * @param path the path to normalize.
 * @param basePath the application base path.
 * @returns the application-relative path.
 */
export function withoutBasePath(
  path: string,
  basePath: string = getBasePath()
): string {
  if (!basePath || !isPathInBasePath(path, basePath)) {
    return path;
  }

  const suffix = path.slice(basePath.length);
  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

/**
 * Returns whether a path is contained by an application base path.
 *
 * @param path the path to inspect.
 * @param basePath the application base path.
 * @returns whether the path is inside the application base path.
 */
export function isPathInBasePath(
  path: string,
  basePath: string = getBasePath()
): boolean {
  return (
    !basePath ||
    path === basePath ||
    path.startsWith(`${basePath}/`) ||
    path.startsWith(`${basePath}?`) ||
    path.startsWith(`${basePath}#`)
  );
}

/**
 * Returns the application-relative pathname of a URL. Root-relative URLs are
 * already application-relative, absolute URLs have the base path removed.
 *
 * @param url the root-relative or absolute URL to parse.
 * @returns the application-relative pathname, or undefined if the URL is invalid.
 */
export function getAppPathname(url: string): string | undefined {
  try {
    return isRootRelative(url)
      ? new URL(url, env.URL).pathname
      : withoutBasePath(new URL(url).pathname);
  } catch (_err) {
    return undefined;
  }
}

/**
 * Resolves an application-relative path against an absolute application URL.
 * Unlike the URL constructor, a single leading slash remains beneath the
 * pathname contained in the base URL.
 *
 * @param path the application-relative path or absolute URL.
 * @param baseUrl the absolute application URL.
 * @returns the resolved absolute URL.
 */
export function resolveAppUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const reference = isRootRelative(path) ? path.slice(1) : path;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(reference, normalizedBaseUrl).href;
}

function isRootRelative(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}
