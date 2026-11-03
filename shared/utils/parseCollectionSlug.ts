import sharedEnv from "../env";
import { withoutBasePath } from "./subpath";

/**
 * parses the likely collection identifier from a given URL.
 *
 * @param url the URL to parse.
 * @returns a collection identifier or undefined if not found.
 */
export default function parseCollectionSlug(url: string) {
  let pathname;
  try {
    const isApplicationPath = url.startsWith("/") && !url.startsWith("//");
    const parsed = isApplicationPath
      ? new URL(url, sharedEnv.URL)
      : new URL(url);
    pathname = isApplicationPath
      ? parsed.pathname
      : withoutBasePath(parsed.pathname);
  } catch (_err) {
    return;
  }

  const split = pathname.split("/");
  const indexOfCollection = split.indexOf("collection");
  return split[indexOfCollection + 1] ?? undefined;
}
