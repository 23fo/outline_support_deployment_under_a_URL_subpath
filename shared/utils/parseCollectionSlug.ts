import { getAppPathname } from "./subpath";

/**
 * Parse the likely collection identifier from a given url.
 *
 * @param url The url to parse.
 * @returns A collection identifier or undefined if not found.
 */
export default function parseCollectionSlug(url: string) {
  const split = getAppPathname(url)?.split("/");
  if (!split) {
    return;
  }

  const indexOfCollection = split.indexOf("collection");
  return split[indexOfCollection + 1] ?? undefined;
}
