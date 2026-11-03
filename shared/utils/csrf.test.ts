import { CSRF } from "../constants";
import { getCSRFTokenCookieName } from "./csrf";

describe("getCSRFTokenCookieName", () => {
  it("uses a host-bound cookie only for secure root deployments", () => {
    expect(getCSRFTokenCookieName(true, "")).toBe(CSRF.secureCookieName);
    expect(getCSRFTokenCookieName(true, "/")).toBe(CSRF.secureCookieName);
  });

  it("uses the regular secure cookie for subpath deployments", () => {
    expect(getCSRFTokenCookieName(true, "/apps/knowledge")).toBe(
      CSRF.cookieName
    );
  });

  it("uses the regular cookie on insecure origins", () => {
    expect(getCSRFTokenCookieName(false, "")).toBe(CSRF.cookieName);
    expect(getCSRFTokenCookieName(false, "/apps/knowledge")).toBe(
      CSRF.cookieName
    );
  });
});
