import sharedEnv from "../env";
import { withoutBasePath } from "./subpath";

/**
 * parses the likely document identifier from a given URL.
 *
 * @param url the URL to parse.
 * @returns a document identifier or undefined if not found.
 */
export default function parseDocumentSlug(url: string) {
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
  const indexOfDoc = split.indexOf("doc");
  return split[indexOfDoc + 1] ?? undefined;
}
