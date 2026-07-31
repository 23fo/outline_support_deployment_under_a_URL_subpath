import { getCookie } from "tiny-cookie";
import sharedEnv from "@shared/env";
import { setPostLoginPath } from "./useLastVisitedPath";

const originalBasePath = sharedEnv.BASE_PATH;
const key = "postLoginRedirectPath";

afterEach(() => {
  window.history.replaceState({}, "", "/settings/");
  sharedEnv.BASE_PATH = originalBasePath;
  sessionStorage.clear();
  document.cookie = `${key}=; Max-Age=0; Path=/settings`;
  window.history.replaceState({}, "", "/");
});

describe("setPostLoginPath", () => {
  it("preserves an application route that begins with the base path", () => {
    sharedEnv.BASE_PATH = "/settings";
    window.history.replaceState({}, "", "/settings/authentication");

    setPostLoginPath("/settings/authentication?connected=true");

    expect(sessionStorage.getItem(key)).toBe(
      "/settings/authentication?connected=true"
    );
    expect(getCookie(key)).toBe("/settings/authentication?connected=true");

    window.history.replaceState({}, "", "/");
    expect(getCookie(key)).toBeNull();
  });
});
