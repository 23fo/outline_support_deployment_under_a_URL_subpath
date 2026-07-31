import { removeCookie, setCookie } from "tiny-cookie";
import { CSRF } from "@shared/constants";
import { getCSRFToken } from "./csrf";

describe("getCSRFToken", () => {
  afterEach(() => {
    removeCookie(CSRF.cookieName);
  });

  it("reads the regular cookie when no host-bound cookie is present", () => {
    setCookie(CSRF.cookieName, "token");

    expect(getCSRFToken()).toBe("token");
  });

  it("returns an empty string when no cookie is present", () => {
    expect(getCSRFToken()).toBe("");
  });
});
