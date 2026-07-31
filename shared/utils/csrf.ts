import { CSRF } from "../constants";

/**
 * Returns the CSRF cookie name valid for the request origin and base path. The
 * `__Host-` prefix requires `Path=/`, so it is only usable at the domain root.
 *
 * @param secure whether the request uses HTTPS.
 * @param basePath the application base path.
 * @returns the CSRF cookie name.
 */
export function getCSRFTokenCookieName(
  secure: boolean,
  basePath: string
): string {
  return secure && !basePath ? CSRF.secureCookieName : CSRF.cookieName;
}
