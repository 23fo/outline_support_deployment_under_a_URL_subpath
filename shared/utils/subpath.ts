import env from "../env";

/**
 * Returns the configured application base path without a trailing slash.
 * This works in both browser and server bundles.
 *
 * @returns the configured application base path.
 */
export function getBasePath(): string {
  return normalizeBasePath(
    typeof env.BASE_PATH === "string"
      ? env.BASE_PATH
      : typeof env.URL === "string"
        ? new URL(env.URL).pathname
        : ""
  );
}

/**
 * Returns the path used to scope application cookies. Unlike the application
 * base path, root deployments must use an explicit slash.
 *
 * @param basePath the application base path.
 * @returns the cookie path.
 */
export function getCookiePath(basePath: string = getBasePath()): string {
  return normalizeBasePath(basePath) || "/";
}

/**
 * prefixes an application-relative path with the configured base path.
 * absolute URLs, protocol-relative URLs, and ordinary relative paths are
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
  if (!path.startsWith("/") || path.startsWith("//")) {
    return path;
  }
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath) {
    return path;
  }
  return `${normalizedBasePath}${path}`;
}

/**
 * resolves an application-relative path against an absolute application URL.
 * unlike the URL constructor, a single leading slash remains beneath the
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

  const reference =
    path.startsWith("/") && !path.startsWith("//") ? path.slice(1) : path;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(reference, normalizedBaseUrl).href;
}

/**
 * returns whether a path is contained by an application base path.
 *
 * @param path the path to inspect.
 * @param basePath the application base path.
 * @returns whether the path is inside the application base path.
 */
export function isPathInBasePath(
  path: string,
  basePath: string = getBasePath()
): boolean {
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath) {
    return true;
  }

  return (
    path === normalizedBasePath ||
    path.startsWith(`${normalizedBasePath}/`) ||
    path.startsWith(`${normalizedBasePath}?`) ||
    path.startsWith(`${normalizedBasePath}#`)
  );
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
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath || !isPathInBasePath(path, normalizedBasePath)) {
    return path;
  }
  const suffix = path.slice(normalizedBasePath.length);
  if (!suffix) {
    return "/";
  }

  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

/**
 * Normalizes an application base path to a leading slash without a trailing
 * slash. The origin root is represented by an empty string.
 *
 * @param path the base path to normalize.
 * @returns the normalized application base path.
 */
export function normalizeBasePath(path: string): string {
  const pathname = path.trim();
  if (!pathname || pathname === "/") {
    return "";
  }
  const normalized = `${pathname.startsWith("/") ? "" : "/"}${pathname}`
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}
