/**
 * Returns the complete websocket URL served by the collaboration service.
 *
 * @param baseUrl the configured collaboration service URL.
 * @returns the collaboration websocket URL.
 */
export function collaborationUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/collaboration`;
  return url.toString();
}
