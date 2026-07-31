import { getAppPathname } from "./subpath";

/**
 * Parse the likely document identifier from a given url.
 *
 * @param url The url to parse.
 * @returns A document identifier or undefined if not found.
 */
export default function parseDocumentSlug(url: string) {
  const split = getAppPathname(url)?.split("/");
  if (!split) {
    return;
  }

  const indexOfDoc = split.indexOf("doc");
  return split[indexOfDoc + 1] ?? undefined;
}
