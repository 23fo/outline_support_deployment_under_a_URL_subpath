import { getCookie } from "tiny-cookie";
import { getCSRFTokenCookieName } from "@shared/utils/csrf";
import { getBasePath } from "@shared/utils/subpath";

/**
 * reads the CSRF token that the server attached to the current document.
 *
 * @returns The token, or an empty string when no CSRF cookie is present.
 */
export function getCSRFToken(): string {
  const cookieName = getCSRFTokenCookieName(
    window.location.protocol === "https:",
    getBasePath()
  );
  return getCookie(cookieName) ?? "";
}
