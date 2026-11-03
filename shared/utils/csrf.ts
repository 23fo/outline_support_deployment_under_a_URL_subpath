import { CSRF } from "../constants";
import { normalizeBasePath } from "./subpath";

/**
 * returns the CSRF cookie name valid for the request origin and base path.
 *
 * @param secure whether the request uses HTTPS.
 * @param basePath the application base path.
 * @returns the CSRF cookie name.
 */
export function getCSRFTokenCookieName(
  secure: boolean,
  basePath: string
): string {
  return secure && !normalizeBasePath(basePath)
    ? CSRF.secureCookieName
    : CSRF.cookieName;
}
